"""Lazy-seed institutions table from the same US university list as /universities."""
from __future__ import annotations

from services.us_university_catalog import load_us_university_names
from supabase_client import supabase

_CHUNK = 400


def ensure_institutions_seeded() -> None:
    """If institutions is empty, bulk-insert catalog rows (verification_status=catalog)."""
    try:
        check = supabase.table("institutions").select("id").limit(1).execute()
        data = getattr(check, "data", None)
        if isinstance(data, list) and len(data) > 0:
            return
    except Exception:
        return

    names = load_us_university_names()
    if not names:
        return

    rows = [
        {
            "display_name": n,
            "allowed_domains": [],
            "verification_status": "catalog",
        }
        for n in names
    ]
    for i in range(0, len(rows), _CHUNK):
        chunk = rows[i : i + _CHUNK]
        try:
            supabase.table("institutions").insert(chunk).execute()
        except Exception:
            # Idempotent re-runs: unique display_name may conflict
            for r in chunk:
                try:
                    supabase.table("institutions").insert(r).execute()
                except Exception:
                    pass
