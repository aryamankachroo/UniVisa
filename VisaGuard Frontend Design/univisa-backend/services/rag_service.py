<<<<<<< HEAD
"""RAG pipeline: embed query -> vector search -> LLM (Gemini 2.5 Flash preferred, fallback Claude) with context.
=======
"""RAG pipeline: embed query -> vector search -> Gemini with context.
>>>>>>> 1abb0c8bfb04afefa68e7508e3210330250d88cc
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

# When no policy docs are loaded, give specific answers from general F-1/J-1 knowledge (not generic "consult DSO" only)
SYSTEM_PROMPT_NO_CONTEXT = """You are UniVisa's AI advisor for F-1 and J-1 international students in the US.

CRITICAL: You MUST answer the student's question with a direct, specific answer in your first 1-2 sentences. Do NOT reply with only or mainly "consult your DSO" or "I recommend consulting your DSO." That is not an answer.

Examples of what to do:
- "Can I work 10 hours on campus?" → Start with: "Yes. F-1 students may work up to 20 hours per week on campus during the academic term, so 10 hours is allowed."
- "What if I miss my CPT deadline?" → Start with: "Missing the CPT deadline can mean you are not authorized to work. You should contact your DSO immediately; they may help with a late application or alternatives."

Then in 1-2 more sentences add any important detail (e.g. consequences, next steps). End with one short line: "Confirm with your DSO for your specific situation."

Use plain English. For serious consequences (visa risk), start that part with: ⚠️ IMPORTANT:

Student profile: {student_context}
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
        except Exception:
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


# Chat: Gemini API only.
CHAT_SYSTEM_PROMPT = """You are UniVisa's AI advisor for F-1 and J-1 international students in the US. Answer the student's question clearly and specifically. Give a direct answer in your first 1-2 sentences (e.g. "Yes, F-1 students may work up to 20 hours per week on campus" or "Missing the CPT deadline can mean you're not authorized to work—contact your DSO immediately."). Do not reply with only "consult your DSO." Add a brief note at the end: "For your situation, confirm with your DSO." Use plain English. Student profile: {student_context}"""

<<<<<<< HEAD
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
=======

def _call_gemini_rest(question: str, system_prompt: str, api_key: str) -> dict:
    """Call Gemini via REST API. Returns {answer, sources}. Works with any valid API key."""
    import json
    import urllib.request
    import urllib.error

    last_err = None
    # Must be a tuple/list so we iterate over model names, not characters
    for model in ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite"):
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            body = {
                "contents": [{"parts": [{"text": question.strip()}]}],
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.4},
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
            text = ""
            for c in data.get("candidates", []) or []:
                for p in c.get("content", {}).get("parts", []) or []:
                    text += p.get("text", "") or ""
            text = (text or "").strip()
            if not text:
                continue
            return {"answer": text, "sources": ["UniVisa AI"]}
        except urllib.error.HTTPError as e:
            if e.code == 429:
                return {"answer": "The AI is getting too many requests. Please wait a moment and try again.", "sources": []}
            last_err = e
            continue
        except Exception as e:
            last_err = e
            continue
    return {
        "answer": f"Sorry, the AI could not respond. Please try again or contact your DSO. Error: {last_err!s}" if last_err else "Sorry, the AI could not respond. Please try again.",
        "sources": [],
    }


def query_rag(question: str, student_profile: StudentProfile) -> dict:
    """Answer using Gemini API only."""
    student_context = (
        f"University: {student_profile.university}, Visa: {student_profile.visa_type.value}, "
        f"Program ends: {student_profile.program_end_date}, Enrollment: {student_profile.enrollment_status.value}, "
        f"On OPT: {student_profile.on_opt}, Weekly work hours: {student_profile.weekly_work_hours}"
    )
    system_prompt = CHAT_SYSTEM_PROMPT.format(student_context=student_context)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "answer": "Add GEMINI_API_KEY to .env (get a key at https://aistudio.google.com/app/apikey) and restart the backend.",
            "sources": [],
>>>>>>> 1abb0c8bfb04afefa68e7508e3210330250d88cc
        }
    return _call_gemini_rest(question.strip(), system_prompt, api_key)
