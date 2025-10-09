# Setup Test Environment Script (PowerShell)
# Prepares the test environment for running integration tests

Write-Host "🔧 Setting up NileCare Test Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.test exists
if (-Not (Test-Path ".env.test")) {
    Write-Host "📝 Creating .env.test file..." -ForegroundColor Yellow
    
    $envContent = @"
# Test Environment Configuration
NODE_ENV=test

# Service URLs
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
CLINICAL_SERVICE_URL=http://localhost:3002
BUSINESS_SERVICE_URL=http://localhost:3003
DATA_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nilecare_test
POSTGRES_USER=nilecare_test
POSTGRES_PASSWORD=test_password

MONGO_URI=mongodb://localhost:27017/nilecare_test
REDIS_URL=redis://localhost:6379

# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.nilecare.com
TEST_ADMIN_PASSWORD=TestAdmin123!
TEST_DOCTOR_EMAIL=doctor@test.nilecare.com
TEST_DOCTOR_PASSWORD=TestDoctor123!
TEST_PATIENT_EMAIL=patient@test.nilecare.com
TEST_PATIENT_PASSWORD=TestPatient123!

# Performance Test Thresholds (ms)
API_RESPONSE_THRESHOLD=500
DB_QUERY_THRESHOLD=100
AUTH_FLOW_THRESHOLD=1000
"@
    
    $envContent | Out-File -FilePath ".env.test" -Encoding utf8
    Write-Host "✅ Created .env.test" -ForegroundColor Green
} else {
    Write-Host "✅ .env.test already exists" -ForegroundColor Green
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏥 Running health check..." -ForegroundColor Cyan
node scripts/health-check.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some services are not running. Start them with: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Ensure all services are running: npm run dev (in project root)"
Write-Host "  2. Run health check: npm run test:health"
Write-Host "  3. Run tests: npm test"
Write-Host ""

