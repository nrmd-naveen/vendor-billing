@echo off
setlocal enabledelayedexpansion

set PORT=3000
set URL=http://localhost:%PORT%
set REQUIRED_NODE=20
cd /d "%~dp0"

echo.
echo  Database Launcher
echo  ─────────────────────────────────────
echo.

:: ── Check / Install Node.js ──────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js not found. Downloading Node.js v%REQUIRED_NODE% LTS...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/latest-v20.x/node-v20.19.0-x64.msi' -OutFile '%TEMP%\node-installer.msi' -UseBasicParsing"
    if errorlevel 1 (
        echo Failed to download Node.js. Check your internet connection.
        pause & exit /b 1
    )
    echo Installing Node.js silently, please wait...
    msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
    if errorlevel 1 (
        echo Installation failed. Run the installer manually from %TEMP%\node-installer.msi
        pause & exit /b 1
    )
    :: Refresh PATH after install
    for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "PATH=%%i;%PATH%"
    where node >nul 2>&1
    if errorlevel 1 (
        echo Node.js installed. Please close and re-open this file to continue.
        pause & exit /b 0
    )
)

:: ── Check Node version ────────────────────────────────────────────────────────
for /f "tokens=1 delims=." %%v in ('node -e "process.stdout.write(process.version)"') do set NODE_VER=%%v
set NODE_VER=%NODE_VER:v=%
if %NODE_VER% lss %REQUIRED_NODE% (
    echo Wrong Node.js version (found v%NODE_VER%, need v%REQUIRED_NODE%+).
    echo Downloading Node.js v%REQUIRED_NODE% LTS...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/latest-v20.x/node-v20.19.0-x64.msi' -OutFile '%TEMP%\node-installer.msi' -UseBasicParsing"
    msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
    echo Node.js updated. Please close and re-open this file to continue.
    pause & exit /b 0
)

echo Node.js %NODE_VER% found.

:: ── Install dependencies if missing ──────────────────────────────────────────
if not exist "node_modules" (
    echo Installing dependencies, please wait...
    call npm install
    if errorlevel 1 (
        echo npm install failed. Check the error above.
        pause & exit /b 1
    )
)

:: ── Rebuild better-sqlite3 if native binary missing ──────────────────────────
if not exist "node_modules\better-sqlite3\build\Release\better_sqlite3.node" (
    echo Building native modules...
    call npm rebuild better-sqlite3
    if errorlevel 1 (
        echo Native module build failed.
        echo Install build tools: npm install --global windows-build-tools
        pause & exit /b 1
    )
)

:: ── Build Next.js if needed ───────────────────────────────────────────────────
if not exist ".next" (
    echo Building app for the first time, please wait...
    call npm run build
    if errorlevel 1 (
        echo Build failed. Check the error above.
        pause & exit /b 1
    )
)

:: ── Kill existing process on port 3000 ───────────────────────────────────────
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING" 2^>nul') do (
    echo Stopping previous instance...
    taskkill /PID %%a /F >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: ── Start server ──────────────────────────────────────────────────────────────
echo Starting Database...
start /b cmd /c "npm start -- -p %PORT% > database.log 2>&1"

:: ── Wait for ready ────────────────────────────────────────────────────────────
echo Waiting for server...
set /a attempts=0
:wait_loop
    set /a attempts+=1
    if %attempts% gtr 30 (
        echo Server took too long. Check database.log for errors.
        pause & exit /b 1
    )
    powershell -Command "try{Invoke-WebRequest -Uri '%URL%' -UseBasicParsing -TimeoutSec 1|Out-Null;exit 0}catch{exit 1}" >nul 2>&1
    if errorlevel 1 (
        timeout /t 1 /nobreak >nul
        goto wait_loop
    )

:: ── Open browser ──────────────────────────────────────────────────────────────
echo.
echo  Database is running at %URL%
echo  Logs: %~dp0database.log
echo.
start "" "%URL%"
