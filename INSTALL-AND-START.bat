@echo off
echo ============================================
echo   NileCare - Clean Install and Start
echo ============================================
echo.

REM Step 1: Fix backend .env
echo [1/3] Configuring backend...
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
echo PAYMENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
echo JWT_SECRET=dev_jwt_secret_12345
echo SESSION_SECRET=dev_session_secret_12345
) > microservices\payment-gateway-service\.env
echo    Backend configured!
echo.

REM Step 2: Setup database
echo [2/3] Setting up database...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare;" 2>nul
echo    Database ready!
echo.

REM Step 3: Install frontend dependencies (clean install)
echo [3/3] Installing frontend dependencies...
echo    This may take 2-3 minutes, please wait...
cd clients\web-dashboard

REM Clean previous installations
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Install with legacy peer deps to avoid conflicts
call npm install --legacy-peer-deps

cd ..\..
echo.
echo    Frontend dependencies installed!
echo.

REM Step 4: Start services
echo ============================================
echo   Starting Services
echo ============================================
echo.

start "Backend - Port 7001" cmd /k "cd microservices\payment-gateway-service && echo === Backend API: http://localhost:7001 === && npm run dev"

timeout /t 5 /nobreak >nul

start "Frontend - Port 5173" cmd /k "cd clients\web-dashboard && echo === Web App: http://localhost:5173 === && npm run dev"

echo.
echo ============================================
echo   Platform Starting!
echo ============================================
echo.
echo Two windows opened:
echo   - Backend (Port 7001)
echo   - Frontend (Port 5173)
echo.
echo Wait 20-30 seconds for services to start,
echo then open: http://localhost:5173
echo.
echo Login: doctor@nilecare.sd / TestPass123!
echo ============================================
echo.
pause

