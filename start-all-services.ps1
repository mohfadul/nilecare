# ============================================================================
# START ALL NILECARE MICROSERVICES
# ============================================================================
# Starts all 17 microservices concurrently in separate terminal windows
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTING ALL NILECARE MICROSERVICES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{ Name = "Main-NileCare"; Path = "microservices\main-nilecare"; Port = 7000 },
    @{ Name = "Auth Service"; Path = "microservices\auth-service"; Port = 7020 },
    @{ Name = "Business Service"; Path = "microservices\business"; Port = 7010 },
    @{ Name = "Clinical Service"; Path = "microservices\clinical"; Port = 3004 },
    @{ Name = "Appointment Service"; Path = "microservices\appointment-service"; Port = 7040 },
    @{ Name = "Billing Service"; Path = "microservices\billing-service"; Port = 7050 },
    @{ Name = "Payment Gateway"; Path = "microservices\payment-gateway-service"; Port = 7030 },
    @{ Name = "Lab Service"; Path = "microservices\lab-service"; Port = 7060 },
    @{ Name = "Medication Service"; Path = "microservices\medication-service"; Port = 7070 },
    @{ Name = "Inventory Service"; Path = "microservices\inventory-service"; Port = 7080 },
    @{ Name = "Facility Service"; Path = "microservices\facility-service"; Port = 7090 },
    @{ Name = "Notification Service"; Path = "microservices\notification-service"; Port = 7100 },
    @{ Name = "CDS Service"; Path = "microservices\cds-service"; Port = 7110 },
    @{ Name = "HL7/FHIR Service"; Path = "microservices\hl7-fhir-service"; Port = 7120 },
    @{ Name = "Device Integration"; Path = "microservices\device-integration-service"; Port = 7130 },
    @{ Name = "WebSocket Service"; Path = "microservices\websocket-service"; Port = 7140 },
    @{ Name = "API Gateway"; Path = "microservices\api-gateway"; Port = 8080 }
)

Write-Host "Services to start: $($services.Count)" -ForegroundColor Yellow
Write-Host ""

$startedCount = 0
$skippedCount = 0

foreach ($service in $services) {
    $servicePath = Join-Path $PSScriptRoot $service.Path
    
    if (Test-Path $servicePath) {
        if (Test-Path (Join-Path $servicePath "package.json")) {
            Write-Host "Starting: " -ForegroundColor Yellow -NoNewline
            Write-Host "$($service.Name) " -ForegroundColor White -NoNewline
            Write-Host "(Port: $($service.Port))" -ForegroundColor Gray
            
            # Start in new PowerShell window
            $scriptBlock = "cd '$servicePath'; npm run dev; Read-Host 'Press Enter to close'"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
            
            $startedCount++
            Start-Sleep -Milliseconds 500  # Small delay between starts
        } else {
            Write-Host "  ⚠️  Skipping $($service.Name): No package.json found" -ForegroundColor Yellow
            $skippedCount++
        }
    } else {
        Write-Host "  ⚠️  Skipping $($service.Name): Directory not found" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTUP SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Started: $startedCount services" -ForegroundColor Green
if ($skippedCount -gt 0) {
    Write-Host "⚠️  Skipped: $skippedCount services" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Services are starting in separate windows..." -ForegroundColor White
Write-Host "Each service will display its startup logs." -ForegroundColor Gray
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor Yellow
Write-Host "  cd nilecare-frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Main Orchestrator: http://localhost:7000" -ForegroundColor Cyan
Write-Host "Frontend (after start): http://localhost:5173 or http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services: Close all PowerShell windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 All available services starting! 🎉" -ForegroundColor Green
Write-Host ""

