# ============================================================================
# START CORE NILECARE SERVICES (Simplified)
# ============================================================================
# Starts only the essential services needed for basic functionality
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTING CORE NILECARE SERVICES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Core services needed for basic functionality
$coreServices = @(
    @{ Name = "Main-NileCare (Orchestrator)"; Path = "microservices\main-nilecare"; Port = 7000; Critical = $true },
    @{ Name = "Auth Service"; Path = "microservices\auth-service"; Port = 7020; Critical = $true },
    @{ Name = "Clinical Service"; Path = "microservices\clinical"; Port = 3004; Critical = $false },
    @{ Name = "Appointment Service"; Path = "microservices\appointment-service"; Port = 7040; Critical = $false },
    @{ Name = "Billing Service"; Path = "microservices\billing-service"; Port = 7050; Critical = $false }
)

Write-Host "Core services to start: $($coreServices.Count)" -ForegroundColor Yellow
Write-Host ""

$startedCount = 0

foreach ($service in $coreServices) {
    $servicePath = Join-Path $PSScriptRoot $service.Path
    
    if (Test-Path $servicePath) {
        if (Test-Path (Join-Path $servicePath "package.json")) {
            $criticalMark = if ($service.Critical) { " [CRITICAL]" } else { "" }
            Write-Host "Starting: " -ForegroundColor Yellow -NoNewline
            Write-Host "$($service.Name)$criticalMark " -ForegroundColor White -NoNewline
            Write-Host "(Port: $($service.Port))" -ForegroundColor Gray
            
            # Start in new PowerShell window with title
            $windowTitle = "NileCare - $($service.Name)"
            $scriptBlock = "cd '$servicePath'; `$Host.UI.RawUI.WindowTitle = '$windowTitle'; Write-Host 'Starting $($service.Name)...' -ForegroundColor Cyan; npm run dev; Read-Host 'Press Enter to close'"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
            
            $startedCount++
            Start-Sleep -Milliseconds 800  # Delay between starts
        } else {
            Write-Host "  ⚠️  Skipping $($service.Name): No package.json found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  Skipping $($service.Name): Directory not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTUP SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Started: $startedCount core services" -ForegroundColor Green
Write-Host ""
Write-Host "Each service is starting in its own window..." -ForegroundColor White
Write-Host "Wait about 30-60 seconds for all services to be ready." -ForegroundColor Gray
Write-Host ""
Write-Host "NEXT STEP - Start the Frontend:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option 1 (New Terminal):" -ForegroundColor Cyan
Write-Host "  cd nilecare-frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option 2 (Run Script):" -ForegroundColor Cyan
Write-Host "  .\start-frontend.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Services Running:" -ForegroundColor Yellow
Write-Host "  Main API: http://localhost:7000" -ForegroundColor Cyan
Write-Host "  Auth: http://localhost:7020" -ForegroundColor Cyan
Write-Host "  Frontend (after start): http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Core services starting! 🎉" -ForegroundColor Green
Write-Host ""

