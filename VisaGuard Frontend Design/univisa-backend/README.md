# UniVisa Backend

AI-powered visa compliance risk prediction for F-1/J-1 international students (UniVisa).

## Setup

```bash
cd univisa-backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy .env.example .env   # Windows (use cp on macOS/Linux)
# Edit .env: add GEMINI_API_KEY (required for AI chat), optional Reddit/Actian keys
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

**Quick run (macOS/Linux):**
```bash
cd univisa-backend
chmod +x run.sh
./run.sh
```

**Or manually:**
```bash
cd univisa-backend
source .venv/bin/activate   # macOS/Linux
uvicorn main:app --reload --port 8000
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  

CORS allows `http://localhost:5173` and `http://127.0.0.1:5173` (Vite frontend).

### Backend / chatbot "not working"?

The **AI Advisor** page shows a banner if the backend is unreachable or if the AI key is missing — fix what it says, then refresh.

1. **"Address already in use"** — Something is using port 8000. Run: `lsof -ti :8000 | xargs kill -9` then start again.
2. **"Backend not reachable"** — Start the backend first: `cd univisa-backend && ./run.sh` (or `source .venv/bin/activate && uvicorn main:app --reload --port 8000`). Then refresh the frontend.
3. **"AI not configured"** — Add `GEMINI_API_KEY` to `univisa-backend/.env` (get a key at https://aistudio.google.com/app/apikey) and restart the backend.
4. **Wrong directory** — Run uvicorn from inside `univisa-backend` (where `main.py` is).
5. **Venv not activated** — Run `source .venv/bin/activate` (macOS/Linux) so `uvicorn` and dependencies are found.

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
- **USCIS docs:** Place plain-text `.txt` files in `data/uscis_docs/`, then run `python scripts/ingest_docs.py` to chunk, embed, and store for RAG. By default uses ChromaDB (`data/chroma_db/`). To use **Actian VectorAI DB** instead, set `ACTIAN_VECTORAI_URL=localhost:50051` in `.env`, start the DB (`docker compose -f docker-compose.actian.yml up -d`), install the [Actian VectorAI DB Python client](https://github.com/hackmamba-io/actian-vectorAI-db-beta) (e.g. `pip install actiancortex-0.1.0b1-py3-none-any.whl` from that repo), then run `ingest_docs.py` again.

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
