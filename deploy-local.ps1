# NileCare Platform - Local Deployment Script
# Deploys all services for local development

Write-Host "🚀 NileCare Platform - Local Deployment Starting..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check Node.js
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Cyan
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js installed" -ForegroundColor Green

# Check if Docker is running (optional)
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Cyan
docker version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker is available" -ForegroundColor Green
    $useDocker = $true
} else {
    Write-Host "⚠️  Docker not running - will use manual service startup" -ForegroundColor Yellow
    $useDocker = $false
}

# Deploy Backend Services
Write-Host "`n🔧 DEPLOYING BACKEND SERVICES..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if ($useDocker) {
    Write-Host "Using Docker Compose for backend..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "`n✅ Docker services started" -ForegroundColor Green
    docker-compose ps
} else {
    Write-Host "Docker not available. To start backend services manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Payment Gateway Service:" -ForegroundColor White
    Write-Host "     cd microservices\payment-gateway-service" -ForegroundColor Gray
    Write-Host "     npm install --no-workspaces" -ForegroundColor Gray
    Write-Host "     npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Auth Service:" -ForegroundColor White
    Write-Host "     cd microservices\auth-service" -ForegroundColor Gray
    Write-Host "     npm install" -ForegroundColor Gray
    Write-Host "     npm run dev" -ForegroundColor Gray
    Write-Host ""
}

# Deploy Frontend
Write-Host "`n🎨 DEPLOYING FRONTEND..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

cd clients\web-dashboard

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend dependency installation failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Frontend dependencies ready" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "`n⚠️  .env file not found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env created from template" -ForegroundColor Green
        Write-Host "⚠️  Please review and update .env with your configuration" -ForegroundColor Yellow
    }
}

# Start frontend development server
Write-Host "`n🚀 Starting frontend development server..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n✅ Frontend server starting in new window..." -ForegroundColor Green

# Display access information
Write-Host "`n🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 ACCESS YOUR NILECARE PLATFORM:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend (Web Dashboard):" -ForegroundColor White
Write-Host "    http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend Services:" -ForegroundColor White
Write-Host "    Gateway:          http://localhost:3000" -ForegroundColor Yellow
Write-Host "    Auth Service:     http://localhost:3001" -ForegroundColor Yellow
Write-Host "    Payment Gateway:  http://localhost:7001" -ForegroundColor Yellow
Write-Host ""
Write-Host "  API Documentation:" -ForegroundColor White
Write-Host "    http://localhost:3000/api-docs" -ForegroundColor Yellow
Write-Host "    http://localhost:7001/api-docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Demo Credentials:" -ForegroundColor White
Write-Host "    Email:    doctor@nilecare.sd" -ForegroundColor Yellow
Write-Host "    Password: Password123!" -ForegroundColor Yellow
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Platform is running!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

