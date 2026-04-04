from __future__ import annotations

from fastapi import APIRouter, Query

from services.policy_alert_ingest import ingest_policy_alerts, list_policy_alerts

router = APIRouter(prefix="/api/policy-alerts", tags=["policy-alerts"])


@router.get("")
def get_policy_alerts(limit: int = Query(default=50, ge=1, le=200)):
    rows = list_policy_alerts(limit=limit)
    return rows


@router.post("/refresh")
def refresh_policy_alerts(limit_per_source: int = Query(default=20, ge=1, le=100)):
    return ingest_policy_alerts(limit_per_source=limit_per_source)

