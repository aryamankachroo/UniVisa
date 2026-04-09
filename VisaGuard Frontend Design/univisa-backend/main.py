"""
UniVisa Backend — AI-powered visa compliance risk prediction for F-1/J-1 students.
"""
import os
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

_root = Path(__file__).resolve().parent
# Support both conventional `.env` and mistakenly-cased `.eNV`.
load_dotenv(dotenv_path=_root / ".env")
load_dotenv(dotenv_path=_root / ".eNV")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.student import StudentProfile, VisaType, EnrollmentStatus
from routers import student, chat, dso, cpt, jobs, compliance, cases, alerts, policy_alerts, institutions
from services.us_university_catalog import load_us_university_names

app = FastAPI(
    title="UniVisa API",
    description="Visa compliance risk prediction and AI advisor for international students",
    version="0.1.0",
)

# CORS: wildcard origin requires allow_credentials=False (browser spec).
# After deploy, verify: GET / shows cors.profile below; GET with Origin should include
# Access-Control-Allow-Origin: * and must NOT send Access-Control-Allow-Credentials: true.
CORS_ALLOW_ORIGINS = ["*"]
CORS_ALLOW_CREDENTIALS = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student.router)
app.include_router(chat.router)
app.include_router(dso.router)
app.include_router(cpt.router)
app.include_router(jobs.router)
app.include_router(compliance.router)
app.include_router(cases.router)
app.include_router(institutions.router)
app.include_router(alerts.router)
app.include_router(policy_alerts.router)


def _seed_demo_student() -> None:
    """Pre-load a generic demo profile so the API can be exercised without the questionnaire."""
    store = student.get_student_store()
    if "demo" in store:
        return
    demo = StudentProfile(
        student_id="demo",
        full_name="Demo Student",
        university="Sample University",
        country_of_origin="India",
        visa_type=VisaType.F1,
        program_start_date=date(2024, 8, 15),
        program_end_date=date(2026, 5, 15),
        enrollment_status=EnrollmentStatus.FULL_TIME,
        weekly_work_hours=18.0,
        on_opt=False,
        on_cpt=False,
        opt_start_date=None,
        opt_end_date=None,
        cpt_start_date=None,
        cpt_end_date=None,
        traveling_soon=False,
        changing_employer=False,
        changing_courses=False,
    )
    store["demo"] = demo


@app.on_event("startup")
def startup() -> None:
    _seed_demo_student()


@app.get("/")
def root() -> dict:
    """Runtime fingerprint for deploy/debug — if this does not match after deploy, the new image is not live."""
    return {
        "message": "UniVisa API",
        "docs": "/docs",
        "cors": {
            "allow_origins": CORS_ALLOW_ORIGINS,
            "allow_credentials": CORS_ALLOW_CREDENTIALS,
            "profile": "wildcard_no_credentials_v2",
        },
        "cloud_run": {
            "revision": os.getenv("K_REVISION"),
            "service": os.getenv("K_SERVICE"),
        },
    }


@app.get("/universities")
def get_universities() -> list[str]:
    """US university names for the student picker (GitHub dataset + fallbacks; avoids CORS for the browser)."""
    return load_us_university_names()
