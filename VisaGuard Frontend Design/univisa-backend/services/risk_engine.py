"""Rule-based risk scoring engine for F-1/J-1 visa compliance."""
import json
from pathlib import Path
from datetime import date

from models.student import StudentProfile, EnrollmentStatus
from models.risk import RiskFlag, RiskOutput
from services.alert_service import generate_alerts

# Map risk flag categories to cluster labels for reddit_insight (from data/clusters.json)
CLUSTER_LABELS: dict[str, str] = {
    "OPT Application Timing": "OPT timing confusion",
    "Enrollment Status Violation": "Enrollment status and full-time requirement",
    "Work Hour Violation": "On-campus work hour violations",
    "Work Hours Approaching Limit": "On-campus work hour violations",
    "International Travel Risk": None,
    "Program End Approaching": "OPT timing confusion",
    "OPT Expiring Soon": "OPT timing confusion",
}


def _load_cluster_insight(category: str) -> str | None:
    """Return reddit_insight label for a flag category from clusters.json."""
    path = Path(__file__).resolve().parent.parent / "data" / "clusters.json"
    if not path.exists():
        return CLUSTER_LABELS.get(category)
    try:
        with open(path, encoding="utf-8") as f:
            clusters = json.load(f)
        for cid, data in clusters.items():
            if isinstance(data, dict) and data.get("label") == CLUSTER_LABELS.get(category):
                return f"Community insight: {data['label']}"
        return CLUSTER_LABELS.get(category)
    except Exception:
        return CLUSTER_LABELS.get(category)


def calculate_risk(profile: StudentProfile, today: date | None = None) -> RiskOutput:
    """Rule-based risk score and flags. today defaults to date.today()."""
    if today is None:
        today = date.today()
    score = 0
    flags: list[RiskFlag] = []

    # Rule 1: OPT application timing
    if not profile.on_opt and not profile.on_cpt:
        days_to_program_end = (profile.program_end_date - today).days
        opt_application_deadline = days_to_program_end - 90
        if opt_application_deadline < 30:
            score += 35
            reddit_insight = _load_cluster_insight("OPT Application Timing")
            flags.append(RiskFlag(
                category="OPT Application Timing",
                severity="high",
                explanation=(
                    f"Your OPT application window opens in approximately "
                    f"{opt_application_deadline} days. "
                    f"Missing this window means losing your right to work post-graduation."
                ),
                days_until_critical=opt_application_deadline,
                reddit_insight=reddit_insight,
            ))
        elif opt_application_deadline < 60:
            score += 15
            flags.append(RiskFlag(
                category="OPT Application Timing",
                severity="medium",
                explanation=(
                    "Your OPT application window is approaching. Begin gathering documents now."
                ),
                days_until_critical=opt_application_deadline,
            ))

    # Rule 2: Full-time enrollment requirement
    if profile.enrollment_status == EnrollmentStatus.PART_TIME:
        score += 40
        reddit_insight = _load_cluster_insight("Enrollment Status Violation")
        flags.append(RiskFlag(
            category="Enrollment Status Violation",
            severity="high",
            explanation=(
                "F-1 students must maintain full-time enrollment during the academic year "
                "unless authorized by DSO. Part-time status without authorization is a "
                "SEVIS violation."
            ),
            reddit_insight=reddit_insight,
        ))

    # Rule 3: On-campus work hours
    if profile.weekly_work_hours > 20:
        score += 30
        reddit_insight = _load_cluster_insight("Work Hour Violation")
        flags.append(RiskFlag(
            category="Work Hour Violation",
            severity="high",
            explanation=(
                f"You reported {profile.weekly_work_hours} hours/week. F-1 students may not "
                f"work more than 20 hours per week on campus during the academic year. "
                f"This is a deportable offense."
            ),
            reddit_insight=reddit_insight,
        ))
    elif profile.weekly_work_hours > 17:
        score += 10
        reddit_insight = _load_cluster_insight("Work Hours Approaching Limit")
        flags.append(RiskFlag(
            category="Work Hours Approaching Limit",
            severity="medium",
            explanation=(
                f"You are at {profile.weekly_work_hours} hrs/week — close to the 20hr limit. "
                f"Track carefully."
            ),
            reddit_insight=reddit_insight,
        ))

    # Rule 4: Travel without valid visa stamp
    if profile.traveling_soon:
        score += 15
        flags.append(RiskFlag(
            category="International Travel Risk",
            severity="medium",
            explanation=(
                "Ensure your visa stamp, I-20, and travel signature are all valid before "
                "departing. Expired visa stamps require renewal at a US consulate abroad "
                "before reentry."
            ),
        ))

    # Rule 5: Program end proximity without OPT/CPT
    days_to_end = (profile.program_end_date - today).days
    if days_to_end < 60 and not profile.on_opt:
        score += 20
        flags.append(RiskFlag(
            category="Program End Approaching",
            severity="high",
            explanation=(
                f"Your program ends in {days_to_end} days and you have no active OPT/CPT. "
                f"You must have authorization to remain in the US after your program end date."
            ),
            days_until_critical=days_to_end,
        ))

    # Rule 6: OPT gap period
    if profile.on_opt and profile.opt_end_date:
        days_to_opt_end = (profile.opt_end_date - today).days
        if days_to_opt_end < 30:
            score += 25
            flags.append(RiskFlag(
                category="OPT Expiring Soon",
                severity="high",
                explanation=(
                    f"Your OPT expires in {days_to_opt_end} days. Ensure you have an H-1B "
                    f"cap-gap extension or other status if remaining in US."
                ),
                days_until_critical=days_to_opt_end,
            ))

    score = min(score, 100)
    risk_level = "high" if score > 65 else "medium" if score > 35 else "low"

    return RiskOutput(
        student_id=profile.student_id,
        risk_score=score,
        risk_level=risk_level,
        flags=flags,
        alerts=generate_alerts(flags),
        generated_at=str(today),
    )
