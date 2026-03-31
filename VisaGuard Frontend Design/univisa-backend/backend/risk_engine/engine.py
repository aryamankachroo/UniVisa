from datetime import date
from typing import Optional

from .deadlines import compute_deadlines
from .rules import evaluate_rules
from .scoring import calculate_score
from .tasks import generate_tasks
from .types import ComplianceFlag, ImmigrationCaseInput, RiskAnalysisResult


def analyze_case(case: ImmigrationCaseInput, today: Optional[date] = None) -> RiskAnalysisResult:
    """Main entry point: analyze an immigration case and return structured risk analysis."""
    flags_raw = evaluate_rules(case)
    score, level = calculate_score(flags_raw)
    deadlines = compute_deadlines(case, today=today)
    tasks = generate_tasks(flags_raw)

    flags = [ComplianceFlag(code=code) for code in flags_raw]

    return RiskAnalysisResult(
        riskScore=score,
        riskLevel=level,
        flags=flags,
        tasks=tasks,
        deadlines=deadlines,
    )

