# Apply All Improved Templates
# Applies all *.improved.ts files to their corresponding index.ts files

Write-Host "Applying all service improvements..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    "auth-service",
    "ehr-service",
    "lab-service",
    "medication-service",
    "cds-service",
    "fhir-service",
    "hl7-service",
    "device-integration-service",
    "facility-service",
    "inventory-service",
    "notification-service",
    "billing-service",
    "appointment-service",
    "gateway-service",
    "payment-gateway-service"
)

$updated = 0
$failed = 0

foreach ($service in $services) {
    $indexPath = "microservices\$service\src\index.ts"
    $improvedPath = "microservices\$service\src\index.improved.ts"
    
    if (Test-Path $improvedPath) {
        try {
            # Backup original
            if (Test-Path $indexPath) {
                $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                $backupPath = "$indexPath.backup-$timestamp"
                Copy-Item $indexPath $backupPath -Force
            }
            
            # Apply improved version
            Copy-Item $improvedPath $indexPath -Force
            Write-Host "[OK] $service" -ForegroundColor Green
            $updated++
        }
        catch {
            Write-Host "[FAIL] $service - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
    else {
        Write-Host "[SKIP] $service - No improved template" -ForegroundColor Yellow
        $failed++
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Applied: $updated services" -ForegroundColor Green
Write-Host "Failed/Skipped: $failed services" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($updated -gt 0) {
    Write-Host "SUCCESS! Applied improvements to $updated services" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test services: npm run dev"
    Write-Host "2. Run validation: cd testing; npm run validate:architecture"
    Write-Host "3. Test health endpoints for each service"
    Write-Host ""
}

