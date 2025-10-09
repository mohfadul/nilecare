@echo off
echo ============================================
echo   Auto-Creating NileCare Database
echo ============================================
echo.

REM Try different MySQL installation locations
set MYSQL_FOUND=0

REM Location 1: MySQL Server 8.0
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    echo Found MySQL Server 8.0
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 2: MySQL Server 8.4
if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" (
    echo Found MySQL Server 8.4
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 3: MySQL Server 9.0
if exist "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe" (
    echo Found MySQL Server 9.0
    set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 9.0\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 4: XAMPP
if exist "C:\xampp\mysql\bin\mysql.exe" (
    echo Found XAMPP MySQL
    set MYSQL_PATH="C:\xampp\mysql\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 5: WAMP
if exist "C:\wamp64\bin\mysql\mysql8.0.30\bin\mysql.exe" (
    echo Found WAMP MySQL
    set MYSQL_PATH="C:\wamp64\bin\mysql\mysql8.0.30\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 6: MariaDB
if exist "C:\Program Files\MariaDB 10.6\bin\mysql.exe" (
    echo Found MariaDB
    set MYSQL_PATH="C:\Program Files\MariaDB 10.6\bin\mysql.exe"
    set MYSQL_FOUND=1
    goto CREATE_DB
)

REM Location 7: Try PATH (mysql command)
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo Found MySQL in system PATH
    set MYSQL_PATH=mysql
    set MYSQL_FOUND=1
    goto CREATE_DB
)

:MYSQL_NOT_FOUND
echo.
echo ❌ MySQL not found in common locations!
echo.
echo Please install MySQL or use one of these methods:
echo   1. MySQL Workbench - Run: CREATE DATABASE nilecare;
echo   2. phpMyAdmin - Create database manually
echo   3. Tell me where MySQL is installed
echo.
pause
exit /b 1

:CREATE_DB
echo.
echo Attempting to create database 'nilecare'...
echo.

REM Try without password first (common for development)
echo Trying without password...
%MYSQL_PATH% -u root -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database 'nilecare' created successfully!
    goto SUCCESS
)

REM If failed, try with empty password explicitly
echo Trying with empty password...
%MYSQL_PATH% -u root --password= -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database 'nilecare' created successfully!
    goto SUCCESS
)

REM If still failed, prompt for password
echo.
echo MySQL requires a password. Please enter your MySQL root password:
%MYSQL_PATH% -u root -p -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database 'nilecare' created successfully!
    goto SUCCESS
)

echo.
echo ❌ Failed to create database
echo Please check your MySQL credentials
pause
exit /b 1

:SUCCESS
echo.
echo ============================================
echo   Database Setup Complete!
echo ============================================
echo.
echo Now starting NileCare Platform...
echo.

REM Start backend
start "NileCare Backend" cmd /k "cd microservices\payment-gateway-service && echo === Backend: http://localhost:7001 === && npm run dev"

timeout /t 5 /nobreak >nul

REM Start frontend
start "NileCare Frontend" cmd /k "cd clients\web-dashboard && echo === Frontend: http://localhost:5173 === && npm run dev"

echo.
echo ============================================
echo   Services Starting!
echo ============================================
echo.
echo Two windows opened:
echo   - Backend (Port 7001)
echo   - Frontend (Port 5173)
echo.
echo Wait 20-30 seconds, then open:
echo   http://localhost:5173
echo.
echo Login: doctor@nilecare.sd / TestPass123!
echo ============================================
echo.
pause

