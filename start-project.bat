@echo off
title Smart School Management System Launcher
echo ===================================================
echo   Starting Smart School Management System Servers
echo ===================================================
echo.

:: Stop any stray processes on ports 5001 and 5199
echo Releasing ports 5001 and 5199...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" ^| findstr "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5199" ^| findstr "LISTENING"') do taskkill /f /pid %%a 2>nul
echo Ports released.
echo.

:: Check if node_modules exists in root
if not exist node_modules (
    echo [Frontend] Installing dependencies...
    call npm install
)

:: Launching servers
echo.
echo Launching Backend Server on port 5001...
start "Smart School Backend" cmd /k "node server/server.js"

echo Launching Frontend Development Server on http://localhost:5199...
start "Smart School Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Success! Both servers are starting up in separate windows.
echo   Keep those terminal windows open while using the app.
echo ===================================================
echo.
pause
