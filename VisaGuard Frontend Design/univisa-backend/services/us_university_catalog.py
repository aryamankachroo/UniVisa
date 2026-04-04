"""
US university names for /universities and institution seeding.

Primary source: Hipo's open dataset on GitHub (raw.githubusercontent.com), which is often
reachable when universities.hipolabs.com is blocked. Fallbacks: local JSON file, legacy API, tiny static list.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

import urllib.request

_logger = logging.getLogger(__name__)

# https://github.com/Hipo/university-domains-list (MIT)
_GITHUB_WORLD_JSON = (
    "https://raw.githubusercontent.com/Hipo/university-domains-list/"
    "master/world_universities_and_domains.json"
)
_HIPO_URL = "https://universities.hipolabs.com/search?country=United%20States"
_US_COUNTRY = "United States"

_backend_root = Path(__file__).resolve().parents[1]
_LOCAL_NAMES_FILE = _backend_root / "data" / "us_universities_names.json"

# Last-resort list so dev UI is usable if every network source fails.
_FALLBACK_US_NAMES = [
    "Carnegie Mellon University",
    "Columbia University",
    "Cornell University",
    "Georgia Institute of Technology",
    "Harvard University",
    "Massachusetts Institute of Technology",
    "New York University",
    "Northwestern University",
    "Princeton University",
    "Purdue University",
    "Stanford University",
    "University of California, Berkeley",
    "University of California, Los Angeles",
    "University of Chicago",
    "University of Michigan",
    "University of Pennsylvania",
    "University of Texas at Austin",
    "University of Washington",
    "Yale University",
]


def _names_from_hipo_shape(data: object) -> list[str]:
    if not isinstance(data, list):
        return []
    out: set[str] = set()
    for u in data:
        if not isinstance(u, dict):
            continue
        if u.get("country") != _US_COUNTRY:
            continue
        name = u.get("name")
        if isinstance(name, str) and name.strip():
            out.add(name.strip())
    return sorted(out)


def _load_local_json_file() -> list[str]:
    if not _LOCAL_NAMES_FILE.is_file():
        return []
    try:
        raw = _LOCAL_NAMES_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)
    except Exception as e:
        _logger.warning("Could not read %s: %s", _LOCAL_NAMES_FILE, e)
        return []
    if isinstance(data, list) and data and isinstance(data[0], str):
        return sorted({str(n).strip() for n in data if isinstance(n, str) and str(n).strip()})
    if isinstance(data, list):
        return _names_from_hipo_shape(data)
    return []


def _fetch_github_world_json() -> list[str]:
    try:
        req = urllib.request.Request(
            _GITHUB_WORLD_JSON,
            headers={"User-Agent": "UniVisa-backend/1.0"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        _logger.warning("GitHub university catalog fetch failed: %s", e)
        return []
    return _names_from_hipo_shape(data)


def _fetch_hipo_api() -> list[str]:
    try:
        with urllib.request.urlopen(_HIPO_URL, timeout=20) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        _logger.warning("Hipo Labs API fetch failed: %s", e)
        return []
    if not isinstance(data, list):
        return []
    return sorted(
        {u["name"] for u in data if isinstance(u, dict) and isinstance(u.get("name"), str)}
    )


def load_us_university_names() -> list[str]:
    """Return sorted unique US university display names."""
    names = _fetch_github_world_json()
    if names:
        return names

    names = _load_local_json_file()
    if names:
        _logger.info("Using local university list from %s (%d names)", _LOCAL_NAMES_FILE, len(names))
        return names

    names = _fetch_hipo_api()
    if names:
        _logger.info("Using Hipo Labs API fallback (%d names)", len(names))
        return names

    _logger.warning("All university sources failed; using embedded fallback list")
    return sorted(_FALLBACK_US_NAMES)
