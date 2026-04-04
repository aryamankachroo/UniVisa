from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.risk_engine.engine import analyze_case
from backend.risk_engine.types import ImmigrationCaseInput, RiskAnalysisResult
from supabase_client import supabase


router = APIRouter(prefix="/api/cases", tags=["cases"])


class SubmitCaseBody(BaseModel):
    clerkUserId: str
    institution_id: str | None = Field(None, alias="institutionId")
    immigration_case_input: ImmigrationCaseInput

    model_config = {"populate_by_name": True}


class ProfileSharingBody(BaseModel):
    clerk_user_id: str = Field(..., alias="clerkUserId")
    share_with_institution: bool = Field(..., alias="shareWithInstitution")

    model_config = {"populate_by_name": True}


@router.post("/submit", response_model=RiskAnalysisResult)
def submit_case(body: SubmitCaseBody) -> RiskAnalysisResult:
    """Analyze a case, persist questionnaire and result to Supabase, and return the risk analysis."""
    risk_result = analyze_case(body.immigration_case_input)

    profile_row: dict = {
        "clerk_user_id": body.clerkUserId,
        "full_name": body.immigration_case_input.fullName,
        "university": body.immigration_case_input.university,
        "country": body.immigration_case_input.country,
    }
    if body.institution_id:
        profile_row["institution_id"] = body.institution_id

    supabase.table("profiles").upsert(profile_row).execute()

    # Insert questionnaire + risk result
    supabase.table("cases").insert(
        {
            "clerk_user_id": body.clerkUserId,
            "questionnaire": body.immigration_case_input.model_dump(mode="json"),
            "risk_result": risk_result.model_dump(mode="json"),
        }
    ).execute()

    return risk_result


@router.patch("/profile/sharing")
def patch_profile_sharing(body: ProfileSharingBody) -> dict:
    """Let students opt in/out of appearing on their institution's DSO dashboard."""
    supabase.table("profiles").update({"share_with_institution": body.share_with_institution}).eq(
        "clerk_user_id", body.clerk_user_id
    ).execute()
    return {"ok": True}


class ProfileInstitutionBody(BaseModel):
    clerk_user_id: str = Field(..., alias="clerkUserId")
    institution_id: str | None = Field(None, alias="institutionId")

    model_config = {"populate_by_name": True}


@router.patch("/profile/institution")
def patch_profile_institution(body: ProfileInstitutionBody) -> dict:
    """Link profile to a catalog institution (sets institution_id + university display name)."""
    if not body.institution_id or not str(body.institution_id).strip():
        supabase.table("profiles").update({"institution_id": None}).eq("clerk_user_id", body.clerk_user_id).execute()
        return {"ok": True, "displayName": None}

    iid = str(body.institution_id).strip()
    inst_resp = supabase.table("institutions").select("display_name").eq("id", iid).limit(1).execute()
    rows = getattr(inst_resp, "data", None) or []
    if not rows:
        raise HTTPException(status_code=404, detail="Unknown institution id")
    display_name = str(rows[0].get("display_name") or "")

    supabase.table("profiles").update({"institution_id": iid, "university": display_name}).eq(
        "clerk_user_id", body.clerk_user_id
    ).execute()
    return {"ok": True, "displayName": display_name}


class DashboardResponse(BaseModel):
    profile: dict | None
    risk: dict | None
    questionnaire: dict | None


@router.get("/me", response_model=DashboardResponse)
def get_my_dashboard(clerk_user_id: str = Query(..., alias="clerk_user_id")) -> DashboardResponse:
    """Return the latest saved case and profile for the given Clerk user."""
    profile: dict | None = None
    latest: dict | None = None

    try:
        profile_resp = (
            supabase.table("profiles")
            .select("*")
            .eq("clerk_user_id", clerk_user_id)
            .execute()
        )
        profile_data = getattr(profile_resp, "data", None) if profile_resp is not None else None
        if profile_data:
            profile = profile_data[0] if isinstance(profile_data, list) else profile_data
    except Exception:
        profile = None

    try:
        cases_resp = (
            supabase.table("cases")
            .select("*")
            .eq("clerk_user_id", clerk_user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        cases_data = getattr(cases_resp, "data", None) if cases_resp is not None else None
        if isinstance(cases_data, list) and cases_data:
            latest = cases_data[0]
    except Exception:
        latest = None

    if not profile and not latest:
        raise HTTPException(status_code=404, detail="No data found for this user")

    risk = latest["risk_result"] if latest else None
    questionnaire = latest["questionnaire"] if latest else None

    if profile:
        try:
            supabase.table("profiles").update(
                {"last_seen_at": datetime.now(timezone.utc).isoformat()}
            ).eq("clerk_user_id", clerk_user_id).execute()
        except Exception:
            pass

    return DashboardResponse(profile=profile, risk=risk, questionnaire=questionnaire)

