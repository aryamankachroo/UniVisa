"""CPT request — start process before signing offer, alert DSO early."""
from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class CPTRequestStatus(str, Enum):
    INTENT = "intent"
    OFFER_SIGNED = "offer_signed"
    APPROVED = "approved"
    REJECTED = "rejected"


class CPTRequestCreate(BaseModel):
    company_name: str
    role: str
    expected_start_date: date
    expected_end_date: date
    notes: Optional[str] = None


class CPTRequest(BaseModel):
    id: str
    student_id: str
    company_name: str
    role: str
    expected_start_date: date
    expected_end_date: date
    notes: Optional[str] = None
    status: CPTRequestStatus
    signed_offer_uploaded_at: Optional[str] = None
    created_at: str
    updated_at: str
