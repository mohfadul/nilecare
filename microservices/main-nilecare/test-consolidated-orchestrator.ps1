# Testing Script for Consolidated Main NileCare Orchestrator
# Run this after starting the service with: npm run dev

Write-Output "═══════════════════════════════════════════════════════════════════"
Write-Output "   🧪 MAIN NILECARE ORCHESTRATOR - TEST SUITE"
Write-Output "═══════════════════════════════════════════════════════════════════"
Write-Output ""

$baseUrl = "http://localhost:7000"
$passed = 0
$failed = 0
$total = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus = 200,
        [hashtable]$Headers = @{}
    )
    
    $script:total++
    Write-Output "Testing: $Name"
    Write-Output "  URL: $Url"
    
    try {
        $params = @{
            Uri = $Url
            Method = "GET"
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Output "  ✅ PASS - Status: $($response.StatusCode)"
            $script:passed++
            return $true
        } else {
            Write-Output "  ❌ FAIL - Expected: $ExpectedStatus, Got: $($response.StatusCode)"
            $script:failed++
            return $false
        }
    } catch {
        Write-Output "  ❌ FAIL - Error: $($_.Exception.Message)"
        $script:failed++
        return $false
    }
    
    Write-Output ""
}

Write-Output "Starting tests..."
Write-Output ""

# Test 1: Basic Health
Test-Endpoint -Name "Health Endpoint" -Url "$baseUrl/health"

# Test 2: Readiness
Test-Endpoint -Name "Readiness Endpoint" -Url "$baseUrl/health/ready"

# Test 3: Root Endpoint
Test-Endpoint -Name "Root Service Info" -Url "$baseUrl/"

# Test 4: Swagger JSON
Test-Endpoint -Name "Swagger JSON" -Url "$baseUrl/api-docs/swagger.json"

# Test 5: Swagger UI (HTML check)
Write-Output "Testing: Swagger UI HTML"
Write-Output "  URL: $baseUrl/api-docs/"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api-docs/" -UseBasicParsing -TimeoutSec 10
    if ($response.Content -match "swagger") {
        Write-Output "  ✅ PASS - Swagger UI HTML loaded"
        $passed++
    } else {
        Write-Output "  ❌ FAIL - Swagger UI not found in response"
        $failed++
    }
    $total++
} catch {
    Write-Output "  ❌ FAIL - Error: $($_.Exception.Message)"
    $failed++
    $total++
}
Write-Output ""

# Test 6: Cache Stats (requires auth - will fail without token, which is expected)
Write-Output "Testing: Cache Stats Endpoint (Auth Required)"
Write-Output "  URL: $baseUrl/api/v1/cache/stats"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/cache/stats" -UseBasicParsing -TimeoutSec 10
    Write-Output "  ⚠️  UNEXPECTED - Should require auth"
    $total++
} catch {
    if ($_.Exception.Message -match "401|Unauthorized") {
        Write-Output "  ✅ PASS - Correctly requires authentication (401)"
        $passed++
    } else {
        Write-Output "  ⚠️  INFO - Error: $($_.Exception.Message)"
    }
    $total++
}
Write-Output ""

# Test 7: Service Status (requires auth - will fail without token, which is expected)
Write-Output "Testing: Service Status Endpoint (Auth Required)"
Write-Output "  URL: $baseUrl/api/v1/services/status"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/services/status" -UseBasicParsing -TimeoutSec 10
    Write-Output "  ⚠️  UNEXPECTED - Should require auth"
    $total++
} catch {
    if ($_.Exception.Message -match "401|Unauthorized") {
        Write-Output "  ✅ PASS - Correctly requires authentication (401)"
        $passed++
    } else {
        Write-Output "  ⚠️  INFO - Error: $($_.Exception.Message)"
    }
    $total++
}
Write-Output ""

# Test 8: 404 Handling
Write-Output "Testing: 404 Handler"
Write-Output "  URL: $baseUrl/api/v1/nonexistent"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/nonexistent" -UseBasicParsing -TimeoutSec 10
    Write-Output "  ❌ FAIL - Should return 404"
    $failed++
} catch {
    if ($_.Exception.Message -match "404|Not Found") {
        Write-Output "  ✅ PASS - Correctly returns 404"
        $passed++
    } else {
        Write-Output "  ⚠️  Unexpected error: $($_.Exception.Message)"
    }
}
$total++
Write-Output ""

# Summary
Write-Output "═══════════════════════════════════════════════════════════════════"
Write-Output "   TEST SUMMARY"
Write-Output "═══════════════════════════════════════════════════════════════════"
Write-Output ""
Write-Output "Total Tests: $total"
Write-Output "Passed: $passed"
Write-Output "Failed: $failed"
Write-Output ""

$passRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }
Write-Output "Pass Rate: $passRate%"
Write-Output ""

if ($passRate -ge 80) {
    Write-Output "✅ Status: EXCELLENT - Service is working well!"
} elseif ($passRate -ge 60) {
    Write-Output "⚠️  Status: GOOD - Some issues need attention"
} else {
    Write-Output "❌ Status: NEEDS WORK - Multiple issues found"
}

Write-Output ""
Write-Output "═══════════════════════════════════════════════════════════════════"
Write-Output ""
Write-Output "📚 Next Steps:"
Write-Output "  1. If tests passed, review Swagger UI at: $baseUrl/api-docs"
Write-Output "  2. Test authenticated endpoints with valid JWT token"
Write-Output "  3. Test WebSocket connections (requires wscat)"
Write-Output "  4. Run load testing"
Write-Output "  5. Deploy to staging"
Write-Output ""
Write-Output "📖 For complete test guide, see:"
Write-Output "   microservices/main-nilecare/TEST_ORCHESTRATION.md"
Write-Output ""
Write-Output "═══════════════════════════════════════════════════════════════════"

