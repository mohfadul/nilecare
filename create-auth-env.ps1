# ═══════════════════════════════════════════════════════════════════════════
# Create Auth Service .env File
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "Creating Auth Service .env file..." -ForegroundColor Blue

$envContent = @"
# ══════════════════════════════════════════════════════════════════════════════
# NILECARE AUTH SERVICE - ENVIRONMENT CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════
# Version: 2.0.0
# Last Updated: October 14, 2025
# Status: Development Configuration with Authentication Integration
# ══════════════════════════════════════════════════════════════════════════════

NODE_ENV=development
PORT=7020

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DATABASE (MySQL 8.0)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JWT SECRETS (CRITICAL - ONLY IN AUTH SERVICE)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JWT_SECRET=nilecare-jwt-secret-change-in-production-minimum-32-characters-required-for-security
JWT_REFRESH_SECRET=nilecare-refresh-secret-change-in-production-different-from-jwt-secret-32chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SESSION & MFA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION_SECRET=nilecare-session-secret-change-in-production-minimum-32-characters-required
MFA_ENCRYPTION_KEY=nilecare-mfa-encryption-key-change-in-production-64-characters-required

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SERVICE-TO-SERVICE API KEYS (CRITICAL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICE_API_KEYS=29188e760a4166559cf35f8f60df08fdec190055397bace0e776ec803821230f,93287584b9eba43a4e231750d63342723dd09b97a6fcad5bfbe364516e2971ec,913f40c10a524e0bc8afb2edf663c4e2c84e3b74ebe12469ce64c9e233df706a,4b2f0c60f3f99d6aa50542eee14dc94c50a552ee5baf148e7978453a5380bc16,008bcfc9aba6f9b957ec54ba421bf2f1546f314155bbf82eb4fb092bbb3d4e4e

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REDIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CORS & CLIENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT_URL=http://localhost:5173

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EMAIL SERVICE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=nilecare@nilecare.sd

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOGGING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOG_LEVEL=info
LOG_AUTH=true

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY SETTINGS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BCRYPT_ROUNDS=12
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MS=1800000

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RATE LIMITING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW_MS=300000
"@

$envContent | Out-File -FilePath "microservices\auth-service\.env" -Encoding UTF8 -NoNewline

Write-Host "✓ Created microservices\auth-service\.env" -ForegroundColor Green
Write-Host ""
Write-Host "The file includes:" -ForegroundColor Yellow
Write-Host "  ✓ All 5 SERVICE_API_KEYS configured" -ForegroundColor Green
Write-Host "  ✓ Development database settings" -ForegroundColor Green
Write-Host "  ✓ JWT secrets (change in production!)" -ForegroundColor Green
Write-Host "  ✓ Security and rate limiting configured" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Start the Auth Service" -ForegroundColor Cyan
Write-Host "  cd microservices\auth-service" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White

