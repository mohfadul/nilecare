# ============================================================================
# NileCare Phase 2 - Export All Services Data (PowerShell)
# Version: 1.0.0
# Description: Export data from shared nilecare database for all services
# Date: 2025-10-15
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     NileCare Phase 2: Data Export from Shared Database        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Create exports directory
New-Item -ItemType Directory -Force -Path "database\exports\phase2" | Out-Null

# Get MySQL credentials
$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$securePassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$mysqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:MYSQL_PWD = $mysqlPassword

# ============================================================================
# 1. Auth Service
# ============================================================================
Write-Host "📦 Exporting Auth Service data..." -ForegroundColor Yellow

$tables = "auth_users auth_refresh_tokens auth_devices auth_roles auth_permissions auth_audit_logs auth_login_attempts"
mysqldump -u $mysqlUser nilecare $tables.Split() `
  --no-create-info --skip-triggers --single-transaction `
  | Out-File -Encoding UTF8 "database\exports\phase2\auth_data.sql"

Write-Host "✅ Auth Service exported" -ForegroundColor Green

# ============================================================================
# 2. Billing Service
# ============================================================================
Write-Host "📦 Exporting Billing Service data..." -ForegroundColor Yellow

$tables = "invoices invoice_line_items invoice_payment_allocations billing_accounts insurance_claims claim_line_items billing_adjustments charge_master billing_audit_log insurance_policies"
mysqldump -u $mysqlUser nilecare $tables.Split() `
  --no-create-info --skip-triggers --single-transaction `
  | Out-File -Encoding UTF8 "database\exports\phase2\billing_data.sql"

Write-Host "✅ Billing Service exported" -ForegroundColor Green

# ============================================================================
# 3. Payment Gateway
# ============================================================================
Write-Host "📦 Exporting Payment Gateway data..." -ForegroundColor Yellow

$tables = "payments payment_providers payment_reconciliation payment_refunds invoice_payments payment_installment_plans installment_schedule payment_webhooks payment_disputes payment_analytics_daily"
mysqldump -u $mysqlUser nilecare $tables.Split() `
  --no-create-info --skip-triggers --single-transaction `
  | Out-File -Encoding UTF8 "database\exports\phase2\payment_data.sql"

Write-Host "✅ Payment Gateway exported" -ForegroundColor Green

# ============================================================================
# 4. Clinical Service
# ============================================================================
Write-Host "📦 Exporting Clinical Service data..." -ForegroundColor Yellow

$tables = "patients encounters diagnoses allergies procedures immunizations clinical_notes audit_log"
mysqldump -u $mysqlUser nilecare $tables.Split() `
  --no-create-info --skip-triggers --single-transaction `
  | Out-File -Encoding UTF8 "database\exports\phase2\clinical_data.sql"

Write-Host "✅ Clinical Service exported" -ForegroundColor Green

# ============================================================================
# 5. Facility Service
# ============================================================================
Write-Host "📦 Exporting Facility Service data..." -ForegroundColor Yellow

try {
    $tables = "facilities departments wards beds"
    mysqldump -u $mysqlUser nilecare $tables.Split() `
      --no-create-info --skip-triggers --single-transaction `
      2>$null | Out-File -Encoding UTF8 "database\exports\phase2\facility_data.sql"
    Write-Host "✅ Facility Service exported" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some facility tables may not exist in shared database" -ForegroundColor Yellow
}

# ============================================================================
# 6. Lab Service
# ============================================================================
Write-Host "📦 Exporting Lab Service data..." -ForegroundColor Yellow

try {
    $tables = "lab_orders lab_results"
    mysqldump -u $mysqlUser nilecare $tables.Split() `
      --no-create-info --skip-triggers --single-transaction `
      2>$null | Out-File -Encoding UTF8 "database\exports\phase2\lab_data.sql"
    Write-Host "✅ Lab Service exported" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Some lab tables may not exist" -ForegroundColor Yellow
}

# ============================================================================
# 7. Medication Service
# ============================================================================
Write-Host "📦 Exporting Medication Service data..." -ForegroundColor Yellow

try {
    $tables = "medications"
    mysqldump -u $mysqlUser nilecare $tables.Split() `
      --no-create-info --skip-triggers --single-transaction `
      2>$null | Out-File -Encoding UTF8 "database\exports\phase2\medication_data.sql"
    Write-Host "✅ Medication Service exported" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Medication tables may not exist" -ForegroundColor Yellow
}

# ============================================================================
# 8. Inventory Service
# ============================================================================
Write-Host "📦 Exporting Inventory Service data..." -ForegroundColor Yellow

try {
    $tables = "inventory_items inventory_locations inventory_transactions suppliers"
    mysqldump -u $mysqlUser nilecare $tables.Split() `
      --no-create-info --skip-triggers --single-transaction `
      2>$null | Out-File -Encoding UTF8 "database\exports\phase2\inventory_data.sql"
    Write-Host "✅ Inventory Service exported" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Inventory tables may not exist" -ForegroundColor Yellow
}

# Cleanup
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 🎉 Export Complete! 🎉                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Exported files:" -ForegroundColor Cyan
Get-ChildItem "database\exports\phase2\*.sql" | Select-Object Name, Length, LastWriteTime
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify export files created" -ForegroundColor White
Write-Host "2. Run import scripts for each service" -ForegroundColor White
Write-Host "3. Verify record counts match" -ForegroundColor White
Write-Host "4. Test services with new databases" -ForegroundColor White
Write-Host ""

