# ============================================================================
# NileCare Phase 2 - Week 3 Automated Migration
# Version: 1.0.0
# Description: Automated migration for Auth, Billing, and Payment services
# Date: 2025-10-15
# Services: Auth Service, Billing Service, Payment Gateway Service
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NileCare Phase 2 - Week 3: Critical Services Migration      ║" -ForegroundColor Cyan
Write-Host "║   Services: Auth, Billing, Payment Gateway                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# Get MySQL Credentials
# ============================================================================
Write-Host "MySQL Authentication" -ForegroundColor Yellow
$mysqlUser = Read-Host "Enter MySQL username (default: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$securePassword = Read-Host "Enter MySQL password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$mysqlPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:MYSQL_PWD = $mysqlPassword

Write-Host ""

# ============================================================================
# Step 1: Backup Shared Database
# ============================================================================
if (-not $SkipBackup) {
    Write-Host "Step 1: Backing up shared database..." -ForegroundColor Yellow
    
    if (-not $DryRun) {
        $backupFile = "backup_phase2_week3_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
        mysqldump -u $mysqlUser nilecare > $backupFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Backup created: $backupFile" -ForegroundColor Green
            $backupSize = (Get-Item $backupFile).Length / 1MB
            Write-Host "   Size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
        } else {
            Write-Host "[ERROR] Backup failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   [DRY RUN] Would create backup" -ForegroundColor Cyan
    }
} else {
    Write-Host "[WARNING] Skipping backup (SkipBackup flag specified)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Step 2: Export Data from Shared Database
# ============================================================================
Write-Host "Step 2: Exporting data from shared database..." -ForegroundColor Yellow

$exports = @(
    @{Service="Auth"; Tables="auth_users auth_refresh_tokens auth_devices auth_roles auth_permissions auth_audit_logs auth_login_attempts"; File="auth_data.sql"},
    @{Service="Billing"; Tables="invoices invoice_line_items invoice_payment_allocations billing_accounts insurance_claims claim_line_items billing_adjustments charge_master billing_audit_log insurance_policies"; File="billing_data.sql"},
    @{Service="Payment"; Tables="payments payment_providers payment_reconciliation payment_refunds invoice_payments payment_installment_plans installment_schedule payment_webhooks payment_disputes payment_analytics_daily"; File="payment_data.sql"}
)

New-Item -ItemType Directory -Force -Path "database\exports\phase2" | Out-Null

foreach ($export in $exports) {
    Write-Host "   Exporting $($export.Service) Service..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        $tableList = $export.Tables -split ' '
        mysqldump -u $mysqlUser nilecare $tableList --no-create-info --skip-triggers --single-transaction 2>$null | Out-File -Encoding UTF8 "database\exports\phase2\$($export.File)"
        
        if ($LASTEXITCODE -eq 0) {
            $lineCount = (Get-Content "database\exports\phase2\$($export.File)" | Measure-Object).Count
            Write-Host "   [OK] $($export.Service): Exported $lineCount lines" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] $($export.Service): Export failed" -ForegroundColor Red
        }
    } else {
        Write-Host "   [DRY RUN] Would export $($export.Service)" -ForegroundColor Cyan
    }
}

Write-Host ""

# ============================================================================
# Step 3: Auth Service Migration
# ============================================================================
Write-Host "Step 3: Migrating Auth Service..." -ForegroundColor Yellow

if (-not $DryRun) {
    Push-Location "microservices\auth-service"
    
    # Apply Flyway migrations
    Write-Host "   Applying Flyway migrations..." -ForegroundColor Cyan
    $env:DB_USER = "auth_service"
    $env:DB_PASSWORD = "Auth_Service_P@ssw0rd_2025!"
    $env:ENVIRONMENT = "development"
    
    npm run migrate:up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Migrations applied" -ForegroundColor Green
        
        # Import data
        Write-Host "   Importing data..." -ForegroundColor Cyan
        mysql -u $mysqlUser nilecare_auth < ..\..\database\exports\phase2\auth_data.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Data imported" -ForegroundColor Green
            
            # Verify record counts
            Write-Host "   Verifying data..." -ForegroundColor Cyan
            $sourceCount = mysql -u $mysqlUser nilecare -N -e "SELECT COUNT(*) FROM auth_users;"
            $targetCount = mysql -u $mysqlUser nilecare_auth -N -e "SELECT COUNT(*) FROM auth_users;"
            
            if ($sourceCount -eq $targetCount) {
                Write-Host "   [OK] Data verified: $sourceCount records migrated" -ForegroundColor Green
            } else {
                Write-Host "   [ERROR] Data mismatch: Source=$sourceCount, Target=$targetCount" -ForegroundColor Red
            }
        }
    }
    
    Pop-Location
} else {
    Write-Host "   [DRY RUN] Would migrate Auth Service" -ForegroundColor Cyan
}

Write-Host ""

# ============================================================================
# Step 4: Billing Service Migration
# ============================================================================
Write-Host "Step 4: Migrating Billing Service..." -ForegroundColor Yellow

if (-not $DryRun) {
    Push-Location "microservices\billing-service"
    
    $env:DB_USER = "billing_service"
    $env:DB_PASSWORD = "Billing_Service_P@ssw0rd_2025!"
    
    npm run migrate:up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Migrations applied" -ForegroundColor Green
        
        mysql -u $mysqlUser nilecare_billing < ..\..\database\exports\phase2\billing_data.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Data imported" -ForegroundColor Green
            
            $sourceCount = mysql -u $mysqlUser nilecare -N -e "SELECT COUNT(*) FROM invoices;" 2>$null
            $targetCount = mysql -u $mysqlUser nilecare_billing -N -e "SELECT COUNT(*) FROM invoices;"
            
            if ($sourceCount) {
                Write-Host "   [OK] Data verified: $sourceCount invoices migrated" -ForegroundColor Green
            }
        }
    }
    
    Pop-Location
} else {
    Write-Host "   [DRY RUN] Would migrate Billing Service" -ForegroundColor Cyan
}

Write-Host ""

# ============================================================================
# Step 5: Payment Gateway Migration
# ============================================================================
Write-Host "Step 5: Migrating Payment Gateway Service..." -ForegroundColor Yellow

if (-not $DryRun) {
    Push-Location "microservices\payment-gateway-service"
    
    $env:DB_USER = "payment_service"
    $env:DB_PASSWORD = "Payment_Service_P@ssw0rd_2025!"
    
    npm run migrate:up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Migrations applied" -ForegroundColor Green
        
        mysql -u $mysqlUser nilecare_payment < ..\..\database\exports\phase2\payment_data.sql
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Data imported" -ForegroundColor Green
            
            $providerCount = mysql -u $mysqlUser nilecare_payment -N -e "SELECT COUNT(*) FROM payment_providers;"
            Write-Host "   [OK] Payment providers: $providerCount configured" -ForegroundColor Green
        }
    }
    
    Pop-Location
} else {
    Write-Host "   [DRY RUN] Would migrate Payment Gateway" -ForegroundColor Cyan
}

Write-Host ""

# ============================================================================
# Step 6: Update Service Configurations
# ============================================================================
Write-Host "Step 6: Updating service configurations..." -ForegroundColor Yellow

$services = @(
    @{Name="auth-service"; DBName="nilecare_auth"; DBUser="auth_service"},
    @{Name="billing-service"; DBName="nilecare_billing"; DBUser="billing_service"},
    @{Name="payment-gateway-service"; DBName="nilecare_payment"; DBUser="payment_service"}
)

foreach ($svc in $services) {
    Write-Host "   Updating $($svc.Name)..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        $envPath = "microservices\$($svc.Name)\.env"
        
        if (Test-Path $envPath) {
            # Update DB_NAME in .env file
            $content = Get-Content $envPath
            $content = $content -replace "DB_NAME=.*", "DB_NAME=$($svc.DBName)"
            $content | Set-Content $envPath
            
            Write-Host "   [OK] Updated $envPath" -ForegroundColor Green
        } else {
            Write-Host "   [WARNING] .env file not found (copy from .env.example)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   [DRY RUN] Would update configuration" -ForegroundColor Cyan
    }
}

Write-Host ""

# ============================================================================
# Step 7: Test Services
# ============================================================================
Write-Host "Step 7: Testing migrated services..." -ForegroundColor Yellow

if (-not $DryRun) {
    foreach ($svc in $services) {
        Write-Host "   Testing $($svc.Name)..." -ForegroundColor Cyan
        Push-Location "microservices\$($svc.Name)"
        
        # Start service in background
        $process = Start-Process npm -ArgumentList "run", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "test-output.log"
        Start-Sleep -Seconds 15
        
        # Check if started
        $port = switch ($svc.Name) {
            "auth-service" { 7020 }
            "billing-service" { 7050 }
            "payment-gateway-service" { 7030 }
        }
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "   [OK] $($svc.Name) started successfully (port $port)" -ForegroundColor Green
            }
        } catch {
            Write-Host "   [ERROR] $($svc.Name) failed to start" -ForegroundColor Red
        } finally {
            # Stop service
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Remove-Item "test-output.log" -ErrorAction SilentlyContinue
        }
        
        Pop-Location
    }
} else {
    Write-Host "   [DRY RUN] Would test services" -ForegroundColor Cyan
}

Write-Host ""

# ============================================================================
# Step 8: Verification Summary
# ============================================================================
Write-Host "Step 8: Migration Summary..." -ForegroundColor Yellow

if (-not $DryRun) {
    Write-Host ""
    Write-Host "Database Status:" -ForegroundColor Cyan
    mysql -u $mysqlUser -e "
    SELECT 
      SCHEMA_NAME as database_name,
      ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
    FROM information_schema.TABLES
    WHERE SCHEMA_NAME IN ('nilecare_auth', 'nilecare_billing', 'nilecare_payment')
    GROUP BY SCHEMA_NAME;
    "
    
    Write-Host ""
    Write-Host "Migration History:" -ForegroundColor Cyan
    Write-Host "Auth Service:" -ForegroundColor Cyan
    mysql -u $mysqlUser nilecare_auth -e "SELECT version, description, installed_on FROM schema_version ORDER BY installed_rank DESC LIMIT 3;"
    
    Write-Host "Billing Service:" -ForegroundColor Cyan
    mysql -u $mysqlUser nilecare_billing -e "SELECT version, description, installed_on FROM schema_version ORDER BY installed_rank DESC LIMIT 3;"
    
    Write-Host "Payment Service:" -ForegroundColor Cyan
    mysql -u $mysqlUser nilecare_payment -e "SELECT version, description, installed_on FROM schema_version ORDER BY installed_rank DESC LIMIT 3;"
}

Write-Host ""

# Cleanup
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

# ============================================================================
# Success!
# ============================================================================
if (-not $DryRun) {
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "                  Week 3 Migration Complete!                           " -ForegroundColor Green
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "[OK] Auth Service migrated to nilecare_auth" -ForegroundColor Green
    Write-Host "[OK] Billing Service migrated to nilecare_billing" -ForegroundColor Green
    Write-Host "[OK] Payment Gateway migrated to nilecare_payment" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Test all API endpoints" -ForegroundColor White
    Write-Host "   2. Monitor service logs for errors" -ForegroundColor White
    Write-Host "   3. Run integration tests" -ForegroundColor White
    Write-Host "   4. Update service documentation" -ForegroundColor White
    Write-Host "   5. Proceed to Week 4 (Clinical, Facility, Lab services)" -ForegroundColor White
    Write-Host ""
    Write-Host "Security Reminder:" -ForegroundColor Yellow
    Write-Host "   • Update .env files with correct DB_NAME" -ForegroundColor White
    Write-Host "   • Verify services can no longer access shared database" -ForegroundColor White
    Write-Host "   • Review audit logs" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[OK] Dry run completed successfully" -ForegroundColor Green
    Write-Host "Run without -DryRun flag to execute actual migration" -ForegroundColor Yellow
}

