@echo off
rem Starts the FINOVA server and opens it in your default browser.
rem If FINOVA is already running, it just opens the app.
rem Keep this window open (you can minimise it) - closing it stops FINOVA.
title FINOVA server
cd /d "%~dp0"
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if %errorlevel%==0 (
    echo FINOVA is already running - opening the app.
    start "" http://127.0.0.1:3000
    timeout /t 2 >nul
    exit /b
)
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed. Install it from https://nodejs.org and try again.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo First run: installing packages...
    call npm install
)
if not exist "dist\index.html" (
    echo Building FINOVA...
    call npm run build
)
start "" cmd /c "timeout /t 3 >nul & start "" http://127.0.0.1:3000"
node server.js
echo.
echo FINOVA stopped. Press any key to close this window.
pause >nul
