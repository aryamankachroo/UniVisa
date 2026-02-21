# UniVisa Backend

AI-powered visa compliance risk prediction for F-1/J-1 international students (UniVisa / VisaGuard hackathon).

## Setup

```bash
cd univisa-backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy .env.example .env   # Windows (use cp on macOS/Linux)
# Edit .env: add ANTHROPIC_API_KEY (required for AI chat), optional Reddit/Actian keys
```

**Run without venv (system Python):**
```powershell
cd univisa-backend
# One-time: install deps (--user = no admin needed; --prefer-binary = use wheels, no build)
python -m pip install --user --prefer-binary --no-cache-dir -r requirements.txt
# Start API
python -m uvicorn main:app --reload --port 8000
```
Or double‑click `run-without-venv.bat` (or run `.\run-without-venv.ps1` in PowerShell) to install and start in one go.

**Note:** `requirements.txt` has no pandas/numpy build (numpy uses a wheel). For Reddit clustering scripts use `requirements-scripts.txt` (may need a C compiler on Windows).

## Run API

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  

CORS is enabled for `http://localhost:3000` (React frontend).

## Demo Student

A pre-loaded profile **Riya Sharma** is available with `student_id: "demo"` so judges can hit the API without the form:

- **GET** `/student/demo/risk` — risk score and flags
- **GET** `/student/demo/alerts` — alerts list
- **POST** `/chat` — body: `{"student_id": "demo", "question": "Can I work more than 20hrs?"}`

Risk score and flags depend on the current date (e.g. OPT window proximity, program end).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/student/profile` | Create profile (body: StudentProfile fields without `student_id`); returns `{ "student_id": "..." }` |
| GET | `/student/{student_id}/risk` | Risk output (score, level, flags, alerts) |
| GET | `/student/{student_id}/alerts` | Alerts for student, sorted by urgency |
| POST | `/chat` | Body: `{ "student_id", "question" }` → `{ "answer", "sources" }` |
| GET | `/dso/cohort` | All students with risk score and top flag, sorted by risk descending |

## Data & Scripts

- **Reddit:** `python scripts/fetch_reddit.py` (needs Reddit API keys in `.env`). Writes `data/reddit_posts.json`.
- **Clustering:** `python scripts/cluster_reddit.py`. Reads `data/reddit_posts.json`, writes `data/clusters.json`. Update cluster labels there for risk engine `reddit_insight`.
- **USCIS docs:** Place plain-text `.txt` files in `data/uscis_docs/`, then run `python scripts/ingest_docs.py` to chunk, embed, and store in ChromaDB for RAG.

Vector store is ChromaDB (persisted in `data/chroma_db/`) for the hackathon; replace with Actian VectorAI DB when available.

## Project layout

```
univisa-backend/
├── main.py              # FastAPI app, CORS, demo seed
├── requirements.txt
├── data/
├── models/              # Pydantic: student, risk
├── services/            # risk_engine, rag_service, alert_service
├── routers/             # student, chat, dso
└── scripts/             # fetch_reddit, cluster_reddit, ingest_docs
```
