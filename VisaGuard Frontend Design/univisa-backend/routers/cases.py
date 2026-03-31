from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.risk_engine.engine import analyze_case
from backend.risk_engine.types import ImmigrationCaseInput, RiskAnalysisResult
from supabase_client import supabase


router = APIRouter(prefix="/api/cases", tags=["cases"])


class SubmitCaseBody(BaseModel):
    clerkUserId: str
    immigration_case_input: ImmigrationCaseInput


@router.post("/submit", response_model=RiskAnalysisResult)
def submit_case(body: SubmitCaseBody) -> RiskAnalysisResult:
    """Analyze a case, persist questionnaire and result to Supabase, and return the risk analysis."""
    risk_result = analyze_case(body.immigration_case_input)

    # Upsert profile row
    supabase.table("profiles").upsert(
        {
            "clerk_user_id": body.clerkUserId,
            "full_name": body.immigration_case_input.fullName,
            "university": body.immigration_case_input.university,
            "country": body.immigration_case_input.country,
        }
    ).execute()

    # Insert questionnaire + risk result
    supabase.table("cases").insert(
        {
            "clerk_user_id": body.clerkUserId,
            "questionnaire": body.immigration_case_input.model_dump(mode="json"),
            "risk_result": risk_result.model_dump(mode="json"),
        }
    ).execute()

    return risk_result


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

    return DashboardResponse(profile=profile, risk=risk, questionnaire=questionnaire)

