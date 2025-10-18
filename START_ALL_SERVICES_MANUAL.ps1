# Start all NileCare microservices in separate windows
Write-Host "Starting NileCare Microservices..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Auth Service"; Path="microservices\auth-service"; Port=7020},
    @{Name="Clinical Service"; Path="microservices\clinical"; Port=3004},
    @{Name="Appointment Service"; Path="microservices\appointment-service"; Port=7040},
    @{Name="Billing Service"; Path="microservices\billing-service"; Port=7050},
    @{Name="Payment Gateway"; Path="microservices\payment-gateway-service"; Port=7030},
    @{Name="Lab Service"; Path="microservices\lab-service"; Port=7060},
    @{Name="Medication Service"; Path="microservices\medication-service"; Port=7070},
    @{Name="Inventory Service"; Path="microservices\inventory-service"; Port=7080},
    @{Name="Facility Service"; Path="microservices\facility-service"; Port=7090},
    @{Name="Notification Service"; Path="microservices\notification-service"; Port=7100},
    @{Name="CDS Service"; Path="microservices\cds-service"; Port=7110},
    @{Name="Business Service"; Path="microservices\business"; Port=7010}
)

$started = 0

foreach ($svc in $services) {
    if (Test-Path $svc.Path) {
        Write-Host "Starting $($svc.Name) on port $($svc.Port)..."
        $title = "NileCare - $($svc.Name)"
        $cmd = "cd '$($svc.Path)'; Write-Host 'Starting $($svc.Name)...' -ForegroundColor Cyan; npm run dev; Read-Host 'Press Enter to close'"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$title'; $cmd"
        Start-Sleep -Milliseconds 500
        $started++
    }
}

Write-Host ""
Write-Host "Started $started services in separate windows" -ForegroundColor Green
Write-Host "Wait 30-60 seconds for services to initialize" -ForegroundColor Yellow
Write-Host ""


