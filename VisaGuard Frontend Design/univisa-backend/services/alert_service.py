"""Alert generation from risk flags for student and DSO views."""
from typing import Any
from models.risk import RiskFlag


def generate_alerts(flags: list[RiskFlag]) -> list[dict[str, Any]]:
    """Convert risk flags into alert dicts sorted by urgency (high=1, medium=2, low=3)."""
    severity_order = {"high": 1, "medium": 2, "low": 3}
    alerts = []
    for f in flags:
        urgency = severity_order.get(f.severity, 3)
        alerts.append({
            "type": "deadline" if f.days_until_critical is not None else ("warning" if f.severity == "high" else "info"),
            "title": f.category,
            "description": f.explanation,
            "severity": f.severity,
            "urgency": urgency,
            "days_until_critical": f.days_until_critical,
        })
    alerts.sort(key=lambda a: (a["urgency"], a.get("days_until_critical") or 999))
    return alerts
