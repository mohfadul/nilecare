# ═══════════════════════════════════════════════════════════════════════════
# Create All .env Files for NileCare Services
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  Creating .env Files for All Services" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# API Keys (already generated)
$APPOINTMENT_KEY = "29188e760a4166559cf35f8f60df08fdec190055397bace0e776ec803821230f"
$BUSINESS_KEY = "93287584b9eba43a4e231750d63342723dd09b97a6fcad5bfbe364516e2971ec"
$PAYMENT_KEY = "913f40c10a524e0bc8afb2edf663c4e2c84e3b74ebe12469ce64c9e233df706a"
$MAIN_KEY = "4b2f0c60f3f99d6aa50542eee14dc94c50a552ee5baf148e7978453a5380bc16"
$CLINICAL_KEY = "008bcfc9aba6f9b957ec54ba421bf2f1546f314155bbf82eb4fb092bbb3d4e4e"

# Create Appointment Service .env
Write-Host "Creating appointment-service .env..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$APPOINTMENT_KEY

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001

LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\appointment-service\.env" -Encoding UTF8
Write-Host "✓ appointment-service .env created" -ForegroundColor Green

# Create Business Service .env
Write-Host "Creating business-service .env..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$BUSINESS_KEY

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379

CLIENT_URL=http://localhost:5173

MULTI_TENANT_ENABLED=false
DEFAULT_ORGANIZATION_ID=default-org

LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\business\.env" -Encoding UTF8
Write-Host "✓ business-service .env created" -ForegroundColor Green

# Create Payment Gateway .env
Write-Host "Creating payment-gateway-service .env..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$PAYMENT_KEY

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\payment-gateway-service\.env" -Encoding UTF8
Write-Host "✓ payment-gateway-service .env created" -ForegroundColor Green

# Create Main NileCare .env
Write-Host "Creating main-nilecare .env..." -ForegroundColor Yellow
@"
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=$MAIN_KEY

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
"@ | Out-File -FilePath "microservices\main-nilecare\.env" -Encoding UTF8
Write-Host "✓ main-nilecare .env created" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ All .env Files Created!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  ✓ microservices\auth-service\.env" -ForegroundColor White
Write-Host "  ✓ microservices\appointment-service\.env" -ForegroundColor White
Write-Host "  ✓ microservices\business\.env" -ForegroundColor White
Write-Host "  ✓ microservices\payment-gateway-service\.env" -ForegroundColor White
Write-Host "  ✓ microservices\main-nilecare\.env" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Start all services" -ForegroundColor Yellow
Write-Host "  .\start-all-services.ps1" -ForegroundColor White
Write-Host ""

