"""
UniVisa Backend — AI-powered visa compliance risk prediction for F-1/J-1 students.
"""
import urllib.request
import json
from datetime import date

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.student import StudentProfile, VisaType, EnrollmentStatus
from routers import student, chat, dso

app = FastAPI(
    title="UniVisa API",
    description="Visa compliance risk prediction and AI advisor for international students",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student.router)
app.include_router(chat.router)
app.include_router(dso.router)


def _seed_demo_student() -> None:
    """Pre-load Riya Sharma demo profile so judges can see risk output without filling the form."""
    store = student.get_student_store()
    if "demo" in store:
        return
    demo = StudentProfile(
        student_id="demo",
        full_name="Riya Sharma",
        university="Georgia Institute of Technology",
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
    return {"message": "UniVisa API", "docs": "/docs"}


@app.get("/universities")
def get_universities() -> list[str]:
    """Proxy Hipo Labs API to avoid CORS; returns sorted, deduplicated US university names."""
    url = "https://universities.hipolabs.com/search?country=United%20States"
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return []
    names = sorted({u["name"] for u in data if isinstance(u.get("name"), str)})
    return names
