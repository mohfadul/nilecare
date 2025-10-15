# Start Phase 3 Infrastructure - Simplified
# Redis, Jaeger, Prometheus, Grafana

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  STARTING PHASE 3 INFRASTRUCTURE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if docker-compose.phase3.yml exists
if (Test-Path "docker-compose.phase3.yml") {
    Write-Host "Starting infrastructure with docker-compose..." -ForegroundColor Yellow
    Write-Host "  - Redis (caching)" -ForegroundColor Gray
    Write-Host "  - Jaeger (distributed tracing)" -ForegroundColor Gray
    Write-Host "  - Prometheus (metrics)" -ForegroundColor Gray
    Write-Host "  - Grafana (dashboards)" -ForegroundColor Gray
    Write-Host ""
    
    docker-compose -f docker-compose.phase3.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Infrastructure started successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to start infrastructure" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Starting infrastructure with individual containers..." -ForegroundColor Yellow
    Write-Host ""
    
    # Start Redis
    Write-Host "Starting Redis..." -ForegroundColor Cyan
    docker run -d --name nilecare-redis -p 6379:6379 redis:7-alpine
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Redis started on port 6379" -ForegroundColor Green
    }
    
    # Start Jaeger
    Write-Host "Starting Jaeger..." -ForegroundColor Cyan
    docker run -d --name nilecare-jaeger `
        -p 5775:5775/udp `
        -p 6831:6831/udp `
        -p 6832:6832/udp `
        -p 5778:5778 `
        -p 16686:16686 `
        -p 14268:14268 `
        -p 14250:14250 `
        -p 9411:9411 `
        jaegertracing/all-in-one:1.50
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Jaeger started - UI: http://localhost:16686" -ForegroundColor Green
    }
    
    # Start Prometheus
    Write-Host "Starting Prometheus..." -ForegroundColor Cyan
    docker run -d --name nilecare-prometheus -p 9090:9090 prom/prometheus:latest
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Prometheus started - UI: http://localhost:9090" -ForegroundColor Green
    }
    
    # Start Grafana
    Write-Host "Starting Grafana..." -ForegroundColor Cyan
    docker run -d --name nilecare-grafana `
        -p 3030:3000 `
        -e "GF_SECURITY_ADMIN_PASSWORD=nilecare123" `
        grafana/grafana:latest
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Grafana started - UI: http://localhost:3030" -ForegroundColor Green
        Write-Host "      Login: admin / nilecare123" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Waiting for services to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Verifying infrastructure..." -ForegroundColor Yellow

# Check Redis
try {
    $null = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue -ErrorAction Stop
    Write-Host "  [OK] Redis ready on port 6379" -ForegroundColor Green
} catch {
    Write-Host "  [WARNING] Redis not responding yet" -ForegroundColor Yellow
}

# Check Jaeger
try {
    $response = Invoke-WebRequest -Uri "http://localhost:16686" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] Jaeger UI ready at http://localhost:16686" -ForegroundColor Green
} catch {
    Write-Host "  [WARNING] Jaeger UI not ready yet" -ForegroundColor Yellow
}

# Check Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] Prometheus ready at http://localhost:9090" -ForegroundColor Green
} catch {
    Write-Host "  [WARNING] Prometheus not ready yet" -ForegroundColor Yellow
}

# Check Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] Grafana ready at http://localhost:3030" -ForegroundColor Green
} catch {
    Write-Host "  [WARNING] Grafana not ready yet (may need more time)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  PHASE 3 INFRASTRUCTURE READY" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - Redis:           localhost:6379" -ForegroundColor White
Write-Host "  - Jaeger UI:       http://localhost:16686" -ForegroundColor White
Write-Host "  - Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "  - Grafana:         http://localhost:3030 (admin/nilecare123)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start microservices: .\scripts\start-all-services-phase3.ps1" -ForegroundColor Gray
Write-Host "  2. Run integration tests: npm run test:integration" -ForegroundColor Gray
Write-Host "  3. Check Jaeger for distributed traces" -ForegroundColor Gray
Write-Host "  4. Monitor metrics in Grafana" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

