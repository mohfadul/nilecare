@echo off
REM NileCare Frontend - Quick Start
echo ============================================
echo   NileCare Web Dashboard
echo ============================================
echo.
cd clients\web-dashboard
echo Installing dependencies...
echo.
call npm install
echo.
echo Starting frontend on http://localhost:5173
echo.
npm run dev

