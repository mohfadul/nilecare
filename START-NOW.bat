@echo off
echo Starting NileCare Platform...
echo.

start "Backend - Port 7001" cmd /k "cd microservices\payment-gateway-service && npm run dev"

timeout /t 3 /nobreak >nul

start "Frontend - Port 5173" cmd /k "cd clients\web-dashboard && npm run dev"

echo.
echo Two windows opened!
echo.
echo Wait 20 seconds, then open: http://localhost:5173
echo Login: doctor@nilecare.sd / TestPass123!
echo.
pause

