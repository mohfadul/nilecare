# Create .env files for all microservices
$apiKey = -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

$services = @(
    @{Name="auth-service"; Port=7020; DB="nilecare_auth"},
    @{Name="business"; Port=7010; DB="nilecare_business"},
    @{Name="clinical"; Port=3004; DB="nilecare_clinical"},
    @{Name="appointment-service"; Port=7040; DB="nilecare_appointment"},
    @{Name="billing-service"; Port=7050; DB="nilecare_billing"},
    @{Name="payment-gateway-service"; Port=7030; DB="nilecare_payment"},
    @{Name="lab-service"; Port=7060; DB="nilecare_lab"},
    @{Name="medication-service"; Port=7070; DB="nilecare_medication"},
    @{Name="inventory-service"; Port=7080; DB="nilecare_inventory"},
    @{Name="facility-service"; Port=7090; DB="nilecare_facility"},
    @{Name="notification-service"; Port=7100; DB="nilecare_notification"},
    @{Name="cds-service"; Port=7110; DB="nilecare_cds"}
)

$created = 0

foreach ($svc in $services) {
    $path = "microservices\$($svc.Name)\.env"
    
    if (!(Test-Path $path)) {
        $content = @"
NODE_ENV=development
PORT=$($svc.Port)
SERVICE_NAME=$($svc.Name)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=$($svc.DB)
DB_USER=root
DB_PASSWORD=
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$apiKey
SERVICE_API_KEY=$apiKey
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
"@
        Set-Content -Path $path -Value $content
        Write-Host "Created .env for $($svc.Name) on port $($svc.Port)"
        $created++
    } else {
        Write-Host "Skipped $($svc.Name) - .env exists"
    }
}

Write-Host ""
Write-Host "Created $created .env files"
Write-Host "API Key: $apiKey"


