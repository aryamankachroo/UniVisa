"""RAG pipeline: embed query -> vector search -> LLM (Gemini 2.5 Flash preferred, fallback Claude) with context.
Uses Actian VectorAI DB when ACTIAN_VECTORAI_URL is set (see github.com/hackmamba-io/actian-vectorAI-db-beta),
otherwise ChromaDB (data/chroma_db/).
"""
import os
from pathlib import Path

from models.student import StudentProfile

# all-MiniLM-L6-v2 embedding dimension
EMBED_DIM = 384
COLLECTION_NAME = "uscis_docs"

# Lazy-loaded to avoid slow startup when not using chat
_embedding_model = None
_chroma_client = None
_chroma_collection = None
_actian_client = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _use_actian() -> bool:
    return bool(os.getenv("ACTIAN_VECTORAI_URL", "").strip())


def _get_actian_client():
    """Lazy init Actian VectorAI DB client (requires actiancortex wheel from actian-vectorAI-db-beta)."""
    global _actian_client
    if _actian_client is None:
        try:
            from cortex import CortexClient, DistanceMetric
        except ImportError as e:
            raise ImportError(
                "Actian VectorAI DB is set (ACTIAN_VECTORAI_URL) but the cortex client is not installed. "
                "Install from: https://github.com/hackmamba-io/actian-vectorAI-db-beta "
                "e.g. pip install actiancortex-0.1.0b1-py3-none-any.whl"
            ) from e
        url = os.getenv("ACTIAN_VECTORAI_URL", "localhost:50051").strip()
        if url.startswith("http://"):
            url = url[7:]
        if url.startswith("https://"):
            url = url[8:]
        host, _, port = url.partition(":")
        if not port:
            port = "50051"
        addr = f"{host}:{port}"
        _actian_client = CortexClient(addr)
        if not _actian_client.has_collection(COLLECTION_NAME):
            _actian_client.create_collection(
                name=COLLECTION_NAME,
                dimension=EMBED_DIM,
                distance_metric=DistanceMetric.COSINE,
            )
    return _actian_client


def _get_chroma_collection():
    """Get or create ChromaDB collection for USCIS doc chunks (persisted in data/)."""
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        import chromadb
        from chromadb.config import Settings
        persist_dir = str(Path(__file__).resolve().parent.parent / "data" / "chroma_db")
        _chroma_client = chromadb.PersistentClient(path=persist_dir, settings=Settings(anonymized_telemetry=False))
        _chroma_collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
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
    """Query vector store for top_k relevant chunks. Returns list of {source, text}."""
    if _use_actian():
        try:
            client = _get_actian_client()
            n = client.count(COLLECTION_NAME)
            if n == 0:
                return []
            results = client.search(COLLECTION_NAME, query=embedding, top_k=min(top_k, n))
            out = []
            for r in results:
                payload = r.payload if hasattr(r, "payload") else {}
                out.append({
                    "source": payload.get("source", "USCIS"),
                    "text": payload.get("text", ""),
                })
            return out
        except Exception as e:
            return []
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

    context = (
        "\n\n".join(f"[{chunk['source']}]\n{chunk['text']}" for chunk in relevant_chunks)
        if relevant_chunks
        else "(No policy documents have been ingested yet. Answer from your knowledge of F-1/J-1 rules and recommend the student confirm with their DSO for official guidance.)"
    )
    student_context = f"""
    University: {student_profile.university}
    Visa: {student_profile.visa_type.value}
    Program ends: {student_profile.program_end_date}
    Enrollment: {student_profile.enrollment_status.value}
    On OPT: {student_profile.on_opt}
    Weekly work hours: {student_profile.weekly_work_hours}
    """
    # Prefer Gemini 2.5 Flash (GOOGLE_API_KEY or GEMINI_API_KEY), fallback to Anthropic
    gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key.strip())
            model = genai.GenerativeModel("gemini-2.5-flash")
            full_prompt = (
                SYSTEM_PROMPT.format(student_context=student_context)
                + "\n\nContext:\n"
                + context
                + "\n\nQuestion: "
                + question
            )
            response = model.generate_content(full_prompt)
            text = response.text if response.text else ""
            return {
                "answer": text,
                "sources": [chunk["source"] for chunk in relevant_chunks],
            }
        except Exception as e:
            return {
                "answer": f"Sorry, the AI advisor encountered an error. Please try again or contact your DSO. Error: {e!s}",
                "sources": [chunk["source"] for chunk in relevant_chunks],
            }
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {
            "answer": "AI advisor is not configured (set GOOGLE_API_KEY or GEMINI_API_KEY in .env). Please contact your DSO for visa compliance questions.",
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
