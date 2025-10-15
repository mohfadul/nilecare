# ================================================
# START ENHANCED PAYMENT GATEWAY SERVICE
# ================================================
# Starts payment gateway with full observability
# Phase 3: Tracing, Metrics, Caching

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💳  STARTING ENHANCED PAYMENT GATEWAY SERVICE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ===== STEP 1: Check Infrastructure =====
Write-Host "📊 Step 1: Checking monitoring infrastructure..." -ForegroundColor Yellow

$infraReady = $true

# Check Redis
try {
    $redis = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redis.TcpTestSucceeded) {
        Write-Host "   ✅ Redis is running (port 6379)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Redis not detected - caching will be disabled" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Redis not detected - caching will be disabled" -ForegroundColor Yellow
}

# Check Jaeger
try {
    $jaeger = Test-NetConnection -ComputerName localhost -Port 16686 -WarningAction SilentlyContinue
    if ($jaeger.TcpTestSucceeded) {
        Write-Host "   ✅ Jaeger UI is running (port 16686)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Jaeger not detected - tracing will be disabled" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Jaeger not detected - tracing will be disabled" -ForegroundColor Yellow
}

# Check Prometheus
try {
    $prometheus = Test-NetConnection -ComputerName localhost -Port 9090 -WarningAction SilentlyContinue
    if ($prometheus.TcpTestSucceeded) {
        Write-Host "   ✅ Prometheus is running (port 9090)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prometheus not detected" -ForegroundColor Yellow
        $infraReady = $false
    }
} catch {
    Write-Host "   ⚠️  Prometheus not detected" -ForegroundColor Yellow
    $infraReady = $false
}

# Check Grafana
try {
    $grafana = Test-NetConnection -ComputerName localhost -Port 3030 -WarningAction SilentlyContinue
    if ($grafana.TcpTestSucceeded) {
        Write-Host "   ✅ Grafana is running (port 3030)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Grafana not detected" -ForegroundColor Yellow
        $infraReady = $false
    }
} catch {
    Write-Host "   ⚠️  Grafana not detected" -ForegroundColor Yellow
    $infraReady = $false
}

Write-Host ""

if (-not $infraReady) {
    Write-Host "⚠️  Monitoring infrastructure is not fully ready" -ForegroundColor Yellow
    Write-Host "   To start infrastructure:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.phase3.yml up -d" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Startup cancelled." -ForegroundColor Red
        exit 1
    }
}

# ===== STEP 2: Check Auth Service =====
Write-Host "🔐 Step 2: Checking auth service..." -ForegroundColor Yellow

try {
    $authService = Invoke-WebRequest -Uri "http://localhost:7020/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($authService.StatusCode -eq 200) {
        Write-Host "   ✅ Auth service is healthy (port 7020)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Auth service is not running!" -ForegroundColor Red
    Write-Host "   Payment gateway requires auth service for authentication" -ForegroundColor Red
    Write-Host ""
    Write-Host "   To start auth service:" -ForegroundColor Yellow
    Write-Host "   cd microservices/auth-service" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# ===== STEP 3: Check Database =====
Write-Host "🗄️  Step 3: Checking database..." -ForegroundColor Yellow

try {
    $mysql = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue
    if ($mysql.TcpTestSucceeded) {
        Write-Host "   ✅ MySQL is running (port 3306)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MySQL is not running!" -ForegroundColor Red
        Write-Host "   Payment gateway requires database connection" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ MySQL is not running!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===== STEP 4: Check if port 7030 is available =====
Write-Host "🔍 Step 4: Checking port availability..." -ForegroundColor Yellow

try {
    $port = Test-NetConnection -ComputerName localhost -Port 7030 -WarningAction SilentlyContinue
    if ($port.TcpTestSucceeded) {
        Write-Host "   ⚠️  Port 7030 is already in use!" -ForegroundColor Yellow
        Write-Host "   Payment gateway may already be running" -ForegroundColor Yellow
        $response = Read-Host "Stop existing service and restart? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Write-Host "   Stopping existing service..." -ForegroundColor Yellow
            # Kill process on port 7030
            Get-NetTCPConnection -LocalPort 7030 -ErrorAction SilentlyContinue | 
                Select-Object -ExpandProperty OwningProcess -Unique | 
                ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 2
            Write-Host "   ✅ Port 7030 is now available" -ForegroundColor Green
        } else {
            Write-Host "Startup cancelled." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ✅ Port 7030 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✅ Port 7030 is available" -ForegroundColor Green
}

Write-Host ""

# ===== STEP 5: Install Dependencies =====
Write-Host "📦 Step 5: Installing dependencies..." -ForegroundColor Yellow

cd microservices/payment-gateway-service

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing npm packages..." -ForegroundColor White
    npm install 2>&1 | Out-Null
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# ===== STEP 6: Set Environment Variables =====
Write-Host "⚙️  Step 6: Configuring environment..." -ForegroundColor Yellow

$env:ENABLE_TRACING = "true"
$env:ENABLE_FRAUD_DETECTION = "true"
$env:NODE_ENV = "development"

Write-Host "   ✅ ENABLE_TRACING = true" -ForegroundColor Green
Write-Host "   ✅ ENABLE_FRAUD_DETECTION = true" -ForegroundColor Green
Write-Host "   ✅ NODE_ENV = development" -ForegroundColor Green

Write-Host ""

# ===== STEP 7: Start Enhanced Service =====
Write-Host "🚀 Step 7: Starting enhanced payment gateway..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ PAYMENT GATEWAY STARTING WITH ENHANCEMENTS:" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Observability Features:" -ForegroundColor Cyan
Write-Host "   🔍 Distributed Tracing:  ENABLED (Jaeger)" -ForegroundColor White
Write-Host "   📈 Prometheus Metrics:   ENABLED" -ForegroundColor White
Write-Host "   💾 Redis Caching:        ENABLED" -ForegroundColor White
Write-Host "   🏥 Provider Monitoring:  ENABLED" -ForegroundColor White
Write-Host "   🛡️  Fraud Detection:     ENABLED" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "   Payment Gateway:   http://localhost:7030" -ForegroundColor White
Write-Host "   Health Check:      http://localhost:7030/health" -ForegroundColor White
Write-Host "   Metrics:           http://localhost:7030/metrics" -ForegroundColor White
Write-Host "   Provider Health:   http://localhost:7030/api/v1/providers/health" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoring UIs:" -ForegroundColor Cyan
Write-Host "   Jaeger Tracing:    http://localhost:16686" -ForegroundColor White
Write-Host "   Prometheus:        http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana:           http://localhost:3030" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Starting service in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

# Start with enhanced entry point
tsx watch src/index.enhanced.ts

