# ============================================================================
# NileCare Phase 1 Setup Script (PowerShell)
# Version: 1.0.0
# Description: Automated setup for Phase 1 database migration
# Date: 2025-10-15
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       NileCare Phase 1: Database Migration Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. Check Prerequisites
# ============================================================================
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Yellow

# Check if MySQL is installed
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "❌ MySQL is not installed" -ForegroundColor Red
    Write-Host "Please install MySQL 8.0+ or XAMPP first" -ForegroundColor Red
    exit 1
}
Write-Host "✅ MySQL is installed" -ForegroundColor Green

# Check if Flyway is installed
$flywayPath = Get-Command flyway -ErrorAction SilentlyContinue
if (-not $flywayPath) {
    Write-Host "⚠️  Flyway is not installed" -ForegroundColor Yellow
    Write-Host "Installing Flyway via Chocolatey..." -ForegroundColor Yellow
    
    $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
    if ($chocoPath) {
        choco install flyway -y
        Write-Host "✅ Flyway installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Chocolatey not found. Please install Flyway manually:" -ForegroundColor Red
        Write-Host "   Download from: https://flywaydb.org/download" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Flyway is installed" -ForegroundColor Green
}

# Check if Node.js is installed
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "✅ Node.js is installed ($nodeVersion)" -ForegroundColor Green

Write-Host ""

# ============================================================================
# 2. Get MySQL Credentials
# ============================================================================
Write-Host "🔐 Step 2: MySQL Authentication" -ForegroundColor Yellow

$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$securePassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$mysqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""

# ============================================================================
# 3. Create Databases
# ============================================================================
Write-Host "🗄️  Step 3: Creating service databases..." -ForegroundColor Yellow

$env:MYSQL_PWD = $mysqlPassword
mysql -u $mysqlUser < database/create-service-databases.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service databases created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create databases" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# 4. Create Database Users
# ============================================================================
Write-Host "👤 Step 4: Creating service database users..." -ForegroundColor Yellow

mysql -u $mysqlUser < database/create-service-users.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service users created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create users" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# 5. Install NPM Dependencies
# ============================================================================
Write-Host "📦 Step 5: Installing NPM dependencies..." -ForegroundColor Yellow

$services = @("auth-service", "billing-service", "payment-gateway-service")

foreach ($service in $services) {
    Write-Host "Installing dependencies for $service..." -ForegroundColor Cyan
    Push-Location "microservices\$service"
    npm install --save-dev node-flyway
    Pop-Location
    Write-Host "✅ Dependencies installed for $service" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# 6. Run Migrations
# ============================================================================
Write-Host "🚀 Step 6: Running database migrations..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host "Running migrations for $service..." -ForegroundColor Cyan
    Push-Location "microservices\$service"
    
    # Set environment variables for migration
    $serviceUser = $service.Replace("-", "_")
    $env:DB_USER = $serviceUser
    
    # Use appropriate password (matching create-service-users.sql)
    switch ($service) {
        "auth-service" { $env:DB_PASSWORD = "Auth_Service_P@ssw0rd_2025!" }
        "billing-service" { $env:DB_PASSWORD = "Billing_Service_P@ssw0rd_2025!" }
        "payment-gateway-service" { $env:DB_PASSWORD = "Payment_Service_P@ssw0rd_2025!" }
    }
    
    $env:ENVIRONMENT = "development"
    $env:USER = $env:USERNAME
    
    npm run migrate:up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed for $service" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed for $service" -ForegroundColor Red
    }
    
    Pop-Location
}

Write-Host ""

# ============================================================================
# 7. Verify Setup
# ============================================================================
Write-Host "🔍 Step 7: Verifying setup..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host "`nVerifying $service..." -ForegroundColor Cyan
    Push-Location "microservices\$service"
    npm run migrate:info
    Pop-Location
}

Write-Host ""

# ============================================================================
# Success!
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 Phase 1 Setup Complete! 🎉                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Databases created:" -ForegroundColor Green
Write-Host "   • nilecare_auth" -ForegroundColor White
Write-Host "   • nilecare_billing" -ForegroundColor White
Write-Host "   • nilecare_payment" -ForegroundColor White
Write-Host ""
Write-Host "✅ Service users created with permissions" -ForegroundColor Green
Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update service .env files with new database names" -ForegroundColor White
Write-Host "   2. Test service connections" -ForegroundColor White
Write-Host "   3. Review PHASE1_IMPLEMENTATION_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Security Reminder:" -ForegroundColor Yellow
Write-Host "   • Change all database passwords in production" -ForegroundColor White
Write-Host "   • Use secrets manager for credential storage" -ForegroundColor White
Write-Host "   • Review database/service-credentials.md" -ForegroundColor White
Write-Host ""

# Cleanup
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

