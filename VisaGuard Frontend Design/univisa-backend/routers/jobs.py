import os
import re
import urllib.request
import urllib.parse
import json
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/jobs", tags=["jobs"])

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
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
        "page": page,
        "what": keyword,
        "content-type": "application/json",
        "sort_by": "date",
        "salary_include_unknown": 1
    }

    if location:
        params["where"] = location

    url = f"{ADZUNA_BASE}/{page}?{urllib.parse.urlencode(params)}"

    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        return data.get("results", [])
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Adzuna API error: {e.code}")
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


@router.get("")
def search_jobs(
    q: str = Query(default="software engineer intern"),
    location: str = Query(default=""),
    work_auth: str = Query(default="all"),
    job_type: str = Query(default="all"),
    page: int = Query(default=1)
):
    enhanced_q = f"{q} international student visa sponsor"

    raw_results = fetch_adzuna(keyword=enhanced_q, location=location, page=page)

    jobs = []

    for raw in raw_results:
        title = raw.get("title", "")
        desc = raw.get("description", "")

        if not is_international_friendly(title, desc):
            continue

        visa_types = detect_visa_types(title + " " + desc)

        jobs.append(normalize_job(raw, visa_types))

    return jobs


@router.get("/health")
def health():
    configured = bool(ADZUNA_APP_ID and ADZUNA_APP_KEY)
    return {"adzuna_configured": configured}