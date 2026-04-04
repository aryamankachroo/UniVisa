"""
Policy alert ingestion pipeline for official US immigration sources.

Fetches RSS/Atom feeds, normalizes entries, deduplicates by fingerprint,
and persists to Supabase table `policy_alerts` when available.
Falls back to in-memory store if DB operations fail.
"""
from __future__ import annotations

import hashlib
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

from supabase_client import supabase

PolicySeverity = str  # "high" | "medium" | "info"

_memory_policy_alerts: dict[str, dict[str, Any]] = {}

SOURCE_FEEDS: list[dict[str, str]] = [
    {
        "source_name": "USCIS Newsroom",
        "source_url": "https://www.uscis.gov/newsroom/all-news",
        "feed_url": "https://www.uscis.gov/news/rss-feed",
    },
    {
        "source_name": "DHS News",
        "source_url": "https://www.dhs.gov/news",
        "feed_url": "https://www.dhs.gov/news-releases/rss.xml",
    },
    {
        "source_name": "ICE Newsroom",
        "source_url": "https://www.ice.gov/news/releases",
        "feed_url": "https://www.ice.gov/rss/news/releases.xml",
    },
    {
        "source_name": "Federal Register Immigration",
        "source_url": "https://www.federalregister.gov/topics/immigration",
        "feed_url": "https://www.federalregister.gov/api/v1/articles.json?conditions%5Bterm%5D=immigration&order=newest",
    },
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_html(text: str) -> str:
    if not text:
        return ""
    clean = re.sub(r"<[^>]+>", " ", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def _fingerprint(title: str, url: str) -> str:
    payload = f"{title.strip().lower()}|{url.strip().lower()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _tags_from_text(text: str) -> list[str]:
    t = text.lower()
    tags: list[str] = []
    if "f-1" in t or "f1" in t:
        tags.append("F-1")
    if "opt" in t:
        tags.append("OPT")
    if "stem" in t and "opt" in t:
        tags.append("STEM OPT")
    if "cpt" in t or "curricular practical training" in t:
        tags.append("CPT")
    if "j-1" in t or "j1" in t:
        tags.append("J-1")
    if "h-1b" in t or "h1b" in t:
        tags.append("H-1B")
    if "sevis" in t or "sevp" in t:
        tags.append("SEVIS")
    return sorted(set(tags))


def _severity_from_text(text: str) -> PolicySeverity:
    t = text.lower()
    if any(k in t for k in ["effective immediately", "termination", "ineligible", "deadline", "final rule"]):
        return "high"
    if any(k in t for k in ["policy manual", "guidance", "update", "extension", "notice"]):
        return "medium"
    return "info"


def _parse_rss_or_atom(xml_text: str, source_name: str, source_url: str) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_text)

    def lname(tag: str) -> str:
        return tag.rsplit("}", 1)[-1] if "}" in tag else tag

    # Handles RSS (<item>) and Atom (<entry>) with/without namespaces.
    all_nodes = list(root.iter())
    items = [n for n in all_nodes if lname(n.tag) == "item"]
    entries = [n for n in all_nodes if lname(n.tag) == "entry"]
    rows: list[dict[str, Any]] = []

    if items:
        for item in items:
            title = ""
            link = source_url
            desc = ""
            pub = ""
            for c in list(item):
                name = lname(c.tag)
                text = (c.text or "").strip()
                if name == "title" and text:
                    title = text
                elif name == "link" and text:
                    link = text
                elif name in {"description", "summary"} and text:
                    desc = _strip_html(text)
                elif name in {"pubDate", "published", "updated"} and text:
                    pub = text
            text = f"{title} {desc}"
            rows.append(
                {
                    "fingerprint": _fingerprint(title, link),
                    "title": title,
                    "description": desc[:900],
                    "source_name": source_name,
                    "source_url": link,
                    "severity": _severity_from_text(text),
                    "visa_relevance": _tags_from_text(text),
                    "published_at": pub or None,
                }
            )
    else:
        for entry in entries:
            title = ""
            link = source_url
            summary = ""
            pub = ""
            for c in list(entry):
                name = lname(c.tag)
                text = (c.text or "").strip()
                if name == "title" and text:
                    title = text
                elif name == "link":
                    href = c.attrib.get("href", "").strip()
                    if href:
                        link = href
                    elif text:
                        link = text
                elif name in {"summary", "content"} and text:
                    summary = _strip_html(text)
                elif name in {"updated", "published"} and text:
                    pub = text
            text = f"{title} {summary}"
            rows.append(
                {
                    "fingerprint": _fingerprint(title, link),
                    "title": title,
                    "description": summary[:900],
                    "source_name": source_name,
                    "source_url": link,
                    "severity": _severity_from_text(text),
                    "visa_relevance": _tags_from_text(text),
                    "published_at": pub or None,
                }
            )

    return [r for r in rows if r["title"] and r["source_url"]]


def _parse_federal_register_json(text: str, source_name: str) -> list[dict[str, Any]]:
    payload = __import__("json").loads(text)
    results = payload.get("results") if isinstance(payload, dict) else None
    if not isinstance(results, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in results:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        link = str(item.get("html_url") or item.get("pdf_url") or "").strip()
        abstract = _strip_html(str(item.get("abstract") or ""))
        pub = str(item.get("publication_date") or "").strip()
        if not title or not link:
            continue
        text_join = f"{title} {abstract}"
        rows.append(
            {
                "fingerprint": _fingerprint(title, link),
                "title": title,
                "description": abstract[:900],
                "source_name": source_name,
                "source_url": link,
                "severity": _severity_from_text(text_join),
                "visa_relevance": _tags_from_text(text_join),
                "published_at": pub or None,
            }
        )
    return rows


def _fetch_feed(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "UniVisa-PolicyBot/1.0"})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _upsert_rows(rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    now = _now_iso()
    payload = [{**r, "updated_at": now, "created_at": now} for r in rows]
    try:
        supabase.table("policy_alerts").upsert(payload, on_conflict="fingerprint").execute()
    except Exception:
        # Local fallback: in-memory cache only
        for r in payload:
            _memory_policy_alerts[r["fingerprint"]] = r


def ingest_policy_alerts(limit_per_source: int = 20) -> dict[str, Any]:
    collected: dict[str, dict[str, Any]] = {}
    source_stats: list[dict[str, Any]] = []
    for src in SOURCE_FEEDS:
        try:
            text = _fetch_feed(src["feed_url"])
            if "federalregister.gov/api/v1/articles.json" in src["feed_url"]:
                rows = _parse_federal_register_json(text, src["source_name"])
            else:
                rows = _parse_rss_or_atom(text, src["source_name"], src["source_url"])
            # Keep only fresh top entries per source
            rows = rows[: max(1, limit_per_source)]
            for r in rows:
                collected[r["fingerprint"]] = r
            source_stats.append({"source": src["source_name"], "fetched": len(rows), "ok": True})
        except Exception as e:
            source_stats.append({"source": src["source_name"], "fetched": 0, "ok": False, "error": str(e)})

    rows = list(collected.values())
    _upsert_rows(rows)
    return {"inserted_or_updated": len(rows), "sources": source_stats}


def list_policy_alerts(limit: int = 100) -> list[dict[str, Any]]:
    try:
        resp = (
            supabase.table("policy_alerts")
            .select("*")
            .order("published_at", desc=True)
            .limit(limit)
            .execute()
        )
        data = getattr(resp, "data", None) if resp is not None else None
        if isinstance(data, list):
            return data
    except Exception:
        pass

    # Fallback from in-memory cache
    values = list(_memory_policy_alerts.values())
    values.sort(key=lambda x: str(x.get("published_at") or ""), reverse=True)
    return values[:limit]

