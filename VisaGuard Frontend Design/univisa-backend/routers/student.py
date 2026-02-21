"""Student profile and risk endpoints."""
import uuid
from datetime import date

from fastapi import APIRouter, HTTPException

from models.student import StudentProfile, StudentProfileCreate, VisaType, EnrollmentStatus
from services.risk_engine import calculate_risk

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


@router.get("/{student_id}/risk")
def get_risk(student_id: str):
    """Run risk engine for the student, return RiskOutput."""
    if student_id not in _students:
        raise HTTPException(status_code=404, detail="Student not found")
    profile = _students[student_id]
    return calculate_risk(profile, today=date.today())


@router.get("/{student_id}/alerts")
def get_alerts(student_id: str):
    """Return list of alerts for this student sorted by urgency."""
    if student_id not in _students:
        raise HTTPException(status_code=404, detail="Student not found")
    profile = _students[student_id]
    output = calculate_risk(profile, today=date.today())
    return output.alerts


def get_student_store() -> dict[str, StudentProfile]:
    """Return the in-memory student store (for demo seeding and DSO router)."""
    return _students
