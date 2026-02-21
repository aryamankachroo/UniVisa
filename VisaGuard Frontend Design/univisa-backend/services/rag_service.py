"""RAG pipeline: embed query -> vector search -> Claude with context.
Uses ChromaDB for vector store (hackathon); replace with Actian VectorAI DB when available.
"""
import os
from pathlib import Path

from models.student import StudentProfile

# Lazy-loaded to avoid slow startup when not using chat
_embedding_model = None
_chroma_client = None
_chroma_collection = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _get_chroma_collection():
    """Get or create ChromaDB collection for USCIS doc chunks (persisted in data/)."""
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        import chromadb
        from chromadb.config import Settings
        persist_dir = str(Path(__file__).resolve().parent.parent / "data" / "chroma_db")
        _chroma_client = chromadb.PersistentClient(path=persist_dir, settings=Settings(anonymized_telemetry=False))
        _chroma_collection = _chroma_client.get_or_create_collection(
            name="uscis_docs",
            metadata={"description": "USCIS policy document chunks"},
        )
    return _chroma_collection


SYSTEM_PROMPT = """You are UniVisa's AI advisor — a specialized assistant for international students on F-1 and J-1 visas in the United States.

Your job is to answer visa compliance questions accurately and clearly, grounded ONLY in the policy documents provided to you as context.

Rules you must follow:
1. Never answer from general knowledge alone — always cite the provided context
2. If the context doesn't contain enough information to answer confidently, say so explicitly and recommend the student contact their DSO
3. Always end your response with: "Source: [document name, section]" for every claim you make
4. Use plain, clear English — not legal jargon
5. If the answer has serious consequences (deportation risk, visa termination), clearly flag this with: ⚠️ IMPORTANT: [consequence]
6. Never guess. Never hallucinate. A wrong answer here can ruin a student's life.

You know the student's profile: {student_context}
"""


def _vector_search(embedding: list[float], top_k: int = 5) -> list[dict]:
    """Query ChromaDB for top_k relevant chunks. Returns list of {source, text}."""
    coll = _get_chroma_collection()
    n = coll.count()
    if n == 0:
        return []
    results = coll.query(query_embeddings=[embedding], n_results=min(top_k, n), include=["documents", "metadatas"])
    out = []
    docs = results["documents"][0] if results["documents"] else []
    metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
    for i, text in enumerate(docs):
        meta = metas[i] if i < len(metas) else {}
        out.append({"source": meta.get("source", "USCIS"), "text": text or ""})
    return out


def query_rag(question: str, student_profile: StudentProfile) -> dict:
    """Embed question, retrieve top chunks, call Claude; return {answer, sources}."""
    model = _get_embedding_model()
    query_embedding = model.encode(question).tolist()
    relevant_chunks = _vector_search(query_embedding, top_k=5)

    if not relevant_chunks:
        return {
            "answer": "No policy documents have been ingested yet. For accurate F-1/J-1 guidance, please contact your Designated School Official (DSO) or international student office.",
            "sources": [],
        }
    context = "\n\n".join(
        f"[{chunk['source']}]\n{chunk['text']}" for chunk in relevant_chunks
    )
    student_context = f"""
    University: {student_profile.university}
    Visa: {student_profile.visa_type.value}
    Program ends: {student_profile.program_end_date}
    Enrollment: {student_profile.enrollment_status.value}
    On OPT: {student_profile.on_opt}
    Weekly work hours: {student_profile.weekly_work_hours}
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "answer": "AI advisor is not configured (missing ANTHROPIC_API_KEY). Please contact your DSO for visa compliance questions.",
            "sources": [chunk["source"] for chunk in relevant_chunks],
        }
    try:
        import anthropic
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT.format(student_context=student_context),
            messages=[
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question}",
                }
            ],
        )
        text = response.content[0].text if response.content else ""
        return {
            "answer": text,
            "sources": [chunk["source"] for chunk in relevant_chunks],
        }
    except Exception as e:
        return {
            "answer": f"Sorry, the AI advisor encountered an error. Please try again or contact your DSO. Error: {e!s}",
            "sources": [chunk["source"] for chunk in relevant_chunks],
        }
