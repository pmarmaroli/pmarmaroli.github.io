@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "PORT=8000"
set "URL=http://localhost:%PORT%/"
set "SERVER_TITLE=PMARMAROLI_LOCALHOST_SERVER_%PORT%"

echo.
echo [1/2] Releasing port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
    echo    - Stopping PID %%P using port %PORT%
    taskkill /f /pid %%P >nul 2>&1
)

where py >nul 2>&1
if %errorlevel%==0 (
    set "PY_CMD=py -3"
) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
        set "PY_CMD=python"
    ) else (
        echo.
        echo Python was not found in PATH.
        echo Install Python, then run this file again.
        pause
        exit /b 1
    )
)

echo [2/2] Starting local server on %URL%
start "%SERVER_TITLE%" cmd /c "%PY_CMD% -m http.server %PORT% --bind 127.0.0.1"

ping 127.0.0.1 -n 2 >nul
start "" "%URL%"

echo.
echo Local server started. Re-run this file anytime to restart cleanly.
exit /b 0