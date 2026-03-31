from datetime import date

from fastapi import APIRouter

from backend.risk_engine.engine import analyze_case
from backend.risk_engine.types import ImmigrationCaseInput, RiskAnalysisResult


router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.post("/analyze", response_model=RiskAnalysisResult)
def analyze_compliance(body: ImmigrationCaseInput) -> RiskAnalysisResult:
    """Analyze an immigration case using the deterministic compliance engine."""
    return analyze_case(body, today=date.today())

