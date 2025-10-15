# ============================================================================
# Update All Service .env Files for Phase 1
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Updating All Service .env Files" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Service configurations
$services = @{
    "business" = @{
        port = 7010
        key = "4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8"
    }
    "main-nilecare" = @{
        port = 7000
        key = "df4dd9cb3d8c275474272b1204d17ed32bcf3d2eab9feae78dcd1bfa9dac5ebe"
    }
    "appointment-service" = @{
        port = 7040
        key = "1edb3dbfbc01958b29ec73c53a24ddb89a60b60af287a54581381ddddce32fc8"
    }
    "payment-gateway-service" = @{
        port = 7030
        key = "f3045670a1704147a20cb0767f612f271d5ced6374a39ecd5c8d482d669251e5"
    }
    "medication-service" = @{
        port = 4003
        key = "2e887b36df9b8789c4946f9cb8d82a03f7e917b19b0f2fa6603e1659235142a1"
    }
    "lab-service" = @{
        port = 4005
        key = "7bf48164d314d4304abe806f94fcc1c031197aff3ecfcbf6ddde0bdc481daf99"
    }
    "inventory-service" = @{
        port = 5004
        key = "beb918b8b56e9c4501dcba579fbf7fd3af2686db2cf8fd31831064e7da1f4cf1"
    }
    "facility-service" = @{
        port = 5001
        key = "4319ef7f4810c49f8757b94cd879a023a16bea8dc75816d8f759e05dd0dff932"
    }
    "fhir-service" = @{
        port = 6001
        key = "8c768900cb8aac54aa0a4de7094d8f90860ea17d137d1a970fd38148bf43caf4"
    }
    "hl7-service" = @{
        port = 6002
        key = "c0704a2da0de18d4487bfceb7f006199386dd55f2d9bb973a7954d59c257c5e7"
    }
}

foreach ($serviceName in $services.Keys) {
    $config = $services[$serviceName]
    $envPath = "microservices\$serviceName\.env"
    
    Write-Host "Processing: $serviceName..." -ForegroundColor Cyan
    
    if (Test-Path $envPath) {
        # Read existing .env
        $content = Get-Content $envPath -Raw
        
        # Remove JWT_SECRET if it exists
        $content = $content -replace 'JWT_SECRET=.*\r?\n?', ''
        
        # Add/Update AUTH_SERVICE_URL
        if ($content -notmatch 'AUTH_SERVICE_URL=') {
            $content += "`nAUTH_SERVICE_URL=http://localhost:7020`n"
        }
        
        # Add/Update AUTH_SERVICE_API_KEY
        if ($content -match 'AUTH_SERVICE_API_KEY=') {
            $content = $content -replace 'AUTH_SERVICE_API_KEY=.*', "AUTH_SERVICE_API_KEY=$($config.key)"
        } else {
            $content += "AUTH_SERVICE_API_KEY=$($config.key)`n"
        }
        
        # Add/Update SERVICE_NAME
        if ($content -match 'SERVICE_NAME=') {
            $content = $content -replace 'SERVICE_NAME=.*', "SERVICE_NAME=$serviceName"
        } else {
            $content += "SERVICE_NAME=$serviceName`n"
        }
        
        # Write back
        Set-Content -Path $envPath -Value $content
        Write-Host "  ✅ Updated $serviceName .env" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .env not found for $serviceName" -ForegroundColor Yellow
    }
}

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ All Service .env Files Updated!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Green

