# ============================================================================
# Phase 1 Migration Automation Script
# Completes all remaining service migrations
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Phase 1: Completing Remaining Service Migrations" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Define services and their API keys
$services = @(
    @{name="payment-gateway-service"; port=7030; key="f3045670a1704147a20cb0767f612f271d5ced6374a39ecd5c8d482d669251e5"},
    @{name="medication-service"; port=4003; key="2e887b36df9b8789c4946f9cb8d82a03f7e917b19b0f2fa6603e1659235142a1"},
    @{name="lab-service"; port=4005; key="7bf48164d314d4304abe806f94fcc1c031197aff3ecfcbf6ddde0bdc481daf99"},
    @{name="inventory-service"; port=5004; key="beb918b8b56e9c4501dcba579fbf7fd3af2686db2cf8fd31831064e7da1f4cf1"},
    @{name="facility-service"; port=5001; key="4319ef7f4810c49f8757b94cd879a023a16bea8dc75816d8f759e05dd0dff932"},
    @{name="fhir-service"; port=6001; key="8c768900cb8aac54aa0a4de7094d8f90860ea17d137d1a970fd38148bf43caf4"},
    @{name="hl7-service"; port=6002; key="c0704a2da0de18d4487bfceb7f006199386dd55f2d9bb973a7954d59c257c5e7"}
)

$authMiddlewareTemplate = @"
/**
 * ✅ PHASE 1 REFACTORING: Centralized Authentication
 * Migration Date: October 14, 2025
 */
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

// Initialize centralized auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || '{{SERVICE_NAME}}',
  timeout: 5000,
});

// Create middleware functions
const { authenticate, optionalAuth, requireRole, requirePermission } = createAuthMiddleware(authClient);

// Export for use in routes
export { authenticate, optionalAuth, requireRole, requirePermission, authClient };
export default { authenticate, optionalAuth, requireRole, requirePermission, authClient };
"@

$envTemplate = @"
# ============================================================================
# {{SERVICE_NAME}} - Environment Variables
# ✅ PHASE 1 REFACTORING APPLIED - October 14, 2025
# ============================================================================

NODE_ENV=development
PORT={{PORT}}
SERVICE_NAME={{SERVICE_NAME}}

# ============================================================================
# ✅ CENTRALIZED AUTHENTICATION
# JWT_SECRET REMOVED - Auth Service handles all token validation
# ============================================================================
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY={{API_KEY}}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# ============================================================================
# REDIS (if applicable)
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info
LOG_AUTH=true

# ❌ CRITICAL: JWT_SECRET REMOVED (Auth Service only!)
"@

Write-Host "Creating auth middleware files for remaining services..." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $services) {
    $serviceName = $service.name
    $servicePort = $service.port
    $apiKey = $service.key
    
    Write-Host "Processing: $serviceName (Port $servicePort)..." -ForegroundColor Cyan
    
    # Create auth middleware
    $authMiddleware = $authMiddlewareTemplate -replace '{{SERVICE_NAME}}', $serviceName
    $authPath = "microservices\$serviceName\src\middleware\auth.ts.phase1"
    
    try {
        # Backup existing if it exists
        $existingAuth = "microservices\$serviceName\src\middleware\auth.ts"
        if (Test-Path $existingAuth) {
            $backupPath = "$existingAuth.backup-phase1"
            if (!(Test-Path $backupPath)) {
                Copy-Item $existingAuth $backupPath
                Write-Host "  ✅ Backed up existing auth.ts" -ForegroundColor Green
            }
        }
        
        # Create new auth middleware
        Set-Content -Path $authPath -Value $authMiddleware
        Write-Host "  ✅ Created auth.ts.phase1" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to create auth middleware: $_" -ForegroundColor Red
    }
    
    # Create .env template
    $envContent = $envTemplate -replace '{{SERVICE_NAME}}', $serviceName
    $envContent = $envContent -replace '{{PORT}}', $servicePort
    $envContent = $envContent -replace '{{API_KEY}}', $apiKey
    $envPath = "microservices\$serviceName\.env.phase1"
    
    try {
        Set-Content -Path $envPath -Value $envContent
        Write-Host "  ✅ Created .env.phase1" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to create .env template: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Phase 1 Migration Files Created!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Review generated files:" -ForegroundColor White
Write-Host "   - microservices\*\.env.phase1" -ForegroundColor Gray
Write-Host "   - microservices\*\src\middleware\auth.ts.phase1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Apply changes (AFTER BACKING UP!):" -ForegroundColor White
Write-Host "   .\apply-phase1-configs.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test all services:" -ForegroundColor White
Write-Host "   .\test-phase1-migration.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  WARNING: Review files before applying!" -ForegroundColor Yellow
Write-Host ""

