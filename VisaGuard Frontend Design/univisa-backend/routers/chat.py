"""AI advisor chat endpoint."""
from fastapi import APIRouter, HTTPException

from models.student import StudentProfile
from services.rag_service import query_rag
from routers.student import get_student_store

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=dict)
def chat(body: dict):
    """Body: { student_id, question }. Load profile, run RAG, return { answer, sources }."""
    question = body.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    store = get_student_store()
    student_id = (body.get("student_id") or "").strip()
    if student_id and student_id in store:
        profile: StudentProfile = store[student_id]
    elif "demo" in store:
        profile = store["demo"]
    else:
        raise HTTPException(status_code=404, detail="Student not found")
    try:
        result = query_rag(question.strip(), profile)
        return {
            "answer": result.get("answer") or "No response.",
            "sources": result.get("sources") or [],
        }
    except Exception as e:
        return {
            "answer": f"Sorry, the AI advisor encountered an error. Please try again or contact your DSO. Error: {e!s}",
            "sources": [],
        }
