# ============================================================================
# SETUP ALL NILECARE SERVICES - AUTOMATED
# This script creates .env files for all microservices
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SETTING UP ALL NILECARE MICROSERVICES                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Generate a 64-character API key
$apiKey = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "Generated 64-character API key" -ForegroundColor Green
Write-Host ""

# Service configurations
$services = @(
    @{Name="auth-service"; Port=7020; DB="nilecare_auth"},
    @{Name="business"; Port=7010; DB="nilecare_business"},
    @{Name="clinical"; Port=3004; DB="nilecare_clinical"},
    @{Name="appointment-service"; Port=7040; DB="nilecare_appointment"},
    @{Name="billing-service"; Port=7050; DB="nilecare_billing"},
    @{Name="payment-gateway-service"; Port=7030; DB="nilecare_payment"},
    @{Name="lab-service"; Port=7060; DB="nilecare_lab"},
    @{Name="medication-service"; Port=7070; DB="nilecare_medication"},
    @{Name="inventory-service"; Port=7080; DB="nilecare_inventory"},
    @{Name="facility-service"; Port=7090; DB="nilecare_facility"},
    @{Name="notification-service"; Port=7100; DB="nilecare_notification"},
    @{Name="cds-service"; Port=7110; DB="nilecare_cds"}
)

$createdCount = 0
$skippedCount = 0

foreach ($service in $services) {
    $servicePath = "microservices\$($service.Name)"
    
    if (Test-Path $servicePath) {
        $envPath = "$servicePath\.env"
        
        # Check if .env already exists
        if (Test-Path $envPath) {
            Write-Host "SKIP: $($service.Name) - .env already exists" -ForegroundColor Yellow
            $skippedCount++
        } else {
            # Create .env file
            $envContent = @"
# $($service.Name) Environment Configuration
NODE_ENV=development
PORT=$($service.Port)
SERVICE_NAME=$($service.Name)

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($service.DB)
DB_USER=root
DB_PASSWORD=

# Main Orchestrator
MAIN_SERVICE_URL=http://localhost:7000

# Auth Service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$apiKey

# Service API Key (for service-to-service auth)
SERVICE_API_KEY=$apiKey

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:5173

# Redis (optional - will gracefully degrade if not available)
REDIS_HOST=localhost
REDIS_PORT=6379
"@

            Set-Content -Path $envPath -Value $envContent
            Write-Host "OK: $($service.Name) - Created .env file (Port: $($service.Port))" -ForegroundColor Green
            $createdCount++
        }
    } else {
        Write-Host "ERROR: $($service.Name) - Directory not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  SETUP SUMMARY                                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created: $createdCount .env files" -ForegroundColor Green
if ($skippedCount -gt 0) {
    Write-Host "Skipped: $skippedCount files (already exist)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Database Setup (Optional - services will start without it)" -ForegroundColor White
Write-Host "   Run: .\SETUP_DATABASES.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start All Services" -ForegroundColor White
Write-Host "   Run: .\START_ALL_SERVICES_MANUAL.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or start services individually:" -ForegroundColor White
Write-Host "   cd microservices\auth-service ; npm run dev" -ForegroundColor Gray
Write-Host ""

Write-Host "Configuration complete! Services ready to start!" -ForegroundColor Green
Write-Host ""
Write-Host "API Key (saved in all .env files):" -ForegroundColor Yellow
Write-Host "   $apiKey" -ForegroundColor Gray
Write-Host ""

