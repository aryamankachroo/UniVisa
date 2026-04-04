from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from supabase_client import supabase

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

Severity = Literal["high", "medium", "low"]
AlertType = Literal["deadline", "warning", "info"]
AlertStatus = Literal["active", "resolved", "snoozed"]


class AlertActionBody(BaseModel):
    clerkUserId: str
    alertId: str
    action: Literal["mark_read", "mark_unread", "resolve", "reopen", "snooze", "unsnooze"]
    snoozeDays: int | None = None


_alert_state: dict[str, dict[str, dict[str, Any]]] = {}


def _humanize_code(code: str) -> str:
    return code.replace("_", " ").title()


def _severity_rank(severity: Severity) -> int:
    return {"high": 0, "medium": 1, "low": 2}[severity]


def _flag_to_severity(code: str) -> Severity:
    high = {
        "unauthorized_work",
        "sevis_termination_history",
        "opt_unemployment_exceeded",
        "enrollment_violation",
        "cpt_enrollment_violation",
        "invalid_stem_extension",
        "cpt_hours_violation",
    }
    medium = {
        "opt_unemployment_warning",
        "uscis_notice_received",
        "on_campus_work_violation",
        "reduced_course_load_review",
        "stem_eligibility_unknown",
        "travel_risk",
    }
    if code in high:
        return "high"
    if code in medium:
        return "medium"
    return "low"


def _get_latest_case(clerk_user_id: str) -> dict[str, Any] | None:
    try:
        resp = (
            supabase.table("cases")
            .select("*")
            .eq("clerk_user_id", clerk_user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        data = getattr(resp, "data", None) if resp is not None else None
        if isinstance(data, list) and data:
            return data[0]
    except Exception:
        return None
    return None


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _state_for(clerk_user_id: str, alert_id: str) -> dict[str, Any]:
    user_state = _alert_state.setdefault(clerk_user_id, {})
    return user_state.setdefault(
        alert_id,
        {"is_read": False, "status": "active", "snooze_until": None, "updated_at": _now_utc().isoformat()},
    )


def _smart_action(alert_type: AlertType, code: str | None) -> tuple[str, str]:
    if alert_type == "deadline":
        return ("Open Profile", "/profile")
    if code in {"unauthorized_work", "sevis_termination_history"}:
        return ("Open AI Advisor", "/ai-advisor")
    if code and "cpt" in code:
        return ("Open CPT / Internship", "/cpt")
    return ("View in Dashboard", "/dashboard")


@router.get("")
def list_alerts(clerk_user_id: str = Query(..., alias="clerk_user_id")) -> list[dict[str, Any]]:
    latest = _get_latest_case(clerk_user_id)
    if not latest:
        return []

    risk = latest.get("risk_result") or {}
    flags = risk.get("flags") or []
    deadlines = risk.get("deadlines") or {}
    tasks = risk.get("tasks") or []

    alerts: list[dict[str, Any]] = []
    next_deadline = deadlines.get("nextDeadline")
    days_until = deadlines.get("daysUntilNextDeadline")
    if next_deadline is not None and days_until is not None:
        alert_id = "deadline:next"
        action_label, action_route = _smart_action("deadline", None)
        alerts.append(
            {
                "id": alert_id,
                "type": "deadline",
                "title": "Next compliance deadline",
                "description": f"Your next deadline is {next_deadline}.",
                "severity": "high" if isinstance(days_until, int) and days_until <= 7 else "medium",
                "urgency": 0,
                "days_until_critical": days_until,
                "action_type": "navigate",
                "action_payload": {"label": action_label, "route": action_route},
            }
        )

    for f in flags:
        code = (f or {}).get("code", "")
        description = (f or {}).get("description") or None
        if not code:
            continue
        severity = _flag_to_severity(code)
        alert_type: AlertType = "warning" if severity == "high" else "info"
        action_label, action_route = _smart_action(alert_type, code)
        alerts.append(
            {
                "id": f"flag:{code}",
                "type": alert_type,
                "title": description or _humanize_code(code),
                "description": description or "Compliance rule flagged this item for review.",
                "severity": severity,
                "urgency": _severity_rank(severity),
                "days_until_critical": None,
                "flag_code": code,
                "action_type": "navigate",
                "action_payload": {"label": action_label, "route": action_route},
            }
        )

    for i, task in enumerate(tasks):
        action_label, action_route = _smart_action("info", None)
        alerts.append(
            {
                "id": f"task:{i}",
                "type": "info",
                "title": "Suggested compliance task",
                "description": str(task),
                "severity": "low",
                "urgency": 3,
                "days_until_critical": None,
                "action_type": "navigate",
                "action_payload": {"label": action_label, "route": action_route},
            }
        )

    out: list[dict[str, Any]] = []
    now = _now_utc()
    for a in alerts:
        st = _state_for(clerk_user_id, a["id"])
        status: AlertStatus = st.get("status", "active")
        snooze_until_raw = st.get("snooze_until")
        snooze_until: str | None = str(snooze_until_raw) if snooze_until_raw else None

        if status == "snoozed" and snooze_until:
            try:
                if datetime.fromisoformat(snooze_until) > now:
                    continue
                status = "active"
                st["status"] = "active"
            except Exception:
                pass

        if status == "resolved":
            continue

        out.append(
            {
                **a,
                "is_read": bool(st.get("is_read", False)),
                "status": status,
                "snooze_until": snooze_until,
                "updated_at": st.get("updated_at"),
            }
        )

    # Deadline-first, then severity, then stable id
    out.sort(
        key=lambda a: (
            0 if a.get("days_until_critical") is not None else 1,
            (a.get("days_until_critical") if a.get("days_until_critical") is not None else 10_000),
            a.get("urgency", 99),
            a.get("id", ""),
        )
    )
    return out


@router.post("/action")
def apply_alert_action(body: AlertActionBody) -> dict[str, Any]:
    if not body.clerkUserId or not body.alertId:
        raise HTTPException(status_code=400, detail="Missing user or alert id")

    st = _state_for(body.clerkUserId, body.alertId)
    if body.action == "mark_read":
        st["is_read"] = True
    elif body.action == "mark_unread":
        st["is_read"] = False
    elif body.action == "resolve":
        st["status"] = "resolved"
    elif body.action == "reopen":
        st["status"] = "active"
        st["snooze_until"] = None
    elif body.action == "snooze":
        days = body.snoozeDays or 1
        st["status"] = "snoozed"
        st["snooze_until"] = (_now_utc() + timedelta(days=days)).isoformat()
    elif body.action == "unsnooze":
        st["status"] = "active"
        st["snooze_until"] = None

    st["updated_at"] = _now_utc().isoformat()
    return {"ok": True}

