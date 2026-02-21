from pydantic import BaseModel
from typing import Optional


class RiskFlag(BaseModel):
    category: str
    severity: str  # "high", "medium", "low"
    explanation: str
    days_until_critical: Optional[int] = None
    reddit_insight: Optional[str] = None  # derived from clustering


class RiskOutput(BaseModel):
    student_id: str
    risk_score: int  # 0-100
    risk_level: str  # "high", "medium", "low"
    flags: list[RiskFlag]
    alerts: list[dict]
    generated_at: str
