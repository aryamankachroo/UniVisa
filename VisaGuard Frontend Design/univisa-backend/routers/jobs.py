import os
import re
import urllib.request
import urllib.parse
import json
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/jobs", tags=["jobs"])

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "").strip()
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "").strip()
ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs/us/search"

INTL_FRIENDLY_KEYWORDS = [
    "opt","cpt","f-1","f1 visa","stem opt","stem extension",
    "h-1b","h1b","visa sponsor","will sponsor",
    "sponsorship provided","sponsorship available",
    "e-verify","everify","international student",
    "international students welcome","work authorization",
    "uscis","curricular practical training",
    "optional practical training","all work authorizations",
    "all visa types"
]

EXCLUSION_KEYWORDS = [
    "us citizen only","u.s. citizen only","citizens only",
    "security clearance required",
    "must be authorized to work without sponsorship",
    "no sponsorship","no visa sponsorship","cannot sponsor",
    "will not sponsor","sponsorship not available",
    "greencard only","green card only"
]

QUERY_NORMALIZATIONS = {
    # Common abbreviations / noisy terms
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "sde": "software engineer",
    "swe": "software engineer",
    "devops": "devops",
}


def _normalized_query(q: str) -> str:
    tokens = re.findall(r"[a-zA-Z0-9\+\#\-]+", q.lower())
    expanded: list[str] = []
    for t in tokens:
        if t in QUERY_NORMALIZATIONS:
            expanded.extend(QUERY_NORMALIZATIONS[t].split())
        else:
            expanded.append(t)
    return " ".join(expanded).strip()


def _build_query_candidates(q: str) -> list[str]:
    """
    Build broad, forgiving query variants so adding extra words doesn't collapse results.
    Order matters: try most specific first, then broader fallbacks.
    """
    base = (q or "").strip()
    if not base:
        return ["software engineer"]

    normalized = _normalized_query(base)
    tokens = normalized.split()

    candidates: list[str] = [base]
    if normalized and normalized != base.lower():
        candidates.append(normalized)

    # Keep the first 2-3 intent-bearing words as broad fallback.
    if len(tokens) >= 2:
        candidates.append(" ".join(tokens[:2]))
    if len(tokens) >= 3:
        candidates.append(" ".join(tokens[:3]))

    # Head + tail captures cases like "ml engineer ai" -> "machine learning engineer"
    if len(tokens) >= 3:
        candidates.append(" ".join(tokens[:-1]))

    # Final generic fallback
    candidates.append(tokens[0] if tokens else "software engineer")

    # De-duplicate while preserving order.
    seen = set()
    out: list[str] = []
    for c in candidates:
        c = c.strip()
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def detect_visa_types(text):
    t = text.lower()
    types = []

    if any(k in t for k in ["cpt","curricular practical training"]):
        types.append("F-1 CPT")
    if any(k in t for k in ["opt","optional practical training"]) and "stem" not in t:
        types.append("F-1 OPT")
    if any(k in t for k in ["stem opt","stem extension","24-month","24 month"]):
        types.append("OPT STEM Extension")
    if "j-1" in t or "j1" in t:
        types.append("J-1")
    if any(k in t for k in ["h-1b","h1b","visa sponsor"]):
        types.append("H-1B Sponsor")

    if not types and any(k in t for k in ["international student","all work authorizations","all visa types"]):
        types = ["F-1 OPT","F-1 CPT"]

    return types


def is_international_friendly(title, description):
    combined = (title + " " + description).lower()

    if any(k in combined for k in EXCLUSION_KEYWORDS):
        return False

    return any(k in combined for k in INTL_FRIENDLY_KEYWORDS)


def fetch_adzuna(keyword, location="", results_per_page=50, page=1):
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        raise HTTPException(
            status_code=503,
            detail="Adzuna API credentials not configured"
        )

    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": results_per_page,
        "what": keyword,
        "sort_by": "date",
        "salary_include_unknown": 1,
    }

    if location:
        params["where"] = location

    url = f"{ADZUNA_BASE}/{page}?{urllib.parse.urlencode(params)}"

    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        return data.get("results", [])
    except urllib.error.HTTPError as e:
        detail = f"Adzuna API error: {e.code}"
        try:
            body = e.read().decode(errors="ignore").strip()
            if body:
                detail = f"{detail} - {body[:400]}"
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Adzuna: {e}")


def normalize_job(raw, visa_types):
    salary = None
    sal_min = raw.get("salary_min")
    sal_max = raw.get("salary_max")

    if sal_min and sal_max:
        salary = f"${int(sal_min):,}-${int(sal_max):,}/yr"
    elif sal_min:
        salary = f"${int(sal_min):,}+/yr"

    location_obj = raw.get("location", {})
    area = location_obj.get("area", [])
    location_str = ", ".join(area[-2:]) if area else location_obj.get("display_name", "USA")

    description = raw.get("description", "")
    description = re.sub(r"<[^>]+>", " ", description)
    description = re.sub(r"\s+", " ", description).strip()

    if len(description) > 300:
        description = description[:300].rsplit(" ", 1)[0] + "..."

    title = raw.get("title", "").strip()
    company = raw.get("company", {}).get("display_name", "Unknown Company")

    title_lower = title.lower()

    if any(k in title_lower for k in ["intern","internship","co-op","coop"]):
        job_type = "Internship"
    elif any(k in title_lower for k in ["part time","part-time"]):
        job_type = "Part-time"
    elif any(k in title_lower for k in ["contract","contractor"]):
        job_type = "Contract"
    else:
        job_type = "Full-time"

    full_text = (title + " " + description).lower()

    if "remote" in full_text and "hybrid" in full_text:
        remote = "Hybrid"
    elif "remote" in full_text:
        remote = "Remote"
    elif "hybrid" in full_text:
        remote = "Hybrid"
    else:
        remote = "On-site"

    ev = "e-verify" in full_text or "everify" in full_text
    sponsor = any(k in full_text for k in ["h-1b","h1b","visa sponsor","will sponsor"])

    tags = [w for w in re.findall(r"\b[A-Za-z\+\#\.]{2,}\b", title) if len(w) > 2][:5]

    return {
        "id": str(raw.get("id","")),
        "company": company,
        "role": title,
        "type": job_type,
        "location": location_str,
        "remote": remote,
        "pay": salary,
        "deadline": None,
        "tags": tags,
        "visaTypes": visa_types,
        "eVerify": ev,
        "sponsorship": sponsor,
        "description": description,
        "applyUrl": raw.get("redirect_url",""),
        "source": "Adzuna",
        "postedAt": (raw.get("created","") or "")[:7]
    }


def _matches_filters(job: dict, work_auth: str, job_type: str) -> bool:
    if job_type != "all":
        wanted_type = {
            "internship": "Internship",
            "fulltime": "Full-time",
            "coop": "Co-op",
        }.get(job_type)
        if wanted_type and job.get("type") != wanted_type:
            return False

    if work_auth != "all":
        wanted_auth = {
            "cpt": "F-1 CPT",
            "opt": "F-1 OPT",
            "stem_opt": "OPT STEM Extension",
            "h1b": "H-1B Sponsor",
        }.get(work_auth)
        visa_types = job.get("visaTypes") or []
        if wanted_auth and wanted_auth not in visa_types:
            # If posting has no explicit visa markers, allow CPT/OPT/STEM filters
            # to keep search usable (user still verifies with employer/DSO).
            if visa_types == [] and work_auth in {"cpt", "opt", "stem_opt"}:
                return True
            # H-1B sometimes appears as sponsorship signal, even if label missing.
            if not (work_auth == "h1b" and job.get("sponsorship")):
                return False

    return True


@router.get("")
def search_jobs(
    q: str = Query(default="software engineer intern"),
    location: str = Query(default=""),
    work_auth: str = Query(default="all"),
    job_type: str = Query(default="all"),
    page: int = Query(default=1)
):
    jobs: list[dict] = []
    seen_job_ids: set[str] = set()

    for candidate_q in _build_query_candidates(q):
        raw_results = fetch_adzuna(keyword=candidate_q, location=location, page=page)

        # Pass 1: strict international-friendly filter
        for raw in raw_results:
            title = raw.get("title", "")
            desc = raw.get("description", "")
            if not is_international_friendly(title, desc):
                continue

            visa_types = detect_visa_types(title + " " + desc)
            job = normalize_job(raw, visa_types)
            job_id = str(job.get("id", ""))
            if not job_id or job_id in seen_job_ids:
                continue
            if _matches_filters(job, work_auth=work_auth, job_type=job_type):
                jobs.append(job)
                seen_job_ids.add(job_id)
                if len(jobs) >= 25:
                    return jobs

        # Pass 2: relaxed fallback on same candidate (if still empty)
        if not jobs:
            for raw in raw_results:
                title = raw.get("title", "")
                desc = raw.get("description", "")
                visa_types = detect_visa_types(title + " " + desc)
                job = normalize_job(raw, visa_types)
                job_id = str(job.get("id", ""))
                if not job_id or job_id in seen_job_ids:
                    continue
                if _matches_filters(job, work_auth=work_auth, job_type=job_type):
                    jobs.append(job)
                    seen_job_ids.add(job_id)
                    if len(jobs) >= 25:
                        return jobs

        # If we already found something, avoid unnecessary API calls.
        if jobs:
            break

    return jobs


@router.get("/health")
def health():
    configured = bool(ADZUNA_APP_ID and ADZUNA_APP_KEY)
    return {"adzuna_configured": configured}