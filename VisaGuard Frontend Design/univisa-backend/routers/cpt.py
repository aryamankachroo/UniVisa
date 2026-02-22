"""CPT requests — start before signing offer, DSO early visibility."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from models.cpt_request import CPTRequest, CPTRequestCreate, CPTRequestStatus
from routers.student import get_student_store

_store: dict[str, CPTRequest] = {}
router = APIRouter(prefix="/cpt", tags=["cpt"])


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/student/{student_id}/requests", response_model=CPTRequest)
def create_cpt_request(student_id: str, body: CPTRequestCreate):
    if student_id not in get_student_store():
        raise HTTPException(status_code=404, detail="Student not found")
    rid = str(uuid.uuid4())
    now = _ts()
    req = CPTRequest(
        id=rid,
        student_id=student_id,
        company_name=body.company_name,
        role=body.role,
        expected_start_date=body.expected_start_date,
        expected_end_date=body.expected_end_date,
        notes=body.notes,
        status=CPTRequestStatus.INTENT,
        signed_offer_uploaded_at=None,
        created_at=now,
        updated_at=now,
    )
    _store[rid] = req
    return req


@router.get("/student/{student_id}/requests")
def list_cpt_requests(student_id: str):
    if student_id not in get_student_store():
        raise HTTPException(status_code=404, detail="Student not found")
    out = [r for r in _store.values() if r.student_id == student_id]
    out.sort(key=lambda r: r.created_at, reverse=True)
    return out


@router.patch("/student/{student_id}/requests/{request_id}", response_model=CPTRequest)
def update_cpt_request(student_id: str, request_id: str, body: dict):
    if request_id not in _store:
        raise HTTPException(status_code=404, detail="CPT request not found")
    req = _store[request_id]
    if req.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not your request")
    now = _ts()
    updates: dict = {"updated_at": now}
    new_status = body.get("status")
    if new_status == CPTRequestStatus.OFFER_SIGNED.value and req.status == CPTRequestStatus.INTENT:
        updates["signed_offer_uploaded_at"] = now
        updates["status"] = CPTRequestStatus.OFFER_SIGNED
    elif new_status in (CPTRequestStatus.APPROVED.value, CPTRequestStatus.REJECTED.value):
        updates["status"] = CPTRequestStatus(new_status)
    req = req.model_copy(update=updates)
    _store[request_id] = req
    return req


@router.get("/dso/requests")
def dso_list_cpt_requests():
    store = get_student_store()
    return [
        {**r.model_dump(), "student_name": store[r.student_id].full_name if r.student_id in store else r.student_id}
        for r in sorted(_store.values(), key=lambda x: x.created_at, reverse=True)
    ]
