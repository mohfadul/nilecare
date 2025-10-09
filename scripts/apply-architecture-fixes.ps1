# ============================================================================
# Apply Architecture Fixes to All Services (PowerShell)
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Applying Architecture Fixes to All Services       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$services = @(
    "clinical",
    "business"
)

$updated = 0
$failed = 0

foreach ($service in $services) {
    Write-Host "📝 Processing: $service" -ForegroundColor Yellow
    
    $indexFile = "microservices\$service\src\index.ts"
    $improvedFile = "microservices\$service\src\index.improved.ts"
    
    if (Test-Path $improvedFile) {
        # Backup original
        if (Test-Path $indexFile) {
            Copy-Item $indexFile "$indexFile.backup" -Force
            Write-Host "   ✅ Backed up original" -ForegroundColor Green
        }
        
        # Replace with improved version
        Copy-Item $improvedFile $indexFile -Force
        Write-Host "   ✅ Applied improvements" -ForegroundColor Green
        
        $updated++
    } else {
        Write-Host "   ⚠️  Improved file not found: $improvedFile" -ForegroundColor Yellow
        $failed++
    }
    
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Updated: $updated services" -ForegroundColor Green
Write-Host "⚠️  Failed: $failed services" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test services: npm run dev"
Write-Host "2. Verify health endpoints: curl http://localhost:3001/health/ready"
Write-Host "3. Run validation: cd testing && npm run validate:architecture"
Write-Host ""

