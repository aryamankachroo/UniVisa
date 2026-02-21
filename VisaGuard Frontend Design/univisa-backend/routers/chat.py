"""AI advisor chat endpoint."""
from fastapi import APIRouter, HTTPException

from models.student import StudentProfile
from services.rag_service import query_rag
from routers.student import get_student_store

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=dict)
def chat(body: dict):
    """Body: { student_id, question }. Load profile, run RAG, return { answer, sources }."""
    student_id = body.get("student_id")
    question = body.get("question")
    if not student_id or not question:
        raise HTTPException(status_code=400, detail="student_id and question are required")
    store = get_student_store()
    if student_id not in store:
        raise HTTPException(status_code=404, detail="Student not found")
    profile: StudentProfile = store[student_id]
    return query_rag(question.strip(), profile)
