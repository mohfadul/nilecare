# ============================================================================
# Automated Architecture Fix Application (PowerShell)
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Applying Architecture Fixes to All Services       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Service configurations
$services = @(
    @{ name="business"; path="microservices\business\src"; hasImproved=$true },
    @{ name="data"; path="microservices\data\src"; hasImproved=$false },
    @{ name="auth-service"; path="microservices\auth-service\src"; hasImproved=$false },
    @{ name="ehr-service"; path="microservices\ehr-service\src"; hasImproved=$false },
    @{ name="lab-service"; path="microservices\lab-service\src"; hasImproved=$false },
    @{ name="medication-service"; path="microservices\medication-service\src"; hasImproved=$false },
    @{ name="cds-service"; path="microservices\cds-service\src"; hasImproved=$false },
    @{ name="fhir-service"; path="microservices\fhir-service\src"; hasImproved=$false },
    @{ name="hl7-service"; path="microservices\hl7-service\src"; hasImproved=$false },
    @{ name="device-integration-service"; path="microservices\device-integration-service\src"; hasImproved=$false },
    @{ name="facility-service"; path="microservices\facility-service\src"; hasImproved=$false },
    @{ name="inventory-service"; path="microservices\inventory-service\src"; hasImproved=$false },
    @{ name="notification-service"; path="microservices\notification-service\src"; hasImproved=$false },
    @{ name="billing-service"; path="microservices\billing-service\src"; hasImproved=$false },
    @{ name="appointment-service"; path="microservices\appointment-service\src"; hasImproved=$false },
    @{ name="gateway-service"; path="microservices\gateway-service\src"; hasImproved=$false },
    @{ name="payment-gateway-service"; path="microservices\payment-gateway-service\src"; hasImproved=$false }
)

$updated = 0
$skipped = 0

foreach ($service in $services) {
    Write-Host "`n📝 Processing: $($service.name)" -ForegroundColor Yellow
    
    $indexPath = Join-Path $service.path "index.ts"
    $improvedPath = Join-Path $service.path "index.improved.ts"
    
    # Check if improved version exists
    if (Test-Path $improvedPath) {
        Write-Host "   ✅ Found improved version" -ForegroundColor Green
        
        # Backup original
        if (Test-Path $indexPath) {
            $backupPath = "$indexPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item $indexPath $backupPath -Force
            Write-Host "   ✅ Backed up to: $(Split-Path $backupPath -Leaf)" -ForegroundColor Green
        }
        
        # Apply improved version
        Copy-Item $improvedPath $indexPath -Force
        Write-Host "   ✅ Applied improvements" -ForegroundColor Green
        
        $updated++
    }
    elseif (Test-Path $indexPath) {
        Write-Host "   ⚠️  No improved version found - needs manual update" -ForegroundColor Yellow
        Write-Host "   📝 Follow pattern from Clinical Service" -ForegroundColor Yellow
        $skipped++
    }
    else {
        Write-Host "   ❌ index.ts not found" -ForegroundColor Red
        $skipped++
    }
}

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Application Summary                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Applied: $updated services" -ForegroundColor Green
Write-Host "⚠️  Needs manual update: $skipped services" -ForegroundColor Yellow
Write-Host ""

if ($updated -gt 0) {
    Write-Host "🎉 Successfully applied improvements to $updated services!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test updated services: npm run dev"
    Write-Host "2. Verify health endpoints work"
    Write-Host "3. Run validation: cd testing && npm run validate:architecture"
    Write-Host ""
}

if ($skipped -gt 0) {
    Write-Host "📋 For the $skipped remaining services:" -ForegroundColor Yellow
    Write-Host "   Follow the pattern from microservices\clinical\src\index.ts"
    Write-Host "   Or see COMPLETE_IMPLEMENTATION_GUIDE.md for copy-paste code"
    Write-Host ""
}

Write-Host "✅ Process complete!" -ForegroundColor Green

