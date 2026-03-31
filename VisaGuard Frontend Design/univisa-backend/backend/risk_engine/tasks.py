from typing import Dict, Iterable, List


TASKS_BY_FLAG: Dict[str, str] = {
    "opt_unemployment_warning": "Secure qualifying employment immediately.",
    "on_campus_work_violation": "Reduce on-campus work hours to 20 or fewer per week.",
    "enrollment_violation": "Consult your DSO about enrollment requirements.",
    "sevis_termination_history": "Discuss SEVIS record history with your DSO.",
    "unauthorized_work": "Stop all unauthorized work and speak with your DSO or an immigration attorney.",
    "cpt_enrollment_violation": "Verify CPT authorization and full-time enrollment with your DSO.",
    "opt_unemployment_exceeded": "Contact your DSO immediately about options after exceeding unemployment limits.",
    "invalid_stem_extension": "Confirm STEM OPT eligibility and application status with your DSO.",
    "travel_risk": "Review travel plans with your DSO before leaving the US.",
    "uscis_notice_received": "Carefully review USCIS notices and respond by any listed deadlines.",
}


def generate_tasks(flags: Iterable[str]) -> List[str]:
    """Generate recommended actions based on flags."""
    tasks: list[str] = []
    seen: set[str] = set()

    for flag in flags:
        task = TASKS_BY_FLAG.get(flag)
        if task and task not in seen:
            seen.add(task)
            tasks.append(task)

    return tasks

