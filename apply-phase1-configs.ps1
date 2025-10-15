# ============================================================================
# Apply Phase 1 Configurations
# ⚠️ WARNING: This will replace auth middleware and .env files!
# Make sure you've reviewed the generated files first!
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  ⚠️  PHASE 1: APPLY CONFIGURATIONS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "  1. Replace auth middleware in all services" -ForegroundColor Gray
Write-Host "  2. Update .env files with new configuration" -ForegroundColor Gray
Write-Host "  3. Backup existing files before replacing" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Aborted by user" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Services to update (already migrated manually: business, main-nilecare, appointment)
$services = @(
    "payment-gateway-service",
    "medication-service",
    "lab-service",
    "inventory-service",
    "facility-service",
    "fhir-service",
    "hl7-service"
)

$successCount = 0
$failCount = 0

foreach ($serviceName in $services) {
    Write-Host "Processing: $serviceName..." -ForegroundColor Cyan
    
    try {
        # Update auth middleware
        $authSource = "microservices\$serviceName\src\middleware\auth.ts.phase1"
        $authDest = "microservices\$serviceName\src\middleware\auth.ts"
        
        if (Test-Path $authSource) {
            # Backup existing
            if (Test-Path $authDest) {
                $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                $backupPath = "$authDest.backup-$timestamp"
                Copy-Item $authDest $backupPath -Force
                Write-Host "  ✅ Backed up auth.ts → $backupPath" -ForegroundColor Green
            }
            
            # Apply new auth middleware
            Copy-Item $authSource $authDest -Force
            Write-Host "  ✅ Updated auth.ts" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  auth.ts.phase1 not found, skipping" -ForegroundColor Yellow
        }
        
        # Update .env file
        $envSource = "microservices\$serviceName\.env.phase1"
        $envDest = "microservices\$serviceName\.env"
        
        if (Test-Path $envSource) {
            # Backup existing .env if it exists
            if (Test-Path $envDest) {
                $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                $envBackup = "$envDest.backup-$timestamp"
                Copy-Item $envDest $envBackup -Force
                Write-Host "  ✅ Backed up .env → $envBackup" -ForegroundColor Green
            }
            
            # Apply new .env
            Copy-Item $envSource $envDest -Force
            Write-Host "  ✅ Updated .env" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  .env.phase1 not found, skipping" -ForegroundColor Yellow
        }
        
        $successCount++
        Write-Host "  ✅ $serviceName migration complete!" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Migration Results" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "  ❌ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  🎉 ALL MIGRATIONS SUCCESSFUL!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Update Auth Service .env with all API keys:" -ForegroundColor White
    Write-Host "   Edit: microservices\auth-service\.env" -ForegroundColor Gray
    Write-Host "   See: PHASE_1_COMPLETE_PLAN.md for the full SERVICE_API_KEYS value" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test all services:" -ForegroundColor White
    Write-Host "   .\test-phase1-migration.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  Some migrations failed. Review errors above." -ForegroundColor Yellow
}

Write-Host ""

