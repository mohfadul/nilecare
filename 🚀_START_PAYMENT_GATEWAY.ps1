# 🚀 Start Payment Gateway Service
# This script starts the payment gateway with all dependencies

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💳  STARTING PAYMENT GATEWAY SERVICE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Navigate to payment gateway directory
$paymentGatewayPath = "microservices\payment-gateway-service"

# Check if directory exists
if (!(Test-Path $paymentGatewayPath)) {
    Write-Host "❌ Payment Gateway directory not found!" -ForegroundColor Red
    Write-Host "   Expected: $paymentGatewayPath" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Location: $paymentGatewayPath" -ForegroundColor Green

# Check .env file
if (!(Test-Path "$paymentGatewayPath\.env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Creating .env file..." -ForegroundColor Yellow
    Copy-Item "$paymentGatewayPath\env.example" "$paymentGatewayPath\.env" -ErrorAction SilentlyContinue
    if ($?) {
        Write-Host "✅ .env file created from env.example" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Please create .env file manually" -ForegroundColor Yellow
    }
}

# Check if npm packages are installed
if (!(Test-Path "$paymentGatewayPath\node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    Push-Location $paymentGatewayPath
    npm install
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Dependency installation failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Check if MySQL is running
Write-Host ""
Write-Host "🔍 Checking MySQL connection..." -ForegroundColor Yellow
$mysqlCheck = & mysql -u root -e "SELECT 1" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL might not be running" -ForegroundColor Yellow
    Write-Host "   Service will attempt to connect anyway..." -ForegroundColor Yellow
}

# Check if auth-service is running
Write-Host ""
Write-Host "🔍 Checking auth-service..." -ForegroundColor Yellow
try {
    $authCheck = Invoke-WebRequest -Uri "http://localhost:7020/health" -TimeoutSec 2 -ErrorAction Stop
    if ($authCheck.StatusCode -eq 200) {
        Write-Host "✅ Auth service is running (port 7020)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Auth service not detected on port 7020" -ForegroundColor Yellow
    Write-Host "   Payment gateway will attempt to connect anyway..." -ForegroundColor Yellow
    Write-Host "   To start auth service:" -ForegroundColor Gray
    Write-Host "   cd microservices\auth-service && npm run dev" -ForegroundColor Gray
}

# Check if orchestrator is running
Write-Host ""
Write-Host "🔍 Checking orchestrator..." -ForegroundColor Yellow
try {
    $orchCheck = Invoke-WebRequest -Uri "http://localhost:7000/health" -TimeoutSec 2 -ErrorAction Stop
    if ($orchCheck.StatusCode -eq 200) {
        Write-Host "✅ Orchestrator is running (port 7000)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Orchestrator not detected on port 7000" -ForegroundColor Yellow
    Write-Host "   To start orchestrator:" -ForegroundColor Gray
    Write-Host "   cd microservices\main-nilecare && npm run dev" -ForegroundColor Gray
}

# Start payment gateway
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Starting Payment Gateway Service..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📍 Service will start on: http://localhost:7030" -ForegroundColor Green
Write-Host "🏥 Health check: http://localhost:7030/health" -ForegroundColor Green
Write-Host ""

Push-Location $paymentGatewayPath

# Start the service
npm run dev

Pop-Location

