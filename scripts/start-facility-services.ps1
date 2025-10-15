# Start NileCare Services with Multi-Facility Support
# PowerShell script for Windows

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NILECARE MULTI-FACILITY SERVICES STARTUP               ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FACILITY_ID = $env:FACILITY_ID
$ORGANIZATION_ID = $env:ORGANIZATION_ID

if (-not $FACILITY_ID) {
    Write-Host "⚠️  FACILITY_ID not set in environment" -ForegroundColor Yellow
    Write-Host "Using default: facility-local-001" -ForegroundColor Yellow
    $FACILITY_ID = "facility-local-001"
}

if (-not $ORGANIZATION_ID) {
    Write-Host "⚠️  ORGANIZATION_ID not set in environment" -ForegroundColor Yellow
    Write-Host "Using default: org-nilecare-001" -ForegroundColor Yellow
    $ORGANIZATION_ID = "org-nilecare-001"
}

Write-Host "🏥 Facility ID: $FACILITY_ID" -ForegroundColor Green
Write-Host "🏢 Organization ID: $ORGANIZATION_ID" -ForegroundColor Green
Write-Host ""

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port,
        [string]$Color
    )

    Write-Host "🚀 Starting $ServiceName on port $Port..." -ForegroundColor $Color
    
    # Check if port is already in use
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "⚠️  Port $Port already in use - skipping $ServiceName" -ForegroundColor Yellow
        return
    }

    # Start service in new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ServicePath'; npm run dev" -WindowStyle Normal
    
    Start-Sleep -Seconds 2
    Write-Host "✅ $ServiceName started" -ForegroundColor Green
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " STARTING CORE SERVICES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start Auth Service (required first)
Start-Service -ServiceName "Auth Service" `
              -ServicePath "microservices\auth-service" `
              -Port 7020 `
              -Color "Magenta"

Write-Host "⏳ Waiting for Auth Service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check Auth Service health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7020/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Auth Service is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Service failed to start properly" -ForegroundColor Red
    Write-Host "Check the Auth Service window for errors" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " STARTING HEALTHCARE SERVICES (MULTI-FACILITY ENABLED)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start CDS Service
Start-Service -ServiceName "CDS Service (Clinical Decision Support)" `
              -ServicePath "microservices\cds-service" `
              -Port 4002 `
              -Color "Red"

Start-Sleep -Seconds 3

# Start EHR Service
Start-Service -ServiceName "EHR Service (Electronic Health Records)" `
              -ServicePath "microservices\ehr-service" `
              -Port 4001 `
              -Color "Blue"

Start-Sleep -Seconds 3

# Start Clinical Service
Start-Service -ServiceName "Clinical Service" `
              -ServicePath "microservices\clinical" `
              -Port 3004 `
              -Color "Green"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " SERVICE HEALTH CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Wait for services to initialize
Write-Host "⏳ Waiting for services to initialize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check all service health
$services = @(
    @{Name="Auth Service"; URL="http://localhost:7020/health"},
    @{Name="CDS Service"; URL="http://localhost:4002/health"},
    @{Name="EHR Service"; URL="http://localhost:4001/health"},
    @{Name="Clinical Service"; URL="http://localhost:3004/health"}
)

$allHealthy = $true

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name): Healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($service.Name): Unhealthy (Status: $($response.StatusCode))" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ $($service.Name): Not responding" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""

if ($allHealthy) {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                           ║" -ForegroundColor Green
    Write-Host "║     ✅ ALL SERVICES STARTED SUCCESSFULLY! ✅              ║" -ForegroundColor Green
    Write-Host "║                                                           ║" -ForegroundColor Green
    Write-Host "║     Multi-Facility Support: ENABLED                       ║" -ForegroundColor Green
    Write-Host "║     Facility ID: $FACILITY_ID" -ForegroundColor Green
    Write-Host "║     Organization ID: $ORGANIZATION_ID" -ForegroundColor Green
    Write-Host "║                                                           ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
} else {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║                                                           ║" -ForegroundColor Yellow
    Write-Host "║     ⚠️  SOME SERVICES FAILED TO START ⚠️                 ║" -ForegroundColor Yellow
    Write-Host "║                                                           ║" -ForegroundColor Yellow
    Write-Host "║     Check the service windows for error messages         ║" -ForegroundColor Yellow
    Write-Host "║                                                           ║" -ForegroundColor Yellow
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - API Docs (CDS):  http://localhost:4002/api-docs" -ForegroundColor White
Write-Host "   - API Docs (EHR):  http://localhost:4001/api-docs" -ForegroundColor White
Write-Host "   - API Docs (Clinical): http://localhost:3004/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test the System:" -ForegroundColor Cyan
Write-Host "   See: MULTI_FACILITY_SETUP_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  To stop all services, close all PowerShell windows" -ForegroundColor Yellow
Write-Host ""

# Keep this window open
Write-Host "Press any key to view sync status..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Show sync status if available
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " SYNC STATUS (Multi-Facility)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    $syncStatus = Invoke-RestMethod -Uri "http://localhost:4002/api/v1/sync/status?facilityId=$FACILITY_ID" -Method Get -ErrorAction SilentlyContinue
    
    Write-Host "Facility: $FACILITY_ID" -ForegroundColor Green
    Write-Host "Status: $($syncStatus.status)" -ForegroundColor $(if ($syncStatus.status -eq 'healthy') { 'Green' } else { 'Yellow' })
    Write-Host "Last Sync: $($syncStatus.lastSyncAt)" -ForegroundColor White
    Write-Host "Pending Changes: $($syncStatus.pendingChanges)" -ForegroundColor White
    Write-Host "Conflicts: $($syncStatus.conflicts)" -ForegroundColor $(if ($syncStatus.conflicts -gt 0) { 'Yellow' } else { 'Green' })
    Write-Host "Failed Syncs: $($syncStatus.failedSyncs)" -ForegroundColor $(if ($syncStatus.failedSyncs -gt 0) { 'Red' } else { 'Green' })
} catch {
    Write-Host "ℹ️  Sync status not available (may not be configured yet)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

