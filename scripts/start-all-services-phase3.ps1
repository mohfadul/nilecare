# Start All Services for Phase 3 Testing
# Includes: Infrastructure + All Migrated Microservices

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       NILECARE PHASE 3 - COMPLETE SERVICE STARTUP" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Phase 3 Infrastructure
Write-Host "Step 1: Starting Phase 3 Infrastructure..." -ForegroundColor Yellow
Write-Host "   - Redis (caching)" -ForegroundColor Gray
Write-Host "   - Jaeger (distributed tracing)" -ForegroundColor Gray
Write-Host "   - Prometheus (metrics)" -ForegroundColor Gray
Write-Host "   - Grafana (dashboards)" -ForegroundColor Gray
Write-Host ""

.\scripts\start-phase3-dev.ps1

Write-Host ""
Write-Host "Step 2: Starting Microservices..." -ForegroundColor Yellow
Write-Host ""

# Define services to start
$services = @(
    @{Name="Auth Service"; Path="microservices\auth-service"; Port=7020},
    @{Name="Business Service"; Path="microservices\business"; Port=7010},
    @{Name="Billing Service"; Path="microservices\billing-service"; Port=7050},
    @{Name="Payment Gateway"; Path="microservices\payment-gateway-service"; Port=7030},
    @{Name="Clinical Service"; Path="microservices\clinical"; Port=7001},
    @{Name="Facility Service"; Path="microservices\facility-service"; Port=7060},
    @{Name="Lab Service"; Path="microservices\lab-service"; Port=7080},
    @{Name="Device Service"; Path="microservices\device-integration-service"; Port=7070},
    @{Name="EHR Service"; Path="microservices\ehr-service"; Port=4001},
    @{Name="Main Orchestrator"; Path="microservices\main-nilecare"; Port=5000}
)

Write-Host "Services to start: $($services.Count)" -ForegroundColor Cyan
Write-Host ""

foreach ($service in $services) {
    Write-Host "  Starting $($service.Name) on port $($service.Port)..." -ForegroundColor White
    
    if (Test-Path $service.Path) {
        # Start service in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($service.Path)'; Write-Host 'Starting $($service.Name)...' -ForegroundColor Green; npm run dev"
        
        Write-Host "    ✓ $($service.Name) started in new window" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Path not found: $($service.Path)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Step 3: Waiting for services to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Step 4: Verifying services..." -ForegroundColor Yellow
Write-Host ""

$healthyServices = 0
$totalServices = $services.Count

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $($service.Name) - HEALTHY" -ForegroundColor Green
            $healthyServices++
        }
    } catch {
        Write-Host "  ✗ $($service.Name) - NOT RESPONDING" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       SERVICE STARTUP SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services Started: $totalServices" -ForegroundColor White
Write-Host "Services Healthy: $healthyServices" -ForegroundColor $(if ($healthyServices -eq $totalServices) { "Green" } else { "Yellow" })
Write-Host ""

if ($healthyServices -eq $totalServices) {
    Write-Host "✓ ALL SERVICES RUNNING - READY FOR TESTING!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some services not responding yet - give them more time" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - API Gateway:     http://localhost:8000" -ForegroundColor White
Write-Host "  - Main Orchestrator: http://localhost:5000" -ForegroundColor White
Write-Host "  - Auth Service:    http://localhost:7020" -ForegroundColor White
Write-Host "  - Business:        http://localhost:7010" -ForegroundColor White
Write-Host "  - Billing:         http://localhost:7050" -ForegroundColor White
Write-Host "  - Payment:         http://localhost:7030" -ForegroundColor White
Write-Host ""
Write-Host "  - Jaeger UI:       http://localhost:16686" -ForegroundColor White
Write-Host "  - Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "  - Grafana:         http://localhost:3030" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run integration tests: npm run test:integration" -ForegroundColor Gray
Write-Host "  2. Run load tests: k6 run tests/load/full-system-test.js" -ForegroundColor Gray
Write-Host "  3. Check Jaeger traces for distributed tracing" -ForegroundColor Gray
Write-Host "  4. Monitor metrics in Grafana dashboards" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

