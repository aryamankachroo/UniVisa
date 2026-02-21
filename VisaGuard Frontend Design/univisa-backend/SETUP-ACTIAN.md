# Actian VectorAI DB setup (UniVisa RAG)

From [hackmamba-io/actian-vectorAI-db-beta](https://github.com/hackmamba-io/actian-vectorAI-db-beta).

**Requirement:** Python **3.10 or higher** (the `actiancortex` client does not support 3.9).

---

## Step 1: Start the database (Docker)

```bash
cd "VisaGuard Frontend Design/univisa-backend"
docker compose -f docker-compose.actian.yml up -d
```

DB will be at **localhost:50051**. Check with: `docker ps` (you should see `vectoraidb`).

---

## Step 2: Install Python 3.10 or 3.11 (macOS)

If you only have Python 3.9, install 3.10 or 3.11:

```bash
brew install python@3.11
```

Or download from [python.org](https://www.python.org/downloads/).

Check:

```bash
python3.11 --version
```

---

## Step 3: Create a venv and install dependencies

From `univisa-backend`:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Step 4: Install the Actian Python client

Download the wheel from the repo, or install from URL:

```bash
pip install "https://github.com/hackmamba-io/actian-vectorAI-db-beta/raw/main/actiancortex-0.1.0b1-py3-none-any.whl"
```

If that fails (e.g. network), clone the repo and install the wheel locally:

```bash
cd /tmp
git clone https://github.com/hackmamba-io/actian-vectorAI-db-beta.git
pip install actian-vectorAI-db-beta/actiancortex-0.1.0b1-py3-none-any.whl
cd -
```

---

## Step 5: Enable Actian in .env

In `univisa-backend/.env`, set:

```
ACTIAN_VECTORAI_URL=localhost:50051
```

(Uncomment or add that line; remove the `#` if it’s commented.)

---

## Step 6: (Optional) Ingest docs into Actian

Put `.txt` files in `data/uscis_docs/`, then:

```bash
source .venv/bin/activate
python scripts/ingest_docs.py
```

This writes to Actian instead of ChromaDB when `ACTIAN_VECTORAI_URL` is set.

---

## Step 7: Run the backend

```bash
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

RAG will use Actian VectorAI DB. API: http://localhost:8000

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Package requires Python 3.10+` | Use `python3.11` (or 3.10) and a venv created with it. |
| `Cannot connect to Docker daemon` | Start Docker Desktop. |
| `Address already in use` (50051) | Another container is using the port; stop it or change the host port in `docker-compose.actian.yml`. |
| Wheel install fails from URL | Clone the repo and `pip install` the `.whl` from the cloned folder. |

To **stop** Actian and use ChromaDB again: comment out `ACTIAN_VECTORAI_URL` in `.env` and run the backend with your normal Python (no need for the Actian venv).
