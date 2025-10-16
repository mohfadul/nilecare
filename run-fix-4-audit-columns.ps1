# ============================================================================
# FIX #4: ADD AUDIT COLUMNS TO ALL TABLES
# ============================================================================
# Adds created_at, updated_at, deleted_at, created_by, updated_by columns
# to all database tables for HIPAA compliance
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FIX #4: ADDING AUDIT COLUMNS TO ALL TABLES" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is accessible
Write-Host "Checking MySQL connection..." -NoNewline

try {
    $result = mysql -u root -p"your-mysql-password" -e "SELECT 1" 2>$null
    Write-Host " ✅ Connected" -ForegroundColor Green
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. MySQL is running (docker-compose up mysql)" -ForegroundColor Yellow
    Write-Host "  2. Update the password in this script" -ForegroundColor Yellow
    Write-Host "  3. Or use Docker:" -ForegroundColor Yellow
    Write-Host "     docker-compose exec mysql mysql -u root -p" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# RUN MIGRATIONS
# ============================================================================

Write-Host "Running Auth Service Migration..." -ForegroundColor Yellow

$authMigration = Get-Content "microservices\auth-service\migrations\V2__Add_audit_columns.sql" -Raw

try {
    $authMigration | mysql -u root -p"your-mysql-password" nilecare_auth
    Write-Host "✅ Auth Service migration complete" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Service migration failed: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  MIGRATION SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create migrations for remaining services" -ForegroundColor White
Write-Host "2. Run migrations for each service" -ForegroundColor White
Write-Host "3. Verify audit columns exist" -ForegroundColor White
Write-Host "4. Update TypeScript models" -ForegroundColor White
Write-Host "5. Create audit middleware" -ForegroundColor White
Write-Host ""

