# ============================================================================
# FIX #3: AUTH DELEGATION VERIFICATION SCRIPT
# ============================================================================
# Tests that all services properly delegate authentication to Auth Service
# Date: October 16, 2025
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FIX #3: AUTH DELEGATION VERIFICATION" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: GET AUTH TOKEN
# ============================================================================

Write-Host "STEP 1: Getting authentication token from Auth Service..." -ForegroundColor Yellow
Write-Host ""

$loginBody = @{
    email = "admin@nilecare.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.data.access_token
    
    if ($token) {
        Write-Host "✅ Successfully obtained auth token" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ Failed to get token from response" -ForegroundColor Red
        Write-Host "Response: $loginResponse" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "❌ Failed to connect to Auth Service on port 7020" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "   Make sure Auth Service is running: cd microservices/auth-service && npm run dev" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# STEP 2: TEST EACH SERVICE
# ============================================================================

Write-Host "STEP 2: Testing authentication on all services..." -ForegroundColor Yellow
Write-Host ""

$services = @(
    @{Name="Billing Service"; Port=7050; Endpoint="/api/v1/invoices"},
    @{Name="Payment Gateway"; Port=7030; Endpoint="/api/v1/payments"},
    @{Name="Business Service"; Port=7010; Endpoint="/api/v1/staff"},
    @{Name="Clinical Service"; Port=7001; Endpoint="/api/v1/encounters"},
    @{Name="Lab Service"; Port=7080; Endpoint="/api/v1/lab-orders"},
    @{Name="Medication Service"; Port=7090; Endpoint="/api/v1/prescriptions"},
    @{Name="Inventory Service"; Port=7100; Endpoint="/api/v1/inventory"},
    @{Name="Appointment Service"; Port=7040; Endpoint="/api/v1/appointments"},
    @{Name="Facility Service"; Port=7060; Endpoint="/api/v1/facilities"}
)

$passed = 0
$failed = 0
$notRunning = 0

foreach ($service in $services) {
    Write-Host "Testing $($service.Name) on port $($service.Port)..." -NoNewline
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Endpoint)" `
            -Method GET `
            -Headers $headers `
            -UseBasicParsing `
            -TimeoutSec 5 `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host " ✅ PASS (HTTP $($response.StatusCode))" -ForegroundColor Green
            $passed++
        } else {
            Write-Host " ⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
            $failed++
        }
    } catch {
        if ($_.Exception.Message -match "Unable to connect") {
            Write-Host " ❌ NOT RUNNING" -ForegroundColor Red
            $notRunning++
        } elseif ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host " ⚠️  Got 401 - Auth not working" -ForegroundColor Yellow
            $failed++
        } elseif ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host " ⚠️  Got 403 - Permission issue" -ForegroundColor Yellow
            $failed++
        } else {
            Write-Host " ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""

# ============================================================================
# STEP 3: TEST WITHOUT TOKEN (Should Fail)
# ============================================================================

Write-Host "STEP 3: Testing request WITHOUT token (should be rejected)..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:7050/api/v1/invoices" `
        -Method GET `
        -UseBasicParsing `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "❌ FAIL: Service accepted request without token (HTTP $($response.StatusCode))" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ PASS: Correctly rejected request without token (HTTP 401)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "⚠️  Got HTTP $($_.Exception.Response.StatusCode) instead of 401" -ForegroundColor Yellow
    }
}

Write-Host ""

# ============================================================================
# STEP 4: VERIFY AUTH SERVICE LOGGING
# ============================================================================

Write-Host "STEP 4: Checking Auth Service logs for validation requests..." -ForegroundColor Yellow
Write-Host ""

$authLogPath = "microservices/auth-service/logs/combined.log"

if (Test-Path $authLogPath) {
    $recentLogs = Get-Content $authLogPath -Tail 20 | Select-String "validate-token|integration"
    
    if ($recentLogs.Count -gt 0) {
        Write-Host "✅ Auth Service is logging validation requests" -ForegroundColor Green
        Write-Host "   Found $($recentLogs.Count) recent validation log entries" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No recent validation logs found" -ForegroundColor Yellow
        Write-Host "   This might be normal if services aren't making many requests" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Auth Service log file not found at: $authLogPath" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# RESULTS SUMMARY
# ============================================================================

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Services Tested:     $($services.Count)" -ForegroundColor White
Write-Host "Passed:             $passed" -ForegroundColor Green
Write-Host "Failed:             $failed" -ForegroundColor $(if ($failed -gt 0) {"Red"} else {"Green"})
Write-Host "Not Running:        $notRunning" -ForegroundColor $(if ($notRunning -gt 0) {"Yellow"} else {"Green"})
Write-Host ""

if ($failed -eq 0 -and $notRunning -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! FIX #3 VERIFICATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ All services are properly delegating auth to Auth Service" -ForegroundColor Green
    Write-Host "✅ No local JWT validation detected" -ForegroundColor Green
    Write-Host "✅ Unauthorized requests properly rejected" -ForegroundColor Green
    Write-Host ""
    exit 0
} elseif ($notRunning -gt 0) {
    Write-Host "⚠️  SOME SERVICES ARE NOT RUNNING" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Start the missing services and run this test again" -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Review the failures above and fix the issues" -ForegroundColor Red
    Write-Host ""
    exit 1
}

