# RCA: AI Advisor Not Returning Answers from Gemini

## Summary

The AI Advisor was not returning answers from the Gemini API. Root causes were identified and fixed.

---

## Root Causes

### 1. **Gemini was never called when RAG had no documents (primary)**

- **Flow:** The code first runs vector search (ChromaDB or Actian). If it finds **no chunks**, it returned a static message and **exited without calling Gemini**.
- **Your setup:**
  - `.env` has `ACTIAN_VECTORAI_URL=localhost:50051`, so the app uses Actian for vector search.
  - If Actian is not running, or the collection is empty, `_vector_search` returns `[]`.
  - There is no `data/chroma_db` directory, so ChromaDB was never populated.
- **Result:** Every request hit the “no chunks” path and returned: *“No policy documents have been ingested yet…”* — **Gemini was never invoked.**

### 2. **Possible empty or blocked Gemini response**

- If Gemini had been called, an empty or safety-blocked response could have been returned as blank text, which the router turned into “No response.”

### 3. **Model availability**

- Some API keys or regions may not have access to every model (e.g. `gemini-2.5-flash`). Using a single model could lead to errors for some users.

---

## Fixes Applied

1. **Always call Gemini when `GEMINI_API_KEY` is set**
   - If there are **no RAG chunks**, we still call Gemini with a prompt that says no policy documents are available and to give general F-1/J-1 guidance and recommend contacting the DSO.
   - Users now get a real Gemini-generated answer even before any documents are ingested.

2. **Robust response handling**
   - Extract text from both `response.text` and `response.candidates[0].content.parts[0].text`.
   - If the model returns no text, we return a clear message instead of a blank “No response.”

3. **Model fallback**
   - Try, in order: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`.
   - The first model that succeeds is used; this improves compatibility with different keys/regions.

4. **Graceful embedding failure**
   - If loading the embedding model or running vector search fails (e.g. Actian down), we no longer fail the whole request; we proceed with “no context” and still call Gemini.

---

## How to Verify

1. Restart the backend (e.g. `./run.sh`).
2. In the app, open AI Advisor and ask: e.g. “Can I work more than 20 hours on F-1?”
3. You should get a Gemini-generated answer. If no documents are ingested, the answer will note that it’s general guidance and recommend contacting the DSO.

---

## Optional: Ingest documents for RAG

For answers grounded in your own policy docs:

- **ChromaDB:** Comment out or remove `ACTIAN_VECTORAI_URL` in `.env`, add `.txt` files under `data/uscis_docs/`, then run:
  ```bash
  python scripts/ingest_docs.py
  ```
- **Actian:** Keep `ACTIAN_VECTORAI_URL`, start Actian (e.g. `docker compose -f docker-compose.actian.yml up -d`), install the Actian client, then run `ingest_docs.py`.

After ingestion, the same flow will pass retrieved chunks to Gemini as context for more accurate, sourced answers.
