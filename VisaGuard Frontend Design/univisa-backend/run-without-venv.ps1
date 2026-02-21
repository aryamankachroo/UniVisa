# Run UniVisa backend without a virtual environment.
# Uses system/user Python. Prefers binary wheels to avoid building from source on Windows.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

Write-Host "Installing dependencies (no venv, prefer wheels)..." -ForegroundColor Cyan
python -m pip install --user --prefer-binary --no-cache-dir -r requirements.txt
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting API on http://localhost:8000 ..." -ForegroundColor Green
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
