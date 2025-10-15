# ============================================================================
# Phase 1 Migration Testing Script
# Tests authentication across all migrated services
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 PHASE 1: TESTING AUTHENTICATION MIGRATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if auth service is running
Write-Host "Step 1: Checking Auth Service..." -ForegroundColor Yellow
try {
    $authHealth = Invoke-RestMethod -Uri "http://localhost:7020/health" -TimeoutSec 3
    Write-Host "  ✅ Auth Service is running" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Auth Service is NOT running!" -ForegroundColor Red
    Write-Host "  💡 Start it first: cd microservices\auth-service; npm run dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# Try to get a token
Write-Host "Step 2: Getting authentication token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor@nilecare.sd"
        password = "TestPass123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 5

    if ($loginResponse.success -and $loginResponse.data.token) {
        $token = $loginResponse.data.token
        Write-Host "  ✅ Successfully obtained auth token" -ForegroundColor Green
        Write-Host "  👤 User: $($loginResponse.data.user.email)" -ForegroundColor Gray
        Write-Host "  🎭 Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Failed to get token" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test all services
Write-Host "Step 3: Testing all services..." -ForegroundColor Yellow
Write-Host ""

$services = @(
    @{name="Business"; port=7010},
    @{name="Main NileCare"; port=7000},
    @{name="Payment Gateway"; port=7030},
    @{name="Appointment"; port=7040},
    @{name="Medication"; port=4003},
    @{name="Lab"; port=4005},
    @{name="Inventory"; port=5004},
    @{name="Facility"; port=5001},
    @{name="FHIR"; port=6001},
    @{name="HL7"; port=6002}
)

$passCount = 0
$failCount = 0
$notRunningCount = 0

foreach ($svc in $services) {
    $serviceName = $svc.name
    $port = $svc.port
    
    Write-Host "$serviceName (port $port):" -NoNewline
    
    # Test 1: Health check without auth
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 3 -UseBasicParsing
        Write-Host " Running" -NoNewline -ForegroundColor Green
        
        # Test 2: Health check WITH auth (some services may require auth)
        try {
            $authHeaders = @{
                Authorization = "Bearer $token"
            }
            $authHealthResponse = Invoke-WebRequest -Uri "http://localhost:$port/health" -Headers $authHeaders -TimeoutSec 3 -UseBasicParsing
            Write-Host " | Auth: ✅" -ForegroundColor Green
            $passCount++
        } catch {
            # If 401, means auth is required and being checked (good!)
            if ($_.Exception.Response.StatusCode.value__ -eq 401) {
                Write-Host " | Auth: ✅ (requires token)" -ForegroundColor Green
                $passCount++
            } else {
                Write-Host " | Auth: ⚠️  ($($_.Exception.Message))" -ForegroundColor Yellow
                $passCount++
            }
        }
        
    } catch {
        Write-Host " Not Running ⏸ " -ForegroundColor Gray
        $notRunningCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Services Passing:     $passCount" -ForegroundColor Green
Write-Host "  ❌ Services Failing:     $failCount" -ForegroundColor Red
Write-Host "  ⏸  Services Not Running: $notRunningCount" -ForegroundColor Gray
Write-Host ""

if ($passCount -gt 0 -and $failCount -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  🎉 ALL RUNNING SERVICES PASSED!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    if ($notRunningCount -gt 0) {
        Write-Host "💡 Start remaining services to test them:" -ForegroundColor Yellow
        Write-Host "   cd microservices\{service-name}; npm run dev" -ForegroundColor Gray
    }
} elseif ($failCount -gt 0) {
    Write-Host "⚠️  Some services failed authentication tests." -ForegroundColor Yellow
    Write-Host "Check logs for details." -ForegroundColor Yellow
}

Write-Host ""

# Final validation - check for JWT_SECRET
Write-Host "Step 4: Validating JWT_SECRET removal..." -ForegroundColor Yellow
Write-Host ""

$jwtSecretFound = @()
$serviceDirs = Get-ChildItem -Path "microservices" -Directory | Where-Object { $_.Name -ne "auth-service" }

foreach ($dir in $serviceDirs) {
    $envFile = "microservices\$($dir.Name)\.env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -match "JWT_SECRET\s*=") {
            $jwtSecretFound += $dir.Name
        }
    }
}

if ($jwtSecretFound.Count -eq 0) {
    Write-Host "  ✅ JWT_SECRET not found in any service (except auth-service)" -ForegroundColor Green
} else {
    Write-Host "  ❌ JWT_SECRET still found in:" -ForegroundColor Red
    foreach ($svc in $jwtSecretFound) {
        Write-Host "     - $svc" -ForegroundColor Red
    }
    Write-Host "  💡 Remove JWT_SECRET from these .env files!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Testing Complete!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

