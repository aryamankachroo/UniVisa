from datetime import date, timedelta
from typing import Optional

from .types import DeadlinesOutput, ImmigrationCaseInput


def compute_deadlines(case: ImmigrationCaseInput, today: Optional[date] = None) -> DeadlinesOutput:
    """Calculate important immigration deadlines."""
    if today is None:
        today = date.today()

    deadlines: list[date] = []

    # OPT filing window opens 90 days before program end
    opt_filing_open = case.programEnd - timedelta(days=90)
    deadlines.append(opt_filing_open)

    # Grace period ends 60 days after program end
    grace_period_end = case.programEnd + timedelta(days=60)
    deadlines.append(grace_period_end)

    # Choose the next upcoming deadline (closest date >= today)
    upcoming = [d for d in deadlines if d >= today]
    if not upcoming:
        return DeadlinesOutput(nextDeadline=None, daysUntilNextDeadline=None)

    next_deadline = min(upcoming)
    days_until = (next_deadline - today).days

    return DeadlinesOutput(nextDeadline=next_deadline, daysUntilNextDeadline=days_until)

