@echo off
setlocal

REM File: start-local-dev.bat
REM Purpose: start the Tool Web backend and frontend dev servers on Windows.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "CHECK_ONLY=0"

if /I "%~1"=="--check" (
    set "CHECK_ONLY=1"
)

if not exist "%BACKEND_DIR%\pyproject.toml" (
    echo ERROR: backend\pyproject.toml was not found.
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo ERROR: frontend\package.json was not found.
    exit /b 1
)

where uv >nul 2>nul
if errorlevel 1 (
    echo ERROR: uv is required to start the backend.
    exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm.cmd is required to start the frontend.
    exit /b 1
)

if "%CHECK_ONLY%"=="1" (
    echo Tool Web local dev startup checks passed.
    exit /b 0
)

echo Starting Tool Web backend at http://localhost:8004 ...
start "Tool Web Backend" /D "%BACKEND_DIR%" cmd /k "uv sync && uv run uvicorn src.main:app --host 0.0.0.0 --port 8004"

echo Starting Tool Web frontend at http://localhost:3000 ...
start "Tool Web Frontend" /D "%FRONTEND_DIR%" cmd /k "set API_PROXY_TARGET=http://localhost:8004&& if exist node_modules (call npm.cmd run dev) else (call npm.cmd install && call npm.cmd run dev)"

echo.
echo Tool Web local dev startup commands were launched.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8004

endlocal
