# Apply Business Service Template
# Simple script to apply the ready template

Write-Host "Applying Business Service improvements..." -ForegroundColor Cyan

$indexPath = "microservices\business\src\index.ts"
$improvedPath = "microservices\business\src\index.improved.ts"

if (Test-Path $improvedPath) {
    # Backup original
    if (Test-Path $indexPath) {
        $backupPath = "$indexPath.backup"
        Copy-Item $indexPath $backupPath -Force
        Write-Host "Backed up original to: $backupPath" -ForegroundColor Green
    }
    
    # Apply improved version
    Copy-Item $improvedPath $indexPath -Force
    Write-Host "Applied improvements to Business Service!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test with:" -ForegroundColor Cyan
    Write-Host "  cd microservices\business"
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "Verify with:" -ForegroundColor Cyan
    Write-Host "  curl http://localhost:3002/health/ready"
    Write-Host "  curl http://localhost:3002/metrics"
} else {
    Write-Host "Improved version not found!" -ForegroundColor Red
}

