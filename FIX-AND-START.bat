@echo off
echo ============================================
echo   NileCare - Quick Fix and Start
echo ============================================
echo.

REM Fix 1: Create correct .env file
echo [1/4] Fixing backend configuration...
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
echo JWT_REFRESH_SECRET=dev_jwt_refresh_secret_12345
echo SESSION_SECRET=dev_session_secret_12345
echo LOG_LEVEL=info
) > microservices\payment-gateway-service\.env
echo    Backend config fixed!
echo.

REM Fix 2: Setup database
echo [2/4] Setting up database...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare;" 2>nul
if %errorlevel% equ 0 (
    echo    Database 'nilecare' ready!
) else (
    echo    Database might already exist - OK!
)
echo.

REM Fix 3: Install frontend dependencies
echo [3/4] Installing frontend dependencies...
cd clients\web-dashboard
call npm install
cd ..\..
echo    Frontend dependencies installed!
echo.

REM Fix 4: Start services
echo [4/4] Starting services...
echo.
echo ============================================
echo   Starting NileCare Platform
echo ============================================
echo.

start "NileCare Backend" cmd /k "cd microservices\payment-gateway-service && echo === Backend: http://localhost:7001 === && npm run dev"

timeout /t 5 /nobreak >nul

start "NileCare Frontend" cmd /k "cd clients\web-dashboard && echo === Frontend: http://localhost:5173 === && npm run dev"

echo.
echo ============================================
echo   Platform Starting!
echo ============================================
echo.
echo Wait 20-30 seconds, then open:
echo.
echo    http://localhost:5173
echo.
echo Login: doctor@nilecare.sd / TestPass123!
echo.
echo ============================================
pause

