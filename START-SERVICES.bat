@echo off
echo ============================================
echo   Starting NileCare Platform
echo ============================================
echo.

REM Start Backend (Payment Gateway)
echo Starting Backend Service...
start "NileCare Backend" cmd /k "cd microservices\payment-gateway-service && echo === Payment Gateway Service === && echo Running on http://localhost:7001 && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Frontend (Web Dashboard)
echo Starting Frontend...
start "NileCare Frontend" cmd /k "cd clients\web-dashboard && echo === NileCare Web Dashboard === && echo Running on http://localhost:5173 && npm run dev"

echo.
echo ============================================
echo   Services Starting...
echo ============================================
echo.
echo Backend:  http://localhost:7001
echo Frontend: http://localhost:5173
echo.
echo Login: doctor@nilecare.sd / TestPass123!
echo ============================================

