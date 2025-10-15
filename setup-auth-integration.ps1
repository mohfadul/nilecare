# ═══════════════════════════════════════════════════════════════════════════
# NileCare Authentication Integration Setup Script (PowerShell)
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  NileCare Authentication Integration Setup" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Generate API keys
Write-Host "Generating secure API keys..." -ForegroundColor Yellow
$APPOINTMENT_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$BUSINESS_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$PAYMENT_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$MAIN_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$CLINICAL_KEY = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Write-Host "✓ Generated 5 unique API keys" -ForegroundColor Green
Write-Host ""

# Create Auth Service .env
Write-Host "Configuring Auth Service..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7020

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT Secrets (change in production!)
JWT_SECRET=nilecare-jwt-secret-change-in-production-min-32-characters-required
JWT_REFRESH_SECRET=nilecare-refresh-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=nilecare-session-secret-change-in-production-min-32-chars
MFA_ENCRYPTION_KEY=nilecare-mfa-encryption-key-change-in-production-64-chars

# Service API Keys
SERVICE_API_KEYS=$APPOINTMENT_KEY,$BUSINESS_KEY,$PAYMENT_KEY,$MAIN_KEY,$CLINICAL_KEY

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\auth-service\.env" -Encoding UTF8

Write-Host "✓ Auth Service configured" -ForegroundColor Green

# Create Appointment Service .env
Write-Host "Configuring Appointment Service..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$APPOINTMENT_KEY

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001

# Logging
LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\appointment-service\.env" -Encoding UTF8

Write-Host "✓ Appointment Service configured" -ForegroundColor Green

# Create Business Service .env
Write-Host "Configuring Business Service..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$BUSINESS_KEY

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173

# Multi-tenancy
MULTI_TENANT_ENABLED=false
DEFAULT_ORGANIZATION_ID=default-org

# Logging
LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\business\.env" -Encoding UTF8

Write-Host "✓ Business Service configured" -ForegroundColor Green

# Create Payment Gateway .env
Write-Host "Configuring Payment Gateway Service..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$PAYMENT_KEY

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

# Logging
LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\payment-gateway-service\.env" -Encoding UTF8

Write-Host "✓ Payment Gateway Service configured" -ForegroundColor Green

# Create Main NileCare .env
Write-Host "Configuring Main NileCare Service..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$MAIN_KEY

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Service URLs
PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\main-nilecare\.env" -Encoding UTF8

Write-Host "✓ Main NileCare Service configured" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "✓ Configuration Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "Services configured:"
Write-Host "  ✓ auth-service (port 7020)"
Write-Host "  ✓ appointment-service (port 7040)"
Write-Host "  ✓ business-service (port 7010)"
Write-Host "  ✓ payment-gateway-service (port 7030)"
Write-Host "  ✓ main-nilecare-service (port 7000)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start Auth Service first:"
Write-Host "     cd microservices\auth-service"
Write-Host "     npm run dev"
Write-Host ""
Write-Host "  2. Start other services in new terminals"
Write-Host ""
Write-Host "  3. Test integration:"
Write-Host "     Invoke-WebRequest http://localhost:7020/health"
Write-Host ""
Write-Host "🎉 Ready to start services!" -ForegroundColor Green

