# Setup all NileCare databases
Write-Host "Setting up NileCare Databases..." -ForegroundColor Cyan
Write-Host ""

# Common MySQL installation paths
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "C:\mysql\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlExe = $path
        Write-Host "Found MySQL at: $path" -ForegroundColor Green
        break
    }
}

if (!$mysqlExe) {
    Write-Host "MySQL not found in standard locations" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run manually:" -ForegroundColor Cyan
    Write-Host "  mysql -u root -p < database\create-service-databases.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Cyan  
    Write-Host "  mysql -u root -p < database\SEED_DATABASE.sql" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Creating NileCare service databases..." -ForegroundColor Yellow

# Execute database creation script
& $mysqlExe -u root -e "SOURCE database/create-service-databases.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Databases created successfully!" -ForegroundColor Green
    Write-Host ""
    
    # List created databases
    Write-Host "Verifying databases:" -ForegroundColor Cyan
    & $mysqlExe -u root -e "SHOW DATABASES LIKE 'nilecare_%'"
    
    Write-Host ""
    Write-Host "Next: Seed test data" -ForegroundColor Yellow
    Write-Host "  .\SEED_TEST_DATA.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Database creation failed!" -ForegroundColor Red
    Write-Host "Please check MySQL credentials and try manually" -ForegroundColor Yellow
}

