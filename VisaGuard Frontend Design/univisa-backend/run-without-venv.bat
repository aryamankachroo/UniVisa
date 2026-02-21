@echo off
cd /d "%~dp0"
echo Installing dependencies (no venv, prefer wheels)...
python -m pip install --user --prefer-binary --no-cache-dir -r requirements.txt
if errorlevel 1 exit /b 1
echo Starting API on http://localhost:8000 ...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
