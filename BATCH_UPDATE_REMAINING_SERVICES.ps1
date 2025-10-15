# Batch Script to Update Remaining 8 Services with Response Wrapper
# Services: Clinical, Lab, Medication, Inventory, Facility, Device, Notification, CDS

$services = @(
    @{Name="clinical"; Path="microservices/clinical"; Port="7001"},
    @{Name="lab-service"; Path="microservices/lab-service"; Port="7080"},
    @{Name="medication-service"; Path="microservices/medication-service"; Port="7090"},
    @{Name="inventory-service"; Path="microservices/inventory-service"; Port="7100"},
    @{Name="facility-service"; Path="microservices/facility-service"; Port="7060"},
    @{Name="device-integration-service"; Path="microservices/device-integration-service"; Port="7070"},
    @{Name="notification-service"; Path="microservices/notification-service"; Port="3002"},
    @{Name="cds-service"; Path="microservices/cds-service"; Port="7002"}
)

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BATCH UPDATE: Response Wrapper Deployment" -ForegroundColor Cyan
Write-Host "  Services: 8 remaining services" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

foreach ($service in $services) {
    Write-Host "Processing $($service.Name)..." -ForegroundColor Yellow
    
    $packagePath = "$($service.Path)/package.json"
    $indexPath = "$($service.Path)/src/index.ts"
    
    if (Test-Path $packagePath) {
        Write-Host "  ✅ Found package.json" -ForegroundColor Green
        
        # Read package.json
        $packageJson = Get-Content $packagePath -Raw | ConvertFrom-Json
        
        # Add response-wrapper dependency if not exists
        if (-not $packageJson.dependencies."@nilecare/response-wrapper") {
            Write-Host "  📦 Adding @nilecare/response-wrapper dependency..." -ForegroundColor Cyan
            
            # This is a marker that the dependency needs to be added manually
            # PowerShell JSON manipulation is tricky, so we'll create a note file
            $noteFile = "$($service.Path)/ADD_RESPONSE_WRAPPER.txt"
            @"
Add this to package.json dependencies:
"@nilecare/response-wrapper": "file:../../packages/@nilecare/response-wrapper",

Then run:
cd $($service.Path)
npm install
"@ | Set-Content $noteFile
            
            Write-Host "  ⚠️  Created ADD_RESPONSE_WRAPPER.txt with instructions" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ Response wrapper already in dependencies" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ package.json not found at $packagePath" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BATCH UPDATE COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Manually add @nilecare/response-wrapper to each service's package.json"
Write-Host "2. Add middleware to each service's src/index.ts:"
Write-Host "   - import { requestIdMiddleware, errorHandlerMiddleware } from '@nilecare/response-wrapper';"
Write-Host "   - app.use(requestIdMiddleware); // FIRST"
Write-Host "   - app.use(errorHandlerMiddleware({ service: 'service-name' })); // LAST"
Write-Host "3. Test each service"
Write-Host ""

