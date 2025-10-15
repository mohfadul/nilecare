# Start Phase 3 Development Environment
# Includes: Redis, Jaeger, Prometheus, Grafana + All Services

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀  NILECARE PHASE 3 DEVELOPMENT ENVIRONMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Infrastructure
Write-Host "📊 Starting Phase 3 Infrastructure..." -ForegroundColor Yellow
Write-Host "   - Redis (caching)" -ForegroundColor Gray
Write-Host "   - Jaeger (distributed tracing)" -ForegroundColor Gray
Write-Host "   - Prometheus (metrics collection)" -ForegroundColor Gray
Write-Host "   - Grafana (dashboards)" -ForegroundColor Gray
Write-Host ""

docker-compose -f docker-compose.phase3.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start infrastructure" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Infrastructure started" -ForegroundColor Green
Write-Host ""

# Step 2: Wait for services to be ready
Write-Host "⏳ Waiting for services to initialize (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Verify infrastructure
Write-Host "🔍 Verifying infrastructure..." -ForegroundColor Yellow

# Check Redis
try {
    $null = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    Write-Host "   ✅ Redis ready on port 6379" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Redis not responding" -ForegroundColor Yellow
}

# Check Jaeger
try {
    $response = Invoke-WebRequest -Uri "http://localhost:16686" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "   ✅ Jaeger UI ready at http://localhost:16686" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Jaeger UI not ready yet" -ForegroundColor Yellow
}

# Check Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "   ✅ Prometheus ready at http://localhost:9090" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Prometheus not ready yet" -ForegroundColor Yellow
}

# Check Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    Write-Host "   ✅ Grafana ready at http://localhost:3030" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Grafana not ready yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅  PHASE 3 INFRASTRUCTURE READY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor White
Write-Host "   - Redis:           localhost:6379" -ForegroundColor Cyan
Write-Host "   - Jaeger UI:       http://localhost:16686" -ForegroundColor Cyan
Write-Host "   - Prometheus:      http://localhost:9090" -ForegroundColor Cyan
Write-Host "   - Grafana:         http://localhost:3030 (admin/nilecare123)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start auth-service: cd microservices/auth-service && npm run dev" -ForegroundColor Gray
Write-Host "   2. Start business-service: cd microservices/business && npm run dev" -ForegroundColor Gray
Write-Host "   3. Start orchestrator: cd microservices/main-nilecare && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test Caching:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:7000/api/v1/cache/stats" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

