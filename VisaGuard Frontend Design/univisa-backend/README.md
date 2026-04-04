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

### US university list (`/universities`, DSO catalog seed)

Names come from [Hipo/university-domains-list](https://github.com/Hipo/university-domains-list) via **`raw.githubusercontent.com`** (not `universities.hipolabs.com`). If that fetch fails, the API tries, in order: optional local file `data/us_universities_names.json` (array of strings), the legacy Hipo API, then a small built-in fallback list.

### DSO portal — what you must configure

1. Run SQL in [`migrations/001_dso_multitenant.sql`](migrations/001_dso_multitenant.sql) in the Supabase SQL editor.
2. `.env` / `.eNV`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_JWKS_URL`, `CLERK_JWT_ISSUER` (issuer URL from Clerk).
3. Clerk **session token**: add claim `email` from `{{user.primary_email_address}}` so `/dso/claim` can verify domains.
4. Frontend `.env.local`: `VITE_API_URL=http://localhost:8000` (restart Vite after changes).

### Backend / chatbot "not working"?

The **AI Advisor** page shows a banner if the backend is unreachable or if the AI key is missing — fix what it says, then refresh.

1. **"Address already in use"** — Something is using port 8000. Run: `lsof -ti :8000 | xargs kill -9` then start again.
2. **"Backend not reachable"** — Start the backend first: `cd univisa-backend && ./run.sh` (or `source .venv/bin/activate && uvicorn main:app --reload --port 8000`). Then refresh the frontend.
3. **"AI not configured"** — Add `GEMINI_API_KEY` to `univisa-backend/.env` (get a key at https://aistudio.google.com/app/apikey) and restart the backend.
4. **Wrong directory** — Run uvicorn from inside `univisa-backend` (where `main.py` is).
5. **Venv not activated** — Run `source .venv/bin/activate` (macOS/Linux) so `uvicorn` and dependencies are found.

## Demo Student

A pre-loaded profile **Demo Student** is available with `student_id: "demo"` so you can hit the API without the form:

- **GET** `/student/demo/risk` — risk score and flags
- **GET** `/student/demo/alerts` — alerts list
- **POST** `/chat` — body: `{"student_id": "demo", "question": "Can I work more than 20hrs?"}`

Risk score and flags depend on the current date (e.g. OPT window proximity, program end).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/student/profile` | Create profile (body: StudentProfile fields without `student_id`); returns `{ "student_id": "..." }` |
| GET | `/student/{student_id}/risk` | Risk output (score, level, flags, alerts) |
| GET | `/api/alerts?clerk_user_id=...` | Compliance alerts from latest saved case (deadline-first) |
| POST | `/api/alerts/action` | Alert actions (`mark_read`, `resolve`, `snooze`, etc.) |
| GET | `/api/policy-alerts` | Latest policy alerts from official government sources |
| POST | `/api/policy-alerts/refresh` | Force refresh policy alerts ingestion |
| POST | `/chat` | Body: `{ "student_id", "question" }` → `{ "answer", "sources" }` |
| GET | `/api/institutions` | US-school catalog (lazy-seeded in Supabase from the same list as `/universities`) |
| POST | `/api/cases/submit` | Body includes optional `institutionId` to link the student profile to an institution |
| PATCH | `/api/cases/profile/sharing` | Body: `{ "clerkUserId", "shareWithInstitution" }` — DSO visibility toggle |
| GET | `/dso/me` | DSO’s institution membership (requires `Authorization: Bearer` Clerk session JWT) |
| POST | `/dso/claim` | Body: `{ "institution_id" }` — claim institution (email domain rules; see below) |
| GET | `/dso/students` | Cohort + KPI summary for the DSO’s institution |

### Supabase: DSO multi-tenant schema

Run the SQL in [`migrations/001_dso_multitenant.sql`](migrations/001_dso_multitenant.sql) in the Supabase SQL editor (creates `institutions`, `institution_members`, and extends `profiles`). The API uses the **service role** only; no RLS is required for the v1 server-side-only access pattern.

### DSO auth (Clerk)

Set in `.env` next to `SUPABASE_*`:

- **`CLERK_JWKS_URL`** — from Clerk Dashboard (e.g. **Developers → API Keys → JWKS URL**).
- **`CLERK_JWT_ISSUER`** — your Clerk Frontend API issuer URL (same dashboard; optional locally but recommended).

For **`POST /dso/claim`**, the backend reads the user’s email from the JWT. Add a custom claim in **Clerk → Sessions → Customize session token**, for example:

```json
{
  "email": "{{user.primary_email_address}}"
}
```

so the payload includes `"email"` for domain verification.

## Data & Scripts

- **Reddit:** `python scripts/fetch_reddit.py` (needs Reddit API keys in `.env`). Writes `data/reddit_posts.json`.
- **Clustering:** `python scripts/cluster_reddit.py`. Reads `data/reddit_posts.json`, writes `data/clusters.json`. Update cluster labels there for risk engine `reddit_insight`.
- **USCIS docs:** Place plain-text `.txt` files in `data/uscis_docs/`, then run `python scripts/ingest_docs.py` to chunk, embed, and store for RAG. By default uses ChromaDB (`data/chroma_db/`). To use **Actian VectorAI DB** instead, set `ACTIAN_VECTORAI_URL=localhost:50051` in `.env`, start the DB (`docker compose -f docker-compose.actian.yml up -d`), install the [Actian VectorAI DB Python client](https://github.com/hackmamba-io/actian-vectorAI-db-beta) (e.g. `pip install actiancortex-0.1.0b1-py3-none-any.whl` from that repo), then run `ingest_docs.py` again.
- **Policy alerts ingest (manual):** `python scripts/fetch_policy_alerts.py` to fetch curated all-gov source feeds and upsert into `policy_alerts`.
- **Policy alerts ingest (daily):** GitHub Actions workflow at `.github/workflows/policy-alerts-daily.yml` runs once daily. Configure repo secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (required), and keep optional existing keys for shared env usage.

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
