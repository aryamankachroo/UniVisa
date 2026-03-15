"""Student profile endpoints."""
import uuid

from fastapi import APIRouter, HTTPException

from models.student import StudentProfile, StudentProfileCreate, VisaType, EnrollmentStatus

# In-memory store for hackathon (key: student_id)
_students: dict[str, StudentProfile] = {}

router = APIRouter(prefix="/student", tags=["student"])


@router.post("/profile", response_model=dict)
def create_profile(body: StudentProfileCreate) -> dict:
    """Accept profile, store in memory, return student_id."""
    student_id = str(uuid.uuid4())
    profile = StudentProfile(
        student_id=student_id,
        **body.model_dump(),
    )
    _students[student_id] = profile
    return {"student_id": student_id}


@router.get("/{student_id}/profile")
def get_profile(student_id: str) -> StudentProfile:
    """Return stored student profile."""
    if student_id not in _students:
        raise HTTPException(status_code=404, detail="Student not found")
    return _students[student_id]


def get_student_store() -> dict[str, StudentProfile]:
    """Return the in-memory student store (for demo seeding and DSO router)."""
    return _students
