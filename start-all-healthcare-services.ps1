# Start All Healthcare Services - PowerShell Script
# =================================================
# Starts Auth, CDS, EHR, and Clinical services in order
# Each service runs in a separate PowerShell window

Write-Host "🏥 Starting NileCare Healthcare Services..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Function to start service in new window
function Start-ServiceInNewWindow {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    $command = "cd '$PSScriptRoot\$ServicePath'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Write-Host "✅ $ServiceName started in new window" -ForegroundColor Green
    Write-Host ""
}

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgCheck = pg_isready -h localhost 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL is not running. Please start PostgreSQL first." -ForegroundColor Red
        Write-Host "   On Windows: net start postgresql-x64-14" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not check PostgreSQL status. Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# 1. Start Auth Service (MUST BE FIRST!)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 1/4: Starting Auth Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Start-ServiceInNewWindow -ServiceName "Auth Service" -ServicePath "microservices\auth-service" -Port 7020
Write-Host "⏱️  Waiting 5 seconds for Auth Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 2. Start CDS Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 2/4: Starting CDS Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Start-ServiceInNewWindow -ServiceName "CDS Service" -ServicePath "microservices\cds-service" -Port 4002
Write-Host "⏱️  Waiting 3 seconds for CDS Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 3. Start EHR Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 3/4: Starting EHR Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Start-ServiceInNewWindow -ServiceName "EHR Service" -ServicePath "microservices\ehr-service" -Port 4001
Write-Host "⏱️  Waiting 3 seconds for EHR Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 4. Start Clinical Service
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 4/4: Starting Clinical Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Start-ServiceInNewWindow -ServiceName "Clinical Service" -ServicePath "microservices\clinical" -Port 3004
Write-Host "⏱️  Waiting 3 seconds for Clinical Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ ALL SERVICES STARTED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  • Auth Service:     http://localhost:7020" -ForegroundColor White
Write-Host "  • CDS Service:      http://localhost:4002" -ForegroundColor White
Write-Host "  • EHR Service:      http://localhost:4001" -ForegroundColor White
Write-Host "  • Clinical Service: http://localhost:3004" -ForegroundColor White
Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:7020/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:4002/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:4001/health" -ForegroundColor Gray
Write-Host "  curl http://localhost:3004/health" -ForegroundColor Gray
Write-Host ""
Write-Host "API Documentation:" -ForegroundColor Cyan
Write-Host "  http://localhost:4002/api-docs  (CDS Service)" -ForegroundColor Gray
Write-Host "  http://localhost:4001/api-docs  (EHR Service)" -ForegroundColor Gray
Write-Host "  http://localhost:3004/api-docs  (Clinical Service)" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop services: Close each PowerShell window or press CTRL+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Ready to test! See START_ALL_HEALTHCARE_SERVICES.md for testing examples" -ForegroundColor Green
Write-Host ""

