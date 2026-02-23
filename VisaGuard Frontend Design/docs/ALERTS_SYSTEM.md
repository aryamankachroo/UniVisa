# How the Alert System Works

The UniVisa app has a **risk-based alert system** that shows students deadlines, warnings, and info (e.g. OPT timing, enrollment, work hours).

---

## 1. Backend (source of alerts)

### Flow

1. **Risk engine** (`univisa-backend/services/risk_engine.py`)  
   - Takes a **student profile** and **today’s date**.  
   - Runs **rules** (OPT window, enrollment status, work hours, program end, etc.).  
   - Produces **risk flags** (category, severity, explanation, optional `days_until_critical`).

2. **Alert service** (`univisa-backend/services/alert_service.py`)  
   - **Input:** list of `RiskFlag`.  
   - **Output:** list of **alert dicts** with:  
     - `type`: `"deadline"` | `"warning"` | `"info"`  
     - `title`, `description`, `severity`, `urgency`, `days_until_critical`  
   - Sorted by urgency (high first), then by `days_until_critical`.

3. **API**  
   - `GET /student/{student_id}/alerts`  
   - Implemented in `routers/student.py`: loads profile, runs `calculate_risk()`, returns `output.alerts`.

So: **Profile → Risk engine (rules) → Risk flags → Alert service → API → Frontend.**

---

## 2. Frontend (display)

### Data flow

- **`api.getAlerts(studentId)`** calls `GET /student/{student_id}/alerts`.
- **Alerts page** (`pages/Alerts.tsx`):  
  - On load: fetches alerts for current student (`getStudentId()`).  
  - On **success**: maps API alerts to UI shape (adds `id`, `timestamp` from `days_until_critical`).  
  - On **failure** (e.g. backend down or student not found): uses **dummy alerts** so the page still works offline/demo.
- **`AlertCard`** (`components/AlertCard.tsx`) renders each item (deadline = clock/orange, warning = triangle/red, info = info/blue).

### Sidebar badge

- The **Alerts** nav item shows a badge with the **count** of the current alerts list (from API or dummy).

---

## 3. How to extend the alert system

### Add new alert types (backend)

1. **Add a rule** in `risk_engine.py`:  
   - From `StudentProfile` and `today`, decide when to add a flag.  
   - Append a `RiskFlag(category="...", severity="high"|"medium"|"low", explanation="...", days_until_critical=... optional)`.
2. **Alert type** is set in `alert_service.generate_alerts()`:  
   - If the flag has `days_until_critical` → `type: "deadline"`.  
   - Else if `severity == "high"` → `type: "warning"`.  
   - Else → `type: "info"`.
3. No change needed on the frontend; it already supports `deadline` / `warning` / `info`.

### Add new UI behavior (frontend)

- **Filter by type:** In `Alerts.tsx`, filter `alerts` by `alert.type` before mapping to `AlertCard`.
- **Mark as read:** Add a “read” state (e.g. in localStorage or a backend endpoint) and filter or style alerts accordingly.
- **Push/email:** Add a background job or cron that calls the risk engine and sends notifications for high-urgency alerts.

### Optional: store alerts in DB

- Right now alerts are **computed on every request** from the risk engine.  
- To **persist** them: add an `alerts` table (e.g. student_id, type, title, description, created_at, read_at), and either:  
  - **Option A:** Have the risk engine (or a scheduled job) **write** alerts into the DB and have `GET /student/{id}/alerts` **read** from the DB, or  
  - **Option B:** Keep the current “compute on demand” but also **save** the result into the DB for history/analytics.

---

## 4. Summary

| Layer        | What it does |
|-------------|----------------|
| **Risk engine** | Turns profile + date into risk flags (OPT, enrollment, work hours, etc.). |
| **Alert service** | Turns flags into alert dicts (type, title, description, urgency) and sorts them. |
| **Student API**   | `GET /student/{id}/alerts` returns those alerts. |
| **Frontend**      | Fetches alerts, falls back to dummy data, shows them with `AlertCard` and sidebar count. |

To **change what alerts exist**: edit rules in `risk_engine.py` and optionally the mapping in `alert_service.py`.  
To **change how they look or behave**: edit `Alerts.tsx` and `AlertCard.tsx`.
