@echo off
echo ============================================
echo   NileCare Platform - Automatic Setup
echo ============================================
echo.

REM Step 1: Create .env file with correct settings
echo [1/5] Creating environment configuration...
(
echo NODE_ENV=development
echo PORT=7001
echo SERVICE_NAME=payment-gateway-service
echo APP_URL=http://localhost:3000
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=nilecare
echo DB_USER=root
echo DB_PASSWORD=
echo DB_CONNECTION_POOL_MIN=5
echo DB_CONNECTION_POOL_MAX=20
echo.
echo # Redis Configuration (Optional)
echo REDIS_HOST=localhost
echo REDIS_PORT=6379
echo REDIS_PASSWORD=
echo REDIS_DB=0
echo.
echo # Kafka Configuration (Optional)
echo KAFKA_BROKERS=localhost:9092
echo KAFKA_CLIENT_ID=payment-gateway-service
echo.
echo # Payment Encryption
echo PAYMENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
echo.
echo # Sudan Payment Providers (Test Mode)
echo BANK_OF_KHARTOUM_API_KEY=test_api_key
echo BANK_OF_KHARTOUM_API_SECRET=test_api_secret
echo BANK_OF_KHARTOUM_API_URL=https://test-api.bankofkhartoum.com
echo BANK_OF_KHARTOUM_MERCHANT_ID=TEST_MERCHANT
echo.
echo ZAIN_CASH_API_KEY=test_api_key
echo ZAIN_CASH_API_SECRET=test_api_secret
echo ZAIN_CASH_API_URL=https://test-api.zaincash.sd
echo ZAIN_CASH_MERCHANT_ID=TEST_MERCHANT
echo.
echo MTN_MONEY_API_KEY=test_api_key
echo MTN_MONEY_API_SECRET=test_api_secret
echo MTN_MONEY_API_URL=https://test-api.mtn.sd
echo.
echo SUDANI_CASH_API_KEY=test_api_key
echo SUDANI_CASH_API_SECRET=test_api_secret
echo SUDANI_CASH_API_URL=https://test-api.sudanicash.sd
echo.
echo # Stripe (Optional)
echo STRIPE_SECRET_KEY=sk_test_your_stripe_key
echo STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
echo.
echo # AWS S3 (Optional)
echo AWS_REGION=us-east-1
echo AWS_ACCESS_KEY_ID=test
echo AWS_SECRET_ACCESS_KEY=test
echo S3_BUCKET_NAME=nilecare-dev
echo.
echo # Webhook
echo PAYMENT_WEBHOOK_SECRET=dev_webhook_secret_12345
echo.
echo # Monitoring
echo PROMETHEUS_ENABLED=false
echo LOG_LEVEL=info
echo.
echo # JWT ^& Session
echo JWT_SECRET=dev_jwt_secret_12345
echo JWT_REFRESH_SECRET=dev_jwt_refresh_secret_12345
echo SESSION_SECRET=dev_session_secret_12345
) > microservices\payment-gateway-service\.env

echo    Environment file created successfully
echo.

REM Step 2: Setup MySQL Database
echo [2/5] Setting up MySQL database...
echo    Creating database 'nilecare'...

mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% equ 0 (
    echo    Database created successfully
) else (
    echo    Database may already exist or MySQL not running
    echo    Trying with password prompt...
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)
echo.

REM Step 3: Create basic tables
echo [3/5] Creating database tables...
mysql -u root nilecare < setup-database.sql 2>nul
if %errorlevel% equ 0 (
    echo    Tables created successfully
) else (
    echo    Using password prompt...
    mysql -u root -p nilecare < setup-database.sql
)
echo.

REM Step 4: Create test users
echo [4/5] Creating test users...
mysql -u root nilecare < testing\test-users\seed-test-users.sql 2>nul
if %errorlevel% equ 0 (
    echo    Test users created successfully
) else (
    echo    Note: Test users might already exist or need password
)
echo.

REM Step 5: Start services
echo [5/5] Starting services...
echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Starting Backend Service (Port 7001)...
start "NileCare Backend" cmd /k "cd microservices\payment-gateway-service && echo === Backend Starting === && npm run dev"

timeout /t 5 /nobreak >nul

echo Starting Frontend Service (Port 5173)...
start "NileCare Frontend" cmd /k "cd clients\web-dashboard && echo === Frontend Starting === && npm run dev"

echo.
echo ============================================
echo   NileCare Platform is Starting!
echo ============================================
echo.
echo Backend:  http://localhost:7001
echo Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo   Email:    doctor@nilecare.sd
echo   Password: TestPass123!
echo.
echo Wait 15-30 seconds for services to start,
echo then open: http://localhost:5173
echo.
echo ============================================
pause

