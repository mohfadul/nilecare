# ═══════════════════════════════════════════════════════════════════════════
# Setup NileCare Database for Auth Service
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  NileCare Database Setup" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Check if MySQL is accessible
Write-Host "Checking MySQL..." -ForegroundColor Yellow

$mysqlPaths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "mysql"
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $mysqlPath = $path
        break
    }
}

if (-not $mysqlPath) {
    Write-Host "❌ MySQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Install XAMPP or MySQL Server"
    Write-Host "  2. Start MySQL service"
    Write-Host "  3. Run this script again"
    exit 1
}

Write-Host "✓ MySQL found at: $mysqlPath" -ForegroundColor Green
Write-Host ""

# Try to connect to MySQL
Write-Host "Testing MySQL connection..." -ForegroundColor Yellow
Write-Host "(If prompted for password, press Enter for empty password)" -ForegroundColor Gray
Write-Host ""

try {
    # Test connection
    & $mysqlPath -u root -e "SELECT 1;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MySQL connection successful" -ForegroundColor Green
    } else {
        Write-Host "✗ Cannot connect to MySQL" -ForegroundColor Red
        Write-Host "  Make sure MySQL is running in XAMPP Control Panel" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ MySQL connection failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create database
Write-Host "Creating database..." -ForegroundColor Yellow
& $mysqlPath -u root -e "CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database 'nilecare' ready" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create Auth Service tables
Write-Host "Creating Auth Service tables..." -ForegroundColor Yellow
$sqlFile = "microservices\auth-service\create-mysql-tables.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "✗ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

& $mysqlPath -u root nilecare < $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Auth Service tables created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tables may already exist (this is OK)" -ForegroundColor Yellow
}

Write-Host ""

# Verify tables
Write-Host "Verifying tables..." -ForegroundColor Yellow
$tables = & $mysqlPath -u root nilecare -e "SHOW TABLES;" 2>&1

if ($tables -match "auth_users") {
    Write-Host "✓ Tables verified successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tables verification incomplete" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ Database Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Start the Auth Service" -ForegroundColor Cyan
Write-Host "  cd microservices\auth-service" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

