@echo off
echo ==========================================================
echo Starting HealthLens AI Platform
echo ==========================================================
echo 1. Launching FastAPI Backend on http://localhost:8000 ...
start "HealthLens AI - Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --reload --port 8000"

echo 2. Launching Vite Frontend on http://localhost:5173 ...
start "HealthLens AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo Both servers are starting up in dedicated windows.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Done! Keep this window or close it. Do not close the Backend and Frontend windows.
