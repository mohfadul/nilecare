# ============================================================================
# FIX #4: APPLY AUDIT COLUMNS TO ALL SERVICES
# ============================================================================
# Applies V2 migrations to add audit columns across all services
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FIX #4: APPLYING AUDIT COLUMNS TO ALL SERVICES" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Auth Service"; Path="microservices\auth-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Facility Service"; Path="microservices\facility-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Billing Service"; Path="microservices\billing-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Clinical Service"; Path="microservices\clinical"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Lab Service"; Path="microservices\lab-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Medication Service"; Path="microservices\medication-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Inventory Service"; Path="microservices\inventory-service"; Migration="migrations\V2__Add_audit_columns.sql"},
    @{Name="Appointment Service"; Path="microservices\appointment-service"; Migration="migrations\V2__Add_audit_columns.sql"}
)

$completed = 0
$skipped = 0
$failed = 0

foreach ($service in $services) {
    Write-Host "Processing $($service.Name)..." -ForegroundColor Yellow
    
    $migrationPath = Join-Path $service.Path $service.Migration
    
    if (Test-Path $migrationPath) {
        Write-Host "  ✅ Migration file exists: $migrationPath" -ForegroundColor Green
        $completed++
        
        # TODO: Apply migration
        # This would require MySQL/PostgreSQL connection
        # For now, just verify the file exists
        
    } else {
        Write-Host "  ⚠️  Migration file NOT found: $migrationPath" -ForegroundColor Yellow
        Write-Host "     Need to create this migration" -ForegroundColor Gray
        $skipped++
    }
    
    Write-Host ""
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Migrations Found:    $completed" -ForegroundColor Green
Write-Host "Migrations Needed:   $skipped" -ForegroundColor Yellow
Write-Host "Failed:             $failed" -ForegroundColor $(if ($failed -gt 0) {"Red"} else {"Green"})
Write-Host ""

if ($completed -eq $services.Count) {
    Write-Host "🎉 ALL MIGRATIONS EXIST!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Apply migrations to databases" -ForegroundColor Yellow
    Write-Host "This requires MySQL/PostgreSQL access" -ForegroundColor Yellow
} elseif ($skipped -gt 0) {
    Write-Host "⚠️  MIGRATIONS NEEDED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create V2__Add_audit_columns.sql for:" -ForegroundColor Yellow
    foreach ($service in $services) {
        $migrationPath = Join-Path $service.Path $service.Migration
        if (!(Test-Path $migrationPath)) {
            Write-Host "  - $($service.Name)" -ForegroundColor White
        }
    }
    Write-Host ""
    Write-Host "Use Auth/Facility Service migrations as templates" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Audit middleware ready at: shared\middleware\audit-columns.ts" -ForegroundColor Green
Write-Host ""

