# ═══════════════════════════════════════════════════════════════════════════
# NileCare - Start All Services
# ═══════════════════════════════════════════════════════════════════════════
# This script starts all NileCare microservices in separate PowerShell windows
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  Starting NileCare Microservices" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "microservices")) {
    Write-Host "❌ Error: Must run from NileCare root directory" -ForegroundColor Red
    exit 1
}

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    # Create a PowerShell script to run in the new window
    $command = @"
`$Host.UI.RawUI.WindowTitle = '$ServiceName - Port $Port'
Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '  $ServiceName' -ForegroundColor Cyan
Write-Host '  Port: $Port' -ForegroundColor Cyan
Write-Host '═══════════════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''
cd '$ServicePath'
npm run dev
"@
    
    # Start new PowerShell window with the command
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    # Wait a moment before starting next service
    Start-Sleep -Milliseconds 500
}

# Get current directory
$rootPath = Get-Location

# Start services in order (Auth Service MUST be first!)
Write-Host ""
Write-Host "⚠️  Starting services in correct order..." -ForegroundColor Cyan
Write-Host ""

# 1. Auth Service (MUST START FIRST)
Start-Service -ServiceName "Auth Service" `
              -ServicePath "$rootPath\microservices\auth-service" `
              -Port 7020

Write-Host "✓ Auth Service started" -ForegroundColor Green
Write-Host "  Waiting 3 seconds for Auth Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 2. Main NileCare Service
Start-Service -ServiceName "Main NileCare" `
              -ServicePath "$rootPath\microservices\main-nilecare" `
              -Port 7000

Write-Host "✓ Main NileCare started" -ForegroundColor Green

# 3. Business Service
Start-Service -ServiceName "Business Service" `
              -ServicePath "$rootPath\microservices\business" `
              -Port 7010

Write-Host "✓ Business Service started" -ForegroundColor Green

# 4. Appointment Service
Start-Service -ServiceName "Appointment Service" `
              -ServicePath "$rootPath\microservices\appointment-service" `
              -Port 7040

Write-Host "✓ Appointment Service started" -ForegroundColor Green

# 5. Payment Gateway Service
Start-Service -ServiceName "Payment Gateway" `
              -ServicePath "$rootPath\microservices\payment-gateway-service" `
              -Port 7030

Write-Host "✓ Payment Gateway started" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ All Services Started!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  • Auth Service:       http://localhost:7020" -ForegroundColor White
Write-Host "  • Main NileCare:      http://localhost:7000" -ForegroundColor White
Write-Host "  • Business Service:   http://localhost:7010" -ForegroundColor White
Write-Host "  • Appointment Service: http://localhost:7040" -ForegroundColor White
Write-Host "  • Payment Gateway:    http://localhost:7030" -ForegroundColor White
Write-Host ""
Write-Host "Health checks:" -ForegroundColor Yellow
Write-Host "  Invoke-WebRequest http://localhost:7020/health" -ForegroundColor Gray
Write-Host "  Invoke-WebRequest http://localhost:7000/health" -ForegroundColor Gray
Write-Host "  Invoke-WebRequest http://localhost:7010/health" -ForegroundColor Gray
Write-Host "  Invoke-WebRequest http://localhost:7040/health" -ForegroundColor Gray
Write-Host "  Invoke-WebRequest http://localhost:7030/health" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services: Close all PowerShell windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

