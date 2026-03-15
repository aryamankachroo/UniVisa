from typing import List

from .types import ImmigrationCaseInput


def evaluate_rules(case: ImmigrationCaseInput) -> List[str]:
    """Deterministic compliance rules based on questionnaire input."""
    flags: list[str] = []

    # STUDYING RULES
    if case.enrollmentStatus == "not_enrolled":
        flags.append("enrollment_violation")
    elif case.enrollmentStatus == "reduced_course_load":
        flags.append("reduced_course_load_review")

    if case.workHours is not None and case.workHours > 20:
        flags.append("on_campus_work_violation")

    # CPT RULES
    if (
        case.currentStage == "cpt"
        and case.cptType == "full_time"
        and case.enrollmentStatus != "full_time"
    ):
        flags.append("cpt_enrollment_violation")

    if case.currentStage == "cpt" and case.cptHours is not None and case.cptHours > 20:
        flags.append("cpt_hours_violation")

    # OPT RULES
    if case.currentStage == "opt" and case.unemploymentDaysUsed is not None:
        if case.unemploymentDaysUsed >= 90:
            flags.append("opt_unemployment_exceeded")
        elif case.unemploymentDaysUsed >= 70:
            flags.append("opt_unemployment_warning")

    # STEM RULES
    if case.currentStage == "stem_opt":
        if case.stemEligible is False:
            flags.append("invalid_stem_extension")
        elif case.stemEligible is None:
            flags.append("stem_eligibility_unknown")

    # GLOBAL RULES
    if case.unauthorizedWork:
        flags.append("unauthorized_work")

    if case.sevisTerminatedBefore:
        flags.append("sevis_termination_history")

    if case.receivedUSCISNotices:
        flags.append("uscis_notice_received")

    if case.travelPlans and case.currentStage in ("opt", "stem_opt"):
        flags.append("travel_risk")

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_flags: list[str] = []
    for f in flags:
        if f not in seen:
            seen.add(f)
            unique_flags.append(f)

    return unique_flags

