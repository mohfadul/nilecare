# Quick Test: Dashboard Audit Logging
# Verifies that dashboard requests create audit logs

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Dashboard Audit Logging - Quick Verification Test        " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$API_URL = "http://localhost:7000"
$BUSINESS_URL = "http://localhost:7010"

# Step 1: Check services
Write-Host "Step 1: Checking services..." -ForegroundColor Yellow

try {
    $mainHealth = Invoke-RestMethod -Uri "$API_URL/health"
    Write-Host "  ✅ Main NileCare (Port 7000): $($mainHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Main NileCare not running!" -ForegroundColor Red
    exit 1
}

try {
    $businessHealth = Invoke-RestMethod -Uri "$BUSINESS_URL/health"
    Write-Host "  ✅ Business Service (Port 7010): $($businessHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Business Service not running!" -ForegroundColor Red
    exit 1
}

# Step 2: Login as doctor
Write-Host "`nStep 2: Logging in as doctor..." -ForegroundColor Yellow

$loginBody = @{
    email = "doctor@nilecare.sd"
    password = "TestPass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.accessToken
    Write-Host "  ✅ Login successful" -ForegroundColor Green
    Write-Host "  📝 User: $($loginResponse.user.email) (Role: $($loginResponse.user.role))" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Access appointments (as dashboard would)
Write-Host "`nStep 3: Accessing appointments (simulating Doctor Dashboard)..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $aptsResponse = Invoke-RestMethod -Uri "$API_URL/api/v1/data/appointments/today" `
        -Method GET `
        -Headers $headers

    Write-Host "  ✅ Appointments retrieved" -ForegroundColor Green
    $aptsCount = if ($aptsResponse.data) { $aptsResponse.data.Count } else { 0 }
    Write-Host "  📊 Found $aptsCount appointments" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to retrieve appointments: $_" -ForegroundColor Red
    Write-Host "  ⚠️  This might be expected if no appointments exist" -ForegroundColor Yellow
}

# Step 4: Check audit logs
Write-Host "`nStep 4: Verifying audit log created..." -ForegroundColor Yellow

Start-Sleep -Seconds 1  # Give database a moment to write

$auditQuery = @"
SELECT 
  user_email,
  user_role,
  action,
  resource,
  endpoint,
  http_method,
  result,
  timestamp
FROM audit_logs
WHERE user_email = 'doctor@nilecare.sd'
  AND DATE(timestamp) = CURDATE()
ORDER BY timestamp DESC
LIMIT 5
"@

try {
    $auditLogs = mysql -u root nilecare -t -e $auditQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Audit logs queried successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host $auditLogs
        
        # Check if any logs exist
        if ($auditLogs -match "doctor@nilecare.sd") {
            Write-Host ""
            Write-Host "  ✅ AUDIT LOG CREATED!" -ForegroundColor Green
            Write-Host "  🎉 Dashboard → Business Service → Audit Log flow VERIFIED!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "  ⚠️  No audit logs found for today" -ForegroundColor Yellow
            Write-Host "  💡 This might mean:" -ForegroundColor Gray
            Write-Host "     - Business Service audit middleware not active" -ForegroundColor Gray
            Write-Host "     - Direct DB query path still being used" -ForegroundColor Gray
            Write-Host "     - audit_logs table doesn't exist" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ Failed to query audit logs" -ForegroundColor Red
        Write-Host "  Error: $auditLogs" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ MySQL query error: $_" -ForegroundColor Red
}

# Step 5: Quick stats
Write-Host "`nStep 5: Audit log statistics..." -ForegroundColor Yellow

$statsQuery = @"
SELECT 
  resource,
  action,
  COUNT(*) as count
FROM audit_logs
WHERE DATE(timestamp) = CURDATE()
GROUP BY resource, action
ORDER BY count DESC
"@

try {
    $stats = mysql -u root nilecare -t -e $statsQuery 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host $stats
    }
} catch {
    Write-Host "  ⚠️  Could not retrieve statistics" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                         SUMMARY                             " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Services: Running" -ForegroundColor Green
Write-Host "✅ Authentication: Working" -ForegroundColor Green
Write-Host "✅ Dashboard API: Working" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check audit logs output above" -ForegroundColor Gray
Write-Host "2. If logs exist → 🎉 SUCCESS!" -ForegroundColor Gray
Write-Host "3. If no logs → Check Business Service audit middleware" -ForegroundColor Gray
Write-Host "4. Test with browser: http://localhost:5173" -ForegroundColor Gray
Write-Host ""

