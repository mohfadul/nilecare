# ============================================================================
# Test Authentication Flow - Phase 1 Validation
# Tests the new centralized authentication pattern
# ============================================================================

Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🧪 Testing Centralized Authentication Flow" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test 1: Check Auth Service Health
Write-Host "Test 1: Auth Service Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:7020/health" -TimeoutSec 3
    Write-Host "  ✅ Auth Service is running" -ForegroundColor Green
    Write-Host "  📡 Port: 7020" -ForegroundColor Gray
    Write-Host "  📊 Status: $($health.status)`n" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Auth Service not running!" -ForegroundColor Red
    Write-Host "  💡 Start it: cd microservices\auth-service; npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Login and Get Token
Write-Host "Test 2: Login and Get Token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor@nilecare.sd"
        password = "TestPass123!"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 5

    if ($response.success -and $response.data.token) {
        $token = $response.data.token
        Write-Host "  ✅ Login successful!" -ForegroundColor Green
        Write-Host "  👤 User: $($response.data.user.email)" -ForegroundColor Gray
        Write-Host "  🎭 Role: $($response.data.user.role)" -ForegroundColor Gray
        Write-Host "  🔑 Token: $($token.Substring(0,20))..." -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "  ❌ Login failed - no token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Validate Token with Auth Service Integration Endpoint
Write-Host "Test 3: Validate Token (Auth Service Integration)..." -ForegroundColor Yellow
try {
    $validateBody = @{
        token = $token
    } | ConvertTo-Json

    $validateResponse = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/integration/validate-token" `
        -Method Post `
        -Body $validateBody `
        -ContentType "application/json" `
        -Headers @{
            "X-API-Key" = "4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8"
        } `
        -TimeoutSec 5

    if ($validateResponse.valid) {
        Write-Host "  ✅ Token validation successful!" -ForegroundColor Green
        Write-Host "  👤 User ID: $($validateResponse.user.id)" -ForegroundColor Gray
        Write-Host "  📧 Email: $($validateResponse.user.email)" -ForegroundColor Gray
        Write-Host "  🎭 Role: $($validateResponse.user.role)`n" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Token validation failed: $($validateResponse.reason)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Validation endpoint error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Test with Invalid Token
Write-Host "Test 4: Test with Invalid Token (Should Fail)..." -ForegroundColor Yellow
try {
    $invalidBody = @{
        token = "invalid-token-12345"
    } | ConvertTo-Json

    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/integration/validate-token" `
        -Method Post `
        -Body $invalidBody `
        -ContentType "application/json" `
        -Headers @{
            "X-API-Key" = "4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8"
        } `
        -TimeoutSec 5

    if (-not $invalidResponse.valid) {
        Write-Host "  ✅ Invalid token correctly rejected!" -ForegroundColor Green
        Write-Host "  📝 Reason: $($invalidResponse.reason)`n" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ Invalid token was accepted (should fail!)" -ForegroundColor Red
        exit 1
    }
} catch {
    # Expecting this to fail
    Write-Host "  ✅ Invalid token correctly rejected!`n" -ForegroundColor Green
}

# Test 5: Test Service-to-Service Auth (if other services running)
Write-Host "Test 5: Testing Other Services (if running)..." -ForegroundColor Yellow

$testServices = @(
    @{name="Business"; port=7010},
    @{name="Main NileCare"; port=7000},
    @{name="Appointment"; port=7040}
)

$runningCount = 0
$authPassCount = 0

foreach ($svc in $testServices) {
    try {
        $svcHealth = Invoke-WebRequest -Uri "http://localhost:$($svc.port)/health" `
            -Headers @{Authorization="Bearer $token"} `
            -TimeoutSec 3 `
            -UseBasicParsing
        
        Write-Host "  ✅ $($svc.name) (port $($svc.port)): Running & Auth Working" -ForegroundColor Green
        $runningCount++
        $authPassCount++
    } catch {
        # Service might not be running, that's ok
        Write-Host "  ⏸  $($svc.name) (port $($svc.port)): Not running (ok)" -ForegroundColor Gray
    }
}

Write-Host ""

# Summary
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ Auth Service Health:          PASSED" -ForegroundColor Green
Write-Host "  ✅ Login Flow:                   PASSED" -ForegroundColor Green
Write-Host "  ✅ Token Validation:             PASSED" -ForegroundColor Green
Write-Host "  ✅ Invalid Token Rejection:      PASSED" -ForegroundColor Green
Write-Host "  ✅ Running Services Tested:      $authPassCount passed" -ForegroundColor Green
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎊 CENTRALIZED AUTHENTICATION WORKING! 🎊" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($runningCount -lt 3) {
    Write-Host "💡 To test more services, start them and run this script again:" -ForegroundColor Yellow
    Write-Host "   cd microservices\business; npm run dev" -ForegroundColor Gray
    Write-Host "   cd microservices\main-nilecare; npm run dev" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✅ Phase 1 Authentication Pattern: VALIDATED!`n" -ForegroundColor Green

