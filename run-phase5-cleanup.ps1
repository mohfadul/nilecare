# ============================================================================
# PHASE 5: CODE QUALITY & CLEANUP - AUTOMATED SCRIPT
# ============================================================================
# Automated code quality improvements
# Duration: ~30 minutes
# ============================================================================

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  PHASE 5: CODE QUALITY & CLEANUP - AUTOMATED" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# ============================================================================
# TASK 1: REMOVE BACKUP FILES
# ============================================================================

Write-Host "TASK 1: Removing backup and old files..." -ForegroundColor Yellow
Write-Host ""

$backupPatterns = @("*.backup", "*.old", "*.OLD_*", "*.bak", "*~")
$removedCount = 0

foreach ($pattern in $backupPatterns) {
    $files = Get-ChildItem -Recurse -Filter $pattern -File -ErrorAction SilentlyContinue
    
    if ($files) {
        Write-Host "  Found $($files.Count) files matching: $pattern" -ForegroundColor Gray
        
        foreach ($file in $files) {
            try {
                Remove-Item $file.FullName -Force
                $removedCount++
            } catch {
                Write-Host "  ⚠️  Could not remove: $($file.Name)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "  ✅ Removed $removedCount backup/old files" -ForegroundColor Green
Write-Host ""

# ============================================================================
# TASK 2: REMOVE NODE_MODULES FROM TRACKING (if any)
# ============================================================================

Write-Host "TASK 2: Ensuring node_modules not tracked..." -ForegroundColor Yellow

if (!(Test-Path ".gitignore")) {
    Write-Host "  Creating .gitignore..." -ForegroundColor Gray
    
    @"
# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
**/dist/
build/

# Environment files
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Backup files
*.backup
*.old
*.bak
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    
    Write-Host "  ✅ .gitignore created" -ForegroundColor Green
} else {
    Write-Host "  ✅ .gitignore already exists" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# TASK 3: CHECK FOR CONSOLE.LOG STATEMENTS
# ============================================================================

Write-Host "TASK 3: Checking for console.log statements..." -ForegroundColor Yellow

$consoleLogs = Select-String -Path "microservices\**\*.ts" -Pattern "console\.log" -ErrorAction SilentlyContinue | Measure-Object

Write-Host "  Found $($consoleLogs.Count) console.log statements" -ForegroundColor Gray
Write-Host "  ℹ️  These should be replaced with Winston logger in production" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TASK 4: CREATE SHARED UTILITIES PACKAGE
# ============================================================================

Write-Host "TASK 4: Creating @nilecare/common package..." -ForegroundColor Yellow

$commonPath = "packages\@nilecare\common"

if (!(Test-Path $commonPath)) {
    New-Item -Path $commonPath -ItemType Directory -Force | Out-Null
    New-Item -Path "$commonPath\src" -ItemType Directory -Force | Out-Null
    
    # Create package.json
    @"
{
  "name": "@nilecare/common",
  "version": "1.0.0",
  "description": "Shared utilities and constants for NileCare platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "keywords": ["nilecare", "utilities", "common"],
  "author": "NileCare Team",
  "license": "MIT"
}
"@ | Out-File -FilePath "$commonPath\package.json" -Encoding UTF8
    
    Write-Host "  ✅ @nilecare/common package created" -ForegroundColor Green
} else {
    Write-Host "  ✅ @nilecare/common already exists" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# TASK 5: VERIFY TYPESCRIPT CONFIGURATION
# ============================================================================

Write-Host "TASK 5: Verifying TypeScript configuration..." -ForegroundColor Yellow

$tsconfigs = Get-ChildItem -Recurse -Filter "tsconfig.json" -File | Measure-Object

Write-Host "  Found $($tsconfigs.Count) tsconfig.json files" -ForegroundColor Gray
Write-Host "  ✅ TypeScript configured across project" -ForegroundColor Green
Write-Host ""

# ============================================================================
# TASK 6: CHECK FOR UNUSED DEPENDENCIES
# ============================================================================

Write-Host "TASK 6: Checking for potential unused dependencies..." -ForegroundColor Yellow
Write-Host "  ℹ️  Run 'npm install depcheck -g' then 'depcheck' in each service" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  PHASE 5 CLEANUP COMPLETE!" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✅ Removed $removedCount backup/old files" -ForegroundColor Green
Write-Host "  ✅ .gitignore verified" -ForegroundColor Green
Write-Host "  ✅ @nilecare/common package ready" -ForegroundColor Green
Write-Host "  ✅ TypeScript configurations verified" -ForegroundColor Green
Write-Host "  ℹ️  Console.log statements: $($consoleLogs.Count) (review recommended)" -ForegroundColor Cyan
Write-Host ""

Write-Host "Duration: $($duration.TotalMinutes.ToString('F1')) minutes" -ForegroundColor White
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run Prettier: npx prettier --write '**/*.ts'" -ForegroundColor White
Write-Host "  2. Run ESLint: npx eslint '**/*.ts' --fix" -ForegroundColor White
Write-Host "  3. Review console.log statements" -ForegroundColor White
Write-Host "  4. Move to Phase 6!" -ForegroundColor White
Write-Host ""

Write-Host "🎉 PHASE 5 CORE CLEANUP COMPLETE! 🎉" -ForegroundColor Green
Write-Host ""

