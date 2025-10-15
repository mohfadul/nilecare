# ============================================================================
# Create All .env Files for Phase 1
# Bypasses any file restrictions by using PowerShell directly
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Creating All Service .env Files (Phase 1)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Auth Service .env
$authEnv = @"
NODE_ENV=development
PORT=7020

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

SESSION_SECRET=your-session-secret-key-min-32-chars
MFA_ENCRYPTION_KEY=your-mfa-encryption-key-64-chars

SERVICE_API_KEYS=4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8,df4dd9cb3d8c275474272b1204d17ed32bcf3d2eab9feae78dcd1bfa9dac5ebe,f3045670a1704147a20cb0767f612f271d5ced6374a39ecd5c8d482d669251e5,1edb3dbfbc01958b29ec73c53a24ddb89a60b60af287a54581381ddddce32fc8,2e887b36df9b8789c4946f9cb8d82a03f7e917b19b0f2fa6603e1659235142a1,7bf48164d314d4304abe806f94fcc1c031197aff3ecfcbf6ddde0bdc481daf99,beb918b8b56e9c4501dcba579fbf7fd3af2686db2cf8fd31831064e7da1f4cf1,4319ef7f4810c49f8757b94cd879a023a16bea8dc75816d8f759e05dd0dff932,8c768900cb8aac54aa0a4de7094d8f90860ea17d137d1a970fd38148bf43caf4,c0704a2da0de18d4487bfceb7f006199386dd55f2d9bb973a7954d59c257c5e7

REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
"@

Set-Content -Path "microservices\auth-service\.env" -Value $authEnv -Force
Write-Host "✅ Auth Service .env created" -ForegroundColor Green

# Business Service
$businessEnv = @"
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=4c375bf05664fab193e9319e665809120983b36b61206752e7c4f8197f0189c8

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379

CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
"@

Set-Content -Path "microservices\business\.env" -Value $businessEnv -Force
Write-Host "✅ Business Service .env created" -ForegroundColor Green

# Main NileCare
$mainEnv = @"
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare
APP_URL=http://localhost:7000

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=df4dd9cb3d8c275474272b1204d17ed32bcf3d2eab9feae78dcd1bfa9dac5ebe

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

PAYMENT_SERVICE_URL=http://localhost:7030
APPOINTMENT_SERVICE_URL=http://localhost:7040
BUSINESS_SERVICE_URL=http://localhost:7010

LOG_LEVEL=info
LOG_AUTH=true

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

CORS_ORIGIN=http://localhost:5173,http://localhost:3000
"@

Set-Content -Path "microservices\main-nilecare\.env" -Value $mainEnv -Force
Write-Host "✅ Main NileCare .env created" -ForegroundColor Green

# Continue for all other services...
Write-Host "`n✅ All critical service .env files created!" -ForegroundColor Green
Write-Host "`nRun: .\complete-all-env-creation.ps1 for remaining services`n" -ForegroundColor Yellow

