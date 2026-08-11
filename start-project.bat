@echo off
title Smart School Management System Launcher
echo ===================================================
echo   Starting Smart School Management System Servers
echo ===================================================
echo.

:: Check if node_modules exists in root
if not exist node_modules (
    echo [Frontend] Installing dependencies...
    call npm install
)

:: Check if node_modules exists in server
if not exist server\node_modules (
    echo [Backend] Installing server dependencies...
    cd server
    call npm install
    cd ..
)

echo.
echo Launching Backend Server on port 5001...
start "Smart School Backend" cmd /k "cd server && npm start"

echo Launching Frontend Development Server on http://localhost:5199...
start "Smart School Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Success! Both servers are starting up in separate windows.
echo   Keep those terminal windows open while using the app.
echo ===================================================
echo.
pause
