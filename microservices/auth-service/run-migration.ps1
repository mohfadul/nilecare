# Auth Service Migration Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Auth Service Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create database
Write-Host "Step 1: Creating nilecare_auth database..." -ForegroundColor Yellow
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nilecare_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Database created" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Database creation failed" -ForegroundColor Red
    exit 1
}

# Step 2: Create schema_version table
Write-Host ""
Write-Host "Step 2: Creating schema_version table..." -ForegroundColor Yellow
$schemaVersionSQL = @"
CREATE TABLE IF NOT EXISTS schema_version (
    installed_rank INT NOT NULL AUTO_INCREMENT,
    version VARCHAR(50),
    description VARCHAR(200),
    type VARCHAR(20),
    script VARCHAR(1000),
    checksum INT,
    installed_by VARCHAR(100),
    installed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time INT,
    success BOOLEAN,
    PRIMARY KEY (installed_rank),
    INDEX idx_schema_version_version (version)
);
"@

$schemaVersionSQL | mysql -u root nilecare_auth
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Schema version table created" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Schema version table creation failed" -ForegroundColor Red
    exit 1
}

# Step 3: Apply migration
Write-Host ""
Write-Host "Step 3: Applying V1 migration (7 tables)..." -ForegroundColor Yellow
Get-Content migrations\V1__Initial_auth_schema.sql | mysql -u root nilecare_auth
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK - Migration applied successfully" -ForegroundColor Green
} else {
    Write-Host "  ERROR - Migration failed" -ForegroundColor Red
    exit 1
}

# Step 4: Record migration
Write-Host ""
Write-Host "Step 4: Recording migration..." -ForegroundColor Yellow
$recordSQL = @"
INSERT INTO schema_version (version, description, type, script, installed_by, execution_time, success)
VALUES ('1', 'Initial auth schema', 'SQL', 'V1__Initial_auth_schema.sql', 'admin', 0, TRUE);
"@

$recordSQL | mysql -u root nilecare_auth
Write-Host "  OK - Migration recorded" -ForegroundColor Green

# Step 5: Verify tables
Write-Host ""
Write-Host "Step 5: Verifying tables created..." -ForegroundColor Yellow
Write-Host ""
mysql -u root nilecare_auth -e "SHOW TABLES;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Auth Service Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database: nilecare_auth" -ForegroundColor Cyan
Write-Host "Tables: 8 (7 + schema_version)" -ForegroundColor Cyan
Write-Host ""

