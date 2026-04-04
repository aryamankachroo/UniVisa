"""Institution catalog for student picker and DSO claim (Supabase-backed)."""
from __future__ import annotations

from pydantic import BaseModel

from fastapi import APIRouter

from services.institutions_catalog import ensure_institutions_seeded
from supabase_client import supabase

router = APIRouter(prefix="/api/institutions", tags=["institutions"])


class InstitutionRef(BaseModel):
    id: str
    display_name: str


@router.get("", response_model=list[InstitutionRef])
def list_institutions() -> list[InstitutionRef]:
    """Return all catalog institutions (lazy-seeds from US university list if empty)."""
    ensure_institutions_seeded()
    try:
        resp = (
            supabase.table("institutions")
            .select("id, display_name")
            .order("display_name")
            .execute()
        )
        data = getattr(resp, "data", None) or []
    except Exception:
        return []

    out: list[InstitutionRef] = []
    for row in data:
        if isinstance(row, dict) and row.get("id") and row.get("display_name"):
            out.append(InstitutionRef(id=str(row["id"]), display_name=str(row["display_name"])))
    return out
