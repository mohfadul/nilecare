# ============================================================================
# START NILECARE FRONTEND
# ============================================================================
# Starts the React frontend application
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  STARTING NILECARE FRONTEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "nilecare-frontend"

if (Test-Path $frontendPath) {
    Write-Host "Frontend path: $frontendPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Starting React development server..." -ForegroundColor Yellow
    Write-Host ""
    
    # Start in new window with title
    $windowTitle = "NileCare - Frontend (React)"
    $scriptBlock = "cd '$frontendPath'; `$Host.UI.RawUI.WindowTitle = '$windowTitle'; Write-Host 'Starting NileCare Frontend...' -ForegroundColor Cyan; Write-Host ''; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    
    Write-Host "✅ Frontend starting in new window!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Wait 10-15 seconds for frontend to compile..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then access the application:" -ForegroundColor Yellow
    Write-Host "  http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  OR" -ForegroundColor Gray
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Login with your configured credentials and explore!" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Frontend starting! 🎉" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Error: Frontend directory not found at: $frontendPath" -ForegroundColor Red
    Write-Host ""
}

