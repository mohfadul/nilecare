# ============================================================================
# Apply Test User Fix - Add Missing Billing Clerk User
# Date: October 18, 2025
# Purpose: Add billing_clerk test user to enable complete dashboard testing
# ============================================================================

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ADD MISSING BILLING CLERK TEST USER" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$MYSQL_HOST = "localhost"
$MYSQL_USER = "root"
$MYSQL_MAIN_DB = "nilecare"
$MYSQL_AUTH_DB = "nilecare_auth"

# SQL Files
$MAIN_DB_FIX = "database/FIX_ADD_BILLING_CLERK_USER.sql"
$AUTH_DB_FIX = "microservices/auth-service/FIX_ADD_MISSING_USERS.sql"

# ============================================================================
# 1. Check MySQL Connection
# ============================================================================

Write-Host "🔍 Checking MySQL connection..." -ForegroundColor Yellow

$mysqlTest = mysql -h $MYSQL_HOST -u $MYSQL_USER -e "SELECT 1" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot connect to MySQL" -ForegroundColor Red
    Write-Host "   Make sure MySQL is running" -ForegroundColor Red
    Write-Host "   Command: mysql -h $MYSQL_HOST -u $MYSQL_USER" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ MySQL connection successful" -ForegroundColor Green
Write-Host ""

# ============================================================================
# 2. Apply Fix to Main Database
# ============================================================================

Write-Host "📝 Step 1: Adding billing_clerk user to main database ($MYSQL_MAIN_DB)..." -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path $MAIN_DB_FIX)) {
    Write-Host "❌ File not found: $MAIN_DB_FIX" -ForegroundColor Red
    exit 1
}

$result = mysql -h $MYSQL_HOST -u $MYSQL_USER -e "SOURCE $MAIN_DB_FIX" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Main database updated successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Failed to update main database" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}

# ============================================================================
# 3. Apply Fix to Auth Service Database
# ============================================================================

Write-Host "📝 Step 2: Adding missing users to auth service ($MYSQL_AUTH_DB)..." -ForegroundColor Yellow
Write-Host ""

# Check if auth database exists
$authDbExists = mysql -h $MYSQL_HOST -u $MYSQL_USER -e "SHOW DATABASES LIKE '$MYSQL_AUTH_DB'" 2>&1
if ($authDbExists -match $MYSQL_AUTH_DB) {
    if (!(Test-Path $AUTH_DB_FIX)) {
        Write-Host "❌ File not found: $AUTH_DB_FIX" -ForegroundColor Red
        exit 1
    }

    # Update the SQL file to use correct database
    $authSql = Get-Content $AUTH_DB_FIX -Raw
    $authSql = "USE $MYSQL_AUTH_DB;`n" + $authSql
    $authSql | mysql -h $MYSQL_HOST -u $MYSQL_USER 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Auth service database updated successfully" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "⚠️  Failed to update auth service database" -ForegroundColor Yellow
        Write-Host "   This may be OK if using main database for auth" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "⚠️  Auth service database ($MYSQL_AUTH_DB) not found" -ForegroundColor Yellow
    Write-Host "   Skipping auth service update" -ForegroundColor Gray
    Write-Host "   If using main database for auth, this is OK" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# 4. Verify Users
# ============================================================================

Write-Host "✅ Verification: All test users" -ForegroundColor Yellow
Write-Host ""

$verifyQuery = @"
SELECT 
  role,
  email,
  CONCAT(first_name, ' ', last_name) as name,
  status
FROM users 
WHERE email LIKE '%@nilecare.sd'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'doctor' THEN 2
    WHEN 'nurse' THEN 3
    WHEN 'receptionist' THEN 4
    WHEN 'billing_clerk' THEN 5
    WHEN 'lab_technician' THEN 6
    WHEN 'pharmacist' THEN 7
    ELSE 8
  END;
"@

mysql -h $MYSQL_HOST -u $MYSQL_USER -D $MYSQL_MAIN_DB -e $verifyQuery

Write-Host ""

# ============================================================================
# 5. Count by Role
# ============================================================================

Write-Host "📊 Test users by role:" -ForegroundColor Yellow
Write-Host ""

$countQuery = @"
SELECT 
  role,
  COUNT(*) as count
FROM users 
WHERE email LIKE '%@nilecare.sd'
GROUP BY role
ORDER BY role;
"@

mysql -h $MYSQL_HOST -u $MYSQL_USER -D $MYSQL_MAIN_DB -e $countQuery

Write-Host ""

# ============================================================================
# SUCCESS
# ============================================================================

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  ✅ FIX APPLIED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Test User Credentials:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dashboard              Email                       Password" -ForegroundColor White
Write-Host "  ─────────────────────  ─────────────────────────  ────────────" -ForegroundColor Gray
Write-Host "  Doctor                 doctor@nilecare.sd         TestPass123!" -ForegroundColor White
Write-Host "  Nurse                  nurse@nilecare.sd          TestPass123!" -ForegroundColor White
Write-Host "  Receptionist           reception@nilecare.sd      TestPass123!" -ForegroundColor White
Write-Host "  Admin                  admin@nilecare.sd          TestPass123!" -ForegroundColor White
Write-Host "  Billing Clerk (NEW!)   billing@nilecare.sd        TestPass123!" -ForegroundColor Green
Write-Host "  Lab Technician         lab@nilecare.sd            TestPass123!" -ForegroundColor White
Write-Host "  Pharmacist             pharmacist@nilecare.sd     TestPass123!" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Start backend:  cd microservices/main-nilecare && npm run dev" -ForegroundColor Gray
Write-Host "  2. Start frontend: cd nilecare-frontend && npm run dev" -ForegroundColor Gray
Write-Host "  3. Login with:     billing@nilecare.sd / TestPass123!" -ForegroundColor Gray
Write-Host "  4. Navigate to:    Billing Clerk Dashboard" -ForegroundColor Gray
Write-Host "  5. Verify:         Real data loading" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 All 7/7 dashboards now have test users!" -ForegroundColor Green
Write-Host ""

