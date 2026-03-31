from typing import Dict, Iterable, Tuple

from .types import RiskLevel


FLAG_SCORES: Dict[str, int] = {
    # Example scoring from spec
    "unauthorized_work": 40,
    "sevis_termination_history": 35,
    "opt_unemployment_exceeded": 30,
    "enrollment_violation": 25,
    "opt_unemployment_warning": 20,
    "on_campus_work_violation": 10,
    "travel_risk": 8,
    "uscis_notice_received": 15,
    # Additional serious flags
    "cpt_enrollment_violation": 25,
    "invalid_stem_extension": 25,
    "cpt_hours_violation": 25,
    "reduced_course_load_review": 10,
    "stem_eligibility_unknown": 10,
}


def calculate_score(flags: Iterable[str]) -> Tuple[int, RiskLevel]:
    """Convert flags to a numerical risk score and level."""
    score = 0
    for flag in flags:
        score += FLAG_SCORES.get(flag, 0)

    # Clamp to 0–100
    score = max(0, min(score, 100))

    # Risk level buckets
    if score <= 25:
        level = RiskLevel.LOW
    elif score <= 50:
        level = RiskLevel.MEDIUM
    elif score <= 75:
        level = RiskLevel.HIGH
    else:
        level = RiskLevel.CRITICAL

    return score, level

