# Quick Authentication Test
Write-Host "`n🧪 Testing Authentication...`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Auth Service Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://localhost:7020/health" -TimeoutSec 3
    Write-Host " ✅ Running" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not running" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "2. Login Test..." -NoNewline
try {
    $loginBody = '{"email":"doctor@nilecare.sd","password":"TestPass123!"}'
    $response = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/auth/login" `
        -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($response.success -and $response.data.token) {
        $token = $response.data.token
        Write-Host " ✅ Success" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.email) | Role: $($response.data.user.role)" -ForegroundColor Gray
    }
} catch {
    Write-Host " ❌ Failed" -ForegroundColor Red
    exit 1
}

# Test 3: Token Validation
Write-Host "3. Token Validation..." -NoNewline
try {
    $validateBody = "{`"token`":`"$token`"}"
    $valid = Invoke-RestMethod -Uri "http://localhost:7020/api/v1/integration/validate-token" `
        -Method Post -Body $validateBody -ContentType "application/json" `
        -Headers @{"X-API-Key"="4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8"}
    
    if ($valid.valid) {
        Write-Host " ✅ Valid" -ForegroundColor Green
    } else {
        Write-Host " ❌ Invalid" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ Error" -ForegroundColor Red
}

Write-Host "`n✅ Authentication system working!`n" -ForegroundColor Green

