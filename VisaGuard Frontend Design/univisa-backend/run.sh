#!/bin/bash
# Run the UniVisa backend. Use from: univisa-backend/
cd "$(dirname "$0")"

# Activate venv if it exists
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi

# Kill anything already on 8000
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting backend at http://localhost:8000 (docs: http://localhost:8000/docs)"
exec python -m uvicorn main:app --reload --port 8000
