"""DSO dashboard: institution claim (email domain) and scoped student cohort."""
from __future__ import annotations

import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.clerk_auth import clerk_email_from_payload, get_clerk_payload, get_clerk_user_id
from supabase_client import supabase

router = APIRouter(prefix="/dso", tags=["dso"])


def _email_domain(email: str) -> str:
    parts = email.split("@", 1)
    if len(parts) != 2:
        return ""
    return parts[1].strip().lower()


class ClaimBody(BaseModel):
    institution_id: str


class MeInstitutionResponse(BaseModel):
    institution_id: str | None = None
    display_name: str | None = None
    role: str | None = None


class DsoStudentRow(BaseModel):
    clerk_user_id: str
    name: str
    country: str
    visa: str
    program_end: str
    risk_score: int
    risk_level: str | None = None
    top_risk_flag: str
    last_active: str | None = None
    tasks: list[str] = []
    flag_descriptions: list[str] = []


class DsoStudentsSummary(BaseModel):
    total: int
    high_risk: int
    medium_risk: int
    compliant: int


class DsoStudentsResponse(BaseModel):
    students: list[DsoStudentRow]
    summary: DsoStudentsSummary


def _member_institution_id(clerk_user_id: str) -> tuple[str, str] | None:
    """Return (institution_id, role) if this DSO is linked to an institution."""
    try:
        resp = (
            supabase.table("institution_members")
            .select("institution_id, role")
            .eq("clerk_user_id", clerk_user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", None) or []
        if not rows:
            return None
        r0 = rows[0]
        iid = r0.get("institution_id")
        role = r0.get("role") or "admin"
        if isinstance(iid, str) and iid:
            return (iid, str(role))
    except Exception:
        return None
    return None


def _institution_row(institution_id: str) -> dict[str, Any] | None:
    try:
        resp = supabase.table("institutions").select("*").eq("id", institution_id).limit(1).execute()
        rows = getattr(resp, "data", None) or []
        return rows[0] if rows else None
    except Exception:
        return None


@router.get("/me", response_model=MeInstitutionResponse)
def dso_me(
    clerk_user_id: str = Depends(get_clerk_user_id),
) -> MeInstitutionResponse:
    """Current DSO user's institution membership, if any."""
    mem = _member_institution_id(clerk_user_id)
    if not mem:
        return MeInstitutionResponse(institution_id=None, display_name=None, role=None)
    iid, role = mem
    inst = _institution_row(iid)
    name = inst.get("display_name") if inst else None
    return MeInstitutionResponse(institution_id=iid, display_name=name, role=role)


@router.post("/claim", response_model=MeInstitutionResponse)
def dso_claim(
    body: ClaimBody,
    payload: dict[str, Any] = Depends(get_clerk_payload),
    clerk_user_id: str = Depends(get_clerk_user_id),
) -> MeInstitutionResponse:
    """
    Claim DSO access to an institution.
    - If allowed_domains is empty, first successful claim locks allowed_domains to the signer's email domain.
    - Otherwise the user's email domain must be listed in allowed_domains.
    """
    email = clerk_email_from_payload(payload)
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Your Clerk session JWT must include an email claim. "
            "In Clerk Dashboard → Sessions → Customize session token → add {{user.primary_email_address}} as `email`.",
        )
    domain = _email_domain(email)
    if not domain:
        raise HTTPException(status_code=400, detail="Could not parse email domain")

    inst = _institution_row(body.institution_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    allowed = inst.get("allowed_domains") or []
    if not isinstance(allowed, list):
        allowed = []

    if len(allowed) == 0:
        supabase.table("institutions").update(
            {"allowed_domains": [domain], "verification_status": "active"}
        ).eq("id", body.institution_id).execute()
    else:
        allowed_lower = [str(d).strip().lower() for d in allowed if d]
        if domain not in allowed_lower:
            raise HTTPException(
                status_code=403,
                detail="Your email domain is not authorized for this institution. Contact your UniVisa admin.",
            )

    try:
        supabase.table("institution_members").upsert(
            {
                "institution_id": body.institution_id,
                "clerk_user_id": clerk_user_id,
                "role": "admin",
            },
            on_conflict="institution_id,clerk_user_id",
        ).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save membership: {e!s}") from e

    return MeInstitutionResponse(
        institution_id=body.institution_id,
        display_name=str(inst.get("display_name") or ""),
        role="admin",
    )


def _risk_bucket(risk_result: dict[str, Any] | None) -> str:
    """high | medium | compliant for summary cards."""
    if not risk_result:
        return "compliant"
    level = str(risk_result.get("riskLevel") or "").upper()
    if level in ("HIGH", "CRITICAL"):
        return "high"
    if level == "MEDIUM":
        return "medium"
    score = risk_result.get("riskScore")
    if isinstance(score, (int, float)):
        if score > 70:
            return "high"
        if score >= 40:
            return "medium"
    return "compliant"


def _top_flag(risk_result: dict[str, Any] | None) -> str:
    if not risk_result:
        return "No analysis on file"
    flags = risk_result.get("flags")
    if isinstance(flags, list) and flags:
        f0 = flags[0]
        if isinstance(f0, dict):
            desc = f0.get("description")
            if isinstance(desc, str) and desc.strip():
                return desc.strip()
            code = f0.get("code")
            if code:
                return str(code).replace("_", " ").title()
    tasks = risk_result.get("tasks")
    if isinstance(tasks, list) and tasks and isinstance(tasks[0], str):
        return tasks[0]
    return "All requirements met"


def _format_program_end(questionnaire: dict[str, Any] | None) -> str:
    if not questionnaire:
        return "—"
    raw = questionnaire.get("programEnd")
    if raw is None:
        return "—"
    s = str(raw)
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        try:
            y, m, d = s[:10].split("-")
            return f"{m}/{d}/{y}"
        except ValueError:
            pass
    return s


def _visa_label(questionnaire: dict[str, Any] | None) -> str:
    if questionnaire and questionnaire.get("visaType"):
        return str(questionnaire["visaType"])
    return "F-1"


def _relative_last_active(last_seen_at: str | None) -> str:
    if not last_seen_at:
        return "—"
    return last_seen_at  # ISO string; frontend can format — keep simple or use humanize in API later


@router.get("/students", response_model=DsoStudentsResponse)
def dso_students(
    clerk_user_id: str = Depends(get_clerk_user_id),
) -> DsoStudentsResponse:
    """Students at the DSO's institution with latest risk (respects share_with_institution)."""
    mem = _member_institution_id(clerk_user_id)
    if not mem:
        raise HTTPException(status_code=403, detail="No institution membership. Claim an institution first.")

    institution_id, _role = mem

    try:
        prof_resp = (
            supabase.table("profiles")
            .select("*")
            .eq("institution_id", institution_id)
            .eq("share_with_institution", True)
            .execute()
        )
        profiles = getattr(prof_resp, "data", None) or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profiles: {e!s}") from e

    clerk_ids = [p["clerk_user_id"] for p in profiles if isinstance(p, dict) and p.get("clerk_user_id")]
    latest_cases: dict[str, dict[str, Any]] = {}
    if clerk_ids:
        try:
            case_resp = (
                supabase.table("cases")
                .select("clerk_user_id, questionnaire, risk_result, created_at")
                .in_("clerk_user_id", clerk_ids)
                .order("created_at", desc=True)
                .execute()
            )
            for row in getattr(case_resp, "data", None) or []:
                if not isinstance(row, dict):
                    continue
                cid = row.get("clerk_user_id")
                if isinstance(cid, str) and cid and cid not in latest_cases:
                    latest_cases[cid] = row
        except Exception:
            pass

    students: list[DsoStudentRow] = []
    summary_counts = {"high": 0, "medium": 0, "compliant": 0}

    for p in profiles:
        if not isinstance(p, dict):
            continue
        cid = p.get("clerk_user_id")
        if not isinstance(cid, str):
            continue
        case = latest_cases.get(cid)
        q = case.get("questionnaire") if case else None
        rr = case.get("risk_result") if case else None
        if not isinstance(q, dict):
            q = None
        if not isinstance(rr, dict):
            rr = None

        bucket = _risk_bucket(rr)
        summary_counts[bucket] = summary_counts.get(bucket, 0) + 1

        risk_score = int(rr["riskScore"]) if rr and isinstance(rr.get("riskScore"), (int, float)) else 0
        risk_level = str(rr["riskLevel"]) if rr and rr.get("riskLevel") is not None else None

        tasks: list[str] = []
        if rr and isinstance(rr.get("tasks"), list):
            tasks = [str(t) for t in rr["tasks"] if isinstance(t, str)]

        flag_descs: list[str] = []
        if rr and isinstance(rr.get("flags"), list):
            for f in rr["flags"]:
                if isinstance(f, dict) and isinstance(f.get("description"), str) and f["description"].strip():
                    flag_descs.append(f["description"].strip())

        students.append(
            DsoStudentRow(
                clerk_user_id=cid,
                name=str(p.get("full_name") or "—"),
                country=str(p.get("country") or "—"),
                visa=_visa_label(q),
                program_end=_format_program_end(q),
                risk_score=risk_score,
                risk_level=risk_level,
                top_risk_flag=_top_flag(rr),
                last_active=_relative_last_active(p.get("last_seen_at")),
                tasks=tasks,
                flag_descriptions=flag_descs,
            )
        )

    total = len(students)
    summary = DsoStudentsSummary(
        total=total,
        high_risk=summary_counts["high"],
        medium_risk=summary_counts["medium"],
        compliant=summary_counts["compliant"],
    )
    return DsoStudentsResponse(students=students, summary=summary)
