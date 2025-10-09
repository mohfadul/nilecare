@echo off
echo ============================================
echo   NileCare Platform - Complete Restart
echo ============================================
echo.

REM Step 1: Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)
echo ✅ Node.js is installed
echo.

REM Step 2: Create correct .env file
echo [2/6] Creating backend configuration...
(
echo NODE_ENV=development
echo PORT=7001
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=nilecare
echo DB_USER=root
echo DB_PASSWORD=
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo PAYMENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
echo JWT_SECRET=dev_jwt_secret_12345
echo SESSION_SECRET=dev_session_secret_12345
echo LOG_LEVEL=info
) > microservices\payment-gateway-service\.env
echo ✅ Backend configured
echo.

REM Step 3: Create database
echo [3/6] Creating MySQL database...
echo CREATE DATABASE IF NOT EXISTS nilecare; > temp_create_db.sql

REM Try different MySQL locations
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS nilecare;" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Database created
        goto DB_DONE
    )
)

if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS nilecare;" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Database created
        goto DB_DONE
    )
)

where mysql >nul 2>&1
if %errorlevel% equ 0 (
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare;" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Database created
        goto DB_DONE
    )
)

echo ⚠️  Could not auto-create database
echo    Please create it manually: CREATE DATABASE nilecare;

:DB_DONE
del temp_create_db.sql 2>nul
echo.

REM Step 4: Kill any existing processes on ports
echo [4/6] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7001') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F >nul 2>&1
echo ✅ Ports cleaned
echo.

REM Step 5: Verify frontend dependencies
echo [5/6] Verifying frontend dependencies...
if not exist "clients\web-dashboard\node_modules\vite" (
    echo Installing frontend dependencies...
    cd clients\web-dashboard
    call npm install --legacy-peer-deps --no-workspaces
    cd ..\..
)
echo ✅ Frontend dependencies ready
echo.

REM Step 6: Start services
echo [6/6] Starting services...
echo.
echo ============================================
echo   Starting NileCare Platform
echo ============================================
echo.

REM Start backend in new window
start "NileCare Backend - Port 7001" cmd /k "cd /d %CD%\microservices\payment-gateway-service && echo === Backend API === && echo http://localhost:7001 && echo. && npm run dev"

REM Wait 5 seconds
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start frontend in new window
start "NileCare Frontend - Port 5173" cmd /k "cd /d %CD%\clients\web-dashboard && echo === Web Dashboard === && echo http://localhost:5173 && echo. && npm run dev"

echo.
echo ============================================
echo   Services Starting!
echo ============================================
echo.
echo Two windows opened:
echo   1. Backend  (Port 7001)
echo   2. Frontend (Port 5173)
echo.
echo Wait 30 seconds for services to start.
echo.
echo Backend should show:
echo   "Database connected successfully"
echo   "Payment Gateway Service listening on port 7001"
echo.
echo Frontend should show:
echo   "VITE ready in XXX ms"
echo   "Local: http://localhost:5173/"
echo.
echo Then open: http://localhost:5173
echo.
echo Login:
echo   Email:    doctor@nilecare.sd
echo   Password: TestPass123!
echo.
echo ============================================
echo.
pause

