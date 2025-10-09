# NileCare Platform - Automatic Setup Script (PowerShell)
# This script sets up everything automatically

Write-Host "============================================" -ForegroundColor Green
Write-Host "  NileCare Platform - Automatic Setup" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Step 1: Create .env file
Write-Host "[1/5] Creating environment configuration..." -ForegroundColor Cyan

$envContent = @"
NODE_ENV=development
PORT=7001
SERVICE_NAME=payment-gateway-service
APP_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=
DB_CONNECTION_POOL_MIN=5
DB_CONNECTION_POOL_MAX=20

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Kafka Configuration (Optional)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=payment-gateway-service

# Payment Encryption
PAYMENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Sudan Payment Providers (Test Mode)
BANK_OF_KHARTOUM_API_KEY=test_api_key
BANK_OF_KHARTOUM_API_SECRET=test_api_secret
BANK_OF_KHARTOUM_API_URL=https://test-api.bankofkhartoum.com
BANK_OF_KHARTOUM_MERCHANT_ID=TEST_MERCHANT

ZAIN_CASH_API_KEY=test_api_key
ZAIN_CASH_API_SECRET=test_api_secret
ZAIN_CASH_API_URL=https://test-api.zaincash.sd
ZAIN_CASH_MERCHANT_ID=TEST_MERCHANT

MTN_MONEY_API_KEY=test_api_key
MTN_MONEY_API_SECRET=test_api_secret
MTN_MONEY_API_URL=https://test-api.mtn.sd

SUDANI_CASH_API_KEY=test_api_key
SUDANI_CASH_API_SECRET=test_api_secret
SUDANI_CASH_API_URL=https://test-api.sudanicash.sd

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# AWS S3 (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=nilecare-dev

# Webhook
PAYMENT_WEBHOOK_SECRET=dev_webhook_secret_12345

# Monitoring
PROMETHEUS_ENABLED=false
LOG_LEVEL=info

# JWT & Session
JWT_SECRET=dev_jwt_secret_12345
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_12345
SESSION_SECRET=dev_session_secret_12345
"@

$envContent | Out-File -FilePath "microservices\payment-gateway-service\.env" -Encoding UTF8
Write-Host "   Environment file created" -ForegroundColor Green
Write-Host ""

# Step 2: Setup MySQL Database
Write-Host "[2/5] Setting up MySQL database..." -ForegroundColor Cyan

try {
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
    Write-Host "   Database created successfully" -ForegroundColor Green
} catch {
    Write-Host "   Note: Database might already exist" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Create tables
Write-Host "[3/5] Creating database tables..." -ForegroundColor Cyan

try {
    Get-Content setup-database.sql | mysql -u root nilecare 2>$null
    Write-Host "   Tables created successfully" -ForegroundColor Green
} catch {
    Write-Host "   Note: Tables might already exist" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Create test users
Write-Host "[4/5] Creating test users..." -ForegroundColor Cyan

try {
    Get-Content testing\test-users\seed-test-users.sql | mysql -u root nilecare 2>$null
    Write-Host "   Test users created successfully" -ForegroundColor Green
} catch {
    Write-Host "   Note: Test users might already exist" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Start services
Write-Host "[5/5] Starting services..." -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Starting Backend Service (Port 7001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\microservices\payment-gateway-service'; Write-Host '=== Backend Starting ===' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 5

Write-Host "Starting Frontend Service (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\clients\web-dashboard'; Write-Host '=== Frontend Starting ===' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  NileCare Platform is Starting!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:7001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    doctor@nilecare.sd"
Write-Host "  Password: TestPass123!"
Write-Host ""
Write-Host "Wait 15-30 seconds for services to start," -ForegroundColor Yellow
Write-Host "then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================" -ForegroundColor Green

