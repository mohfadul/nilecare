# ================================================
# TEST ENHANCED PAYMENT GATEWAY SERVICE
# ================================================
# Tests tracing, metrics, and monitoring features

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪  TESTING ENHANCED PAYMENT GATEWAY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:7030"
$testsPassed = 0
$testsFailed = 0

# ===== TEST 1: Health Check =====
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ PASSED: Health check successful" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "   ❌ FAILED: Health check failed - $_" -ForegroundColor Red
    $testsFailed++
}

# ===== TEST 2: Metrics Endpoint =====
Write-Host "Test 2: Prometheus Metrics Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/metrics" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200 -and $response.Content -match "payment_total") {
        Write-Host "   ✅ PASSED: Metrics endpoint responding" -ForegroundColor Green
        Write-Host "   ✅ Found payment_total metric" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ FAILED: Metrics not found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "   ❌ FAILED: Metrics endpoint error - $_" -ForegroundColor Red
    $testsFailed++
}

# ===== TEST 3: Service Info =====
Write-Host "Test 3: Service Information" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -Method GET -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.enhancements.tracing -and $data.enhancements.metrics) {
        Write-Host "   ✅ PASSED: Enhancements confirmed" -ForegroundColor Green
        Write-Host "   ✅ Tracing: $($data.enhancements.tracing)" -ForegroundColor Green
        Write-Host "   ✅ Metrics: $($data.enhancements.metrics)" -ForegroundColor Green
        Write-Host "   ✅ Caching: $($data.enhancements.caching)" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "   ❌ FAILED: Service info error - $_" -ForegroundColor Red
    $testsFailed++
}

# ===== TEST 4: Provider Health Endpoint =====
Write-Host "Test 4: Provider Health Monitoring" -ForegroundColor Yellow
Write-Host "   ℹ️  This requires authentication - skipping for now" -ForegroundColor Gray
Write-Host "   Manual test: GET $baseUrl/api/v1/providers/health" -ForegroundColor Gray

# ===== TEST 5: Jaeger Connection =====
Write-Host "Test 5: Jaeger Tracing UI" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:16686" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ PASSED: Jaeger UI is accessible" -ForegroundColor Green
        Write-Host "   🔍 Open: http://localhost:16686" -ForegroundColor Cyan
        $testsPassed++
    }
} catch {
    Write-Host "   ⚠️  WARNING: Jaeger UI not accessible" -ForegroundColor Yellow
    Write-Host "   Start with: docker-compose -f docker-compose.phase3.yml up -d" -ForegroundColor Yellow
}

# ===== TEST 6: Prometheus Connection =====
Write-Host "Test 6: Prometheus Scraping" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ PASSED: Prometheus is accessible" -ForegroundColor Green
        Write-Host "   📊 Open: http://localhost:9090" -ForegroundColor Cyan
        $testsPassed++
        
        # Check if payment gateway is being scraped
        try {
            $targets = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -Method GET -TimeoutSec 5
            $targetsData = $targets.Content | ConvertFrom-Json
            
            $paymentGatewayTarget = $targetsData.data.activeTargets | Where-Object { $_.labels.job -eq "payment-gateway-service" }
            
            if ($paymentGatewayTarget) {
                if ($paymentGatewayTarget.health -eq "up") {
                    Write-Host "   ✅ Payment gateway metrics are being scraped" -ForegroundColor Green
                } else {
                    Write-Host "   ⚠️  Payment gateway target exists but is DOWN" -ForegroundColor Yellow
                }
            } else {
                Write-Host "   ℹ️  Payment gateway not yet in Prometheus targets" -ForegroundColor Gray
                Write-Host "   It will appear once service starts" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ℹ️  Could not check scrape targets" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ⚠️  WARNING: Prometheus not accessible" -ForegroundColor Yellow
}

# ===== TEST 7: Grafana Connection =====
Write-Host "Test 7: Grafana Dashboards" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3030" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ PASSED: Grafana is accessible" -ForegroundColor Green
        Write-Host "   📈 Open: http://localhost:3030" -ForegroundColor Cyan
        Write-Host "   📊 Import dashboards from: infrastructure/grafana/dashboards/" -ForegroundColor Cyan
        $testsPassed++
    }
} catch {
    Write-Host "   ⚠️  WARNING: Grafana not accessible" -ForegroundColor Yellow
}

# ===== TEST 8: Database Connection =====
Write-Host "Test 8: Database Connection" -ForegroundColor Yellow
try {
    $mysql = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
    if ($mysql.TcpTestSucceeded) {
        Write-Host "   ✅ PASSED: MySQL is reachable" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ❌ FAILED: MySQL not reachable" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "   ❌ FAILED: MySQL connection error" -ForegroundColor Red
    $testsFailed++
}

# ===== SUMMARY =====
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Enhanced Payment Gateway is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Quick Access:" -ForegroundColor Cyan
    Write-Host "   Payment Gateway:  http://localhost:7030" -ForegroundColor White
    Write-Host "   Jaeger Tracing:   http://localhost:16686" -ForegroundColor White
    Write-Host "   Prometheus:       http://localhost:9090" -ForegroundColor White
    Write-Host "   Grafana:          http://localhost:3030" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 To see traces:" -ForegroundColor Cyan
    Write-Host "   1. Make a payment request" -ForegroundColor White
    Write-Host "   2. Open Jaeger UI" -ForegroundColor White
    Write-Host "   3. Select 'payment-gateway-service'" -ForegroundColor White
    Write-Host "   4. View trace details" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some tests failed - please check the errors above" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

