"""DSO dashboard endpoints."""
from datetime import date

from fastapi import APIRouter

from routers.student import get_student_store
from services.risk_engine import calculate_risk

router = APIRouter(prefix="/dso", tags=["dso"])


@router.get("/cohort")
def get_cohort():
    """List all students with risk score and top flag, sorted by risk score descending."""
    store = get_student_store()
    today = date.today()
    rows = []
    for sid, profile in store.items():
        out = calculate_risk(profile, today=today)
        top_flag = out.flags[0].category if out.flags else "All requirements met"
        rows.append({
            "student_id": sid,
            "full_name": profile.full_name,
            "country_of_origin": profile.country_of_origin,
            "visa_type": profile.visa_type.value,
            "program_end_date": str(profile.program_end_date),
            "risk_score": out.risk_score,
            "risk_level": out.risk_level,
            "top_risk_flag": top_flag,
            "flags": [f.model_dump() for f in out.flags],
        })
    rows.sort(key=lambda r: r["risk_score"], reverse=True)
    return rows
