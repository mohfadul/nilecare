# =============================================================================
# NileCare Auth Service - MySQL Configuration Verification Script
# =============================================================================
# This script verifies that the MySQL configuration is correct and secure
# =============================================================================

Write-Host "`n🔍 NileCare MySQL Configuration Verification`n" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# Check 1: .env file exists
Write-Host "1. Checking .env file..." -NoNewline
if (Test-Path ".env") {
    Write-Host " ✅" -ForegroundColor Green
    
    # Load .env variables
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $envVars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
    
    # Check 2: Required database variables
    Write-Host "2. Checking database variables..." -NoNewline
    $requiredDbVars = @('DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_ROOT_PASSWORD')
    $missingVars = @()
    foreach ($var in $requiredDbVars) {
        if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
            $missingVars += $var
        }
    }
    if ($missingVars.Count -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   Missing variables: $($missingVars -join ', ')" -ForegroundColor Yellow
        $errors++
    }
    
    # Check 3: DB_USER is not root
    Write-Host "3. Checking DB_USER is not root..." -NoNewline
    if ($envVars['DB_USER'] -ne 'root') {
        Write-Host " ✅ (using: $($envVars['DB_USER']))" -ForegroundColor Green
    } else {
        Write-Host " ❌ MYSQL_USER cannot be 'root'" -ForegroundColor Red
        $errors++
    }
    
    # Check 4: Separate passwords
    Write-Host "4. Checking separate root and app passwords..." -NoNewline
    if ($envVars['DB_PASSWORD'] -ne $envVars['DB_ROOT_PASSWORD']) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️  Root and app passwords are the same" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check 5: Required JWT secrets
    Write-Host "5. Checking JWT secrets..." -NoNewline
    $requiredSecrets = @('JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET', 'MFA_ENCRYPTION_KEY')
    $missingSecrets = @()
    foreach ($secret in $requiredSecrets) {
        if (-not $envVars.ContainsKey($secret) -or [string]::IsNullOrWhiteSpace($envVars[$secret])) {
            $missingSecrets += $secret
        }
    }
    if ($missingSecrets.Count -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   Missing secrets: $($missingSecrets -join ', ')" -ForegroundColor Yellow
        $errors++
    }
    
    # Check 6: Secret strength
    Write-Host "6. Checking secret strength..." -NoNewline
    $weakSecrets = @()
    foreach ($secret in $requiredSecrets) {
        if ($envVars.ContainsKey($secret)) {
            $value = $envVars[$secret]
            if ($value.Length -lt 32) {
                $weakSecrets += "$secret ($($value.Length) chars, min 32)"
            }
            if ($value -match 'CHANGE|EXAMPLE|TEST|DEFAULT') {
                $weakSecrets += "$secret (contains placeholder text)"
            }
        }
    }
    if ($weakSecrets.Count -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️" -ForegroundColor Yellow
        foreach ($weak in $weakSecrets) {
            Write-Host "   $weak" -ForegroundColor Yellow
        }
        $warnings++
    }
    
} else {
    Write-Host " ❌ .env file not found" -ForegroundColor Red
    $errors++
}

# Check 7: docker-compose.yml syntax
Write-Host "7. Checking docker-compose.yml syntax..." -NoNewline
try {
    $null = docker-compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Invalid syntax" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host " ⚠️  Docker Compose not available" -ForegroundColor Yellow
    $warnings++
}

# Check 8: Port 3306 availability
Write-Host "8. Checking port 3306 availability..." -NoNewline
$portInUse = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet 2>$null
if ($portInUse) {
    Write-Host " ⚠️  Port 3306 is in use (local MySQL running?)" -ForegroundColor Yellow
    Write-Host "   To fix: Run 'net stop mysql' or change Docker port to 3307" -ForegroundColor Yellow
    $warnings++
} else {
    Write-Host " ✅" -ForegroundColor Green
}

# Check 9: Required files exist
Write-Host "9. Checking required files..." -NoNewline
$requiredFiles = @(
    'docker-compose.yml',
    'Dockerfile',
    'create-mysql-tables.sql',
    'package.json'
)
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}
if ($missingFiles.Count -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
    Write-Host "   Missing files: $($missingFiles -join ', ')" -ForegroundColor Yellow
    $errors++
}

# Check 10: Documentation exists
Write-Host "10. Checking documentation..." -NoNewline
$docFiles = @(
    'DATABASE_SETUP_GUIDE.md',
    'MYSQL_CONFIGURATION_FIXED.md',
    'CONFIGURATION_COMPLETE_SUMMARY.md'
)
$existingDocs = 0
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        $existingDocs++
    }
}
if ($existingDocs -eq $docFiles.Count) {
    $fileCount = "$existingDocs/$($docFiles.Count) files"
    Write-Host " OK ($fileCount)" -ForegroundColor Green
} else {
    $fileCount = "$existingDocs/$($docFiles.Count) files found"
    Write-Host " WARNING ($fileCount)" -ForegroundColor Yellow
    $warnings++
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "`n✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "`nYour MySQL configuration is secure and ready to use." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. docker-compose up -d" -ForegroundColor White
    Write-Host "  2. docker-compose logs -f" -ForegroundColor White
} elseif ($errors -eq 0) {
    Write-Host "`n⚠️  PASSED WITH $warnings WARNING(S)" -ForegroundColor Yellow
    Write-Host "`nYour configuration is functional but has some warnings." -ForegroundColor Yellow
    Write-Host "Review the warnings above and fix them if needed." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ FAILED WITH $errors ERROR(S) AND $warnings WARNING(S)" -ForegroundColor Red
    Write-Host "`nPlease fix the errors above before starting services." -ForegroundColor Red
    Write-Host "`nFor help, see:" -ForegroundColor Cyan
    Write-Host "  - DATABASE_SETUP_GUIDE.md" -ForegroundColor White
    Write-Host "  - CONFIGURATION_COMPLETE_SUMMARY.md" -ForegroundColor White
}

Write-Host "`n"

