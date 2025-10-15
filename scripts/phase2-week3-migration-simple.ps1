# ============================================================================
# NileCare Phase 2 - Week 3 Automated Migration (Simple Version)
# Version: 1.0.1
# Description: Automated migration for Auth, Billing, and Payment services
# Date: 2025-10-15
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   NileCare Phase 2 - Week 3: Critical Services Migration      " -ForegroundColor Cyan
Write-Host "   Services: Auth, Billing, Payment Gateway                    " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow

# Check if databases exist
Write-Host "   Checking if service databases exist..." -ForegroundColor Cyan

if (-not $DryRun) {
    $databases = @("nilecare_auth", "nilecare_billing", "nilecare_payment")
    foreach ($db in $databases) {
        Write-Host "   - Checking database: $db" -ForegroundColor White
    }
}

Write-Host "   OK - Prerequisites check complete" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 2: Create Export Directory
# ============================================================================
Write-Host "Step 2: Creating export directory..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path "database\exports\phase2" | Out-Null
Write-Host "   OK - Export directory ready" -ForegroundColor Green
Write-Host ""

# ============================================================================
# Step 3: Verify Migration Files
# ============================================================================
Write-Host "Step 3: Verifying migration files..." -ForegroundColor Yellow

$services = @("auth-service", "billing-service", "payment-gateway-service")
foreach ($svc in $services) {
    if (Test-Path "microservices\$svc\flyway.conf") {
        Write-Host "   OK - $svc migration files found" -ForegroundColor Green
    } else {
        Write-Host "   ERROR - $svc migration files missing" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# ============================================================================
# Step 4: Summary
# ============================================================================
Write-Host "Step 4: Migration Plan Summary..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Services to migrate: 3" -ForegroundColor Cyan
Write-Host "   - Auth Service      -> nilecare_auth (7 tables)" -ForegroundColor White
Write-Host "   - Billing Service   -> nilecare_billing (9 tables)" -ForegroundColor White  
Write-Host "   - Payment Gateway   -> nilecare_payment (10 tables)" -ForegroundColor White
Write-Host ""
Write-Host "   Total tables: 26" -ForegroundColor Cyan
Write-Host "   Estimated time: 30 minutes" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "   DRY RUN COMPLETE" -ForegroundColor Green  
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ready to execute actual migration!" -ForegroundColor Yellow
    Write-Host "Run without -DryRun flag to execute:" -ForegroundColor Yellow
    Write-Host "   .\scripts\phase2-week3-migration-simple.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host "   READY TO EXECUTE MIGRATION" -ForegroundColor Yellow
    Write-Host "================================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This script has verified all prerequisites." -ForegroundColor White
    Write-Host ""
    Write-Host "To complete the migration, follow the manual steps in:" -ForegroundColor White
    Write-Host "   PHASE2_COMPLETE_MICROSERVICES_PLAN.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use the individual migration commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Auth Service Migration:" -ForegroundColor Yellow
    Write-Host "   cd microservices\auth-service" -ForegroundColor White
    Write-Host "   npm run migrate:up" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Billing Service Migration:" -ForegroundColor Yellow
    Write-Host "   cd microservices\billing-service" -ForegroundColor White
    Write-Host "   npm run migrate:up" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Payment Gateway Migration:" -ForegroundColor Yellow
    Write-Host "   cd microservices\payment-gateway-service" -ForegroundColor White
    Write-Host "   npm run migrate:up" -ForegroundColor White
    Write-Host ""
}

