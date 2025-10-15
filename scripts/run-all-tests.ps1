# Run All Tests for NileCare Healthcare Services
# PowerShell script

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NILECARE TEST SUITE - RUNNING ALL TESTS                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$SuccessCount = 0

# Function to run tests for a service
function Run-ServiceTests {
    param(
        [string]$ServiceName,
        [string]$ServicePath
    )

    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " Testing: $ServiceName" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    Push-Location $ServicePath

    # Check if tests exist
    if (-not (Test-Path "tests") -and -not (Test-Path "src/**/*.test.ts")) {
        Write-Host "⚠️  No tests found for $ServiceName - skipping" -ForegroundColor Yellow
        Pop-Location
        return
    }

    try {
        # Run tests
        Write-Host "🧪 Running unit tests for $ServiceName..." -ForegroundColor Blue
        npm test 2>&1 | Out-Host

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ServiceName tests PASSED" -ForegroundColor Green
            $script:SuccessCount++
        } else {
            Write-Host "❌ $ServiceName tests FAILED" -ForegroundColor Red
            $script:ErrorCount++
        }
    } catch {
        Write-Host "❌ Error running $ServiceName tests: $_" -ForegroundColor Red
        $script:ErrorCount++
    }

    Pop-Location
    Write-Host ""
}

# Run unit tests for each service
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host " PHASE 1: UNIT TESTS" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Run-ServiceTests -ServiceName "CDS Service" -ServicePath "microservices\cds-service"
Run-ServiceTests -ServiceName "EHR Service" -ServicePath "microservices\ehr-service"
Run-ServiceTests -ServiceName "Clinical Service" -ServicePath "microservices\clinical"

# Run integration tests
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host " PHASE 2: INTEGRATION TESTS" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Check if services are running
Write-Host "🔍 Checking if services are running..." -ForegroundColor Yellow

$ServicesRunning = $true

try {
    $null = Invoke-WebRequest -Uri "http://localhost:7020/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Auth Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Service is NOT running" -ForegroundColor Red
    $ServicesRunning = $false
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:4002/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ CDS Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ CDS Service is NOT running" -ForegroundColor Red
    $ServicesRunning = $false
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ EHR Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ EHR Service is NOT running" -ForegroundColor Red
    $ServicesRunning = $false
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Clinical Service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Clinical Service is NOT running" -ForegroundColor Red
    $ServicesRunning = $false
}

Write-Host ""

if ($ServicesRunning) {
    Write-Host "🚀 All services running - proceeding with integration tests" -ForegroundColor Green
    Write-Host ""

    Push-Location "tests\integration"

    try {
        Write-Host "🧪 Running integration tests..." -ForegroundColor Blue
        npm test 2>&1 | Out-Host

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Integration tests PASSED" -ForegroundColor Green
            $SuccessCount++
        } else {
            Write-Host "❌ Integration tests FAILED" -ForegroundColor Red
            $ErrorCount++
        }
    } catch {
        Write-Host "❌ Error running integration tests: $_" -ForegroundColor Red
        $ErrorCount++
    }

    Pop-Location
} else {
    Write-Host "⚠️  Skipping integration tests - services not running" -ForegroundColor Yellow
    Write-Host "   Start services with: .\start-all-healthcare-services.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$TotalTests = $SuccessCount + $ErrorCount

if ($TotalTests -gt 0) {
    Write-Host "Total Test Suites: $TotalTests" -ForegroundColor White
    Write-Host "Passed: $SuccessCount" -ForegroundColor Green
    Write-Host "Failed: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { 'Red' } else { 'Green' })
    Write-Host ""

    if ($ErrorCount -eq 0) {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "║              ✅ ALL TESTS PASSED! ✅                       ║" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    } else {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║              ⚠️  SOME TESTS FAILED ⚠️                     ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║     Review the test output above for details             ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  No tests were run" -ForegroundColor Yellow
}

Write-Host ""

# Coverage report locations
Write-Host "📊 Coverage Reports:" -ForegroundColor Cyan
if (Test-Path "microservices\cds-service\coverage\index.html") {
    Write-Host "   CDS Service: file:///$(Get-Location)\microservices\cds-service\coverage\index.html" -ForegroundColor White
}
if (Test-Path "microservices\ehr-service\coverage\index.html") {
    Write-Host "   EHR Service: file:///$(Get-Location)\microservices\ehr-service\coverage\index.html" -ForegroundColor White
}
if (Test-Path "tests\integration\coverage\index.html") {
    Write-Host "   Integration: file:///$(Get-Location)\tests\integration\coverage\index.html" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Exit with error code if tests failed
if ($ErrorCount -gt 0) {
    exit 1
}

