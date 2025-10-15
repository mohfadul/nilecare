/**
 * ✅ PHASE 1 REFACTORING: Centralized Authentication
 * 
 * CRITICAL SECURITY CHANGE:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * OLD (❌ INSECURE):
 *   - Had JWT_SECRET in .env
 *   - Verified tokens locally with jwt.verify()
 *   - Port was 3006 (not matching docs: 7000)
 * 
 * NEW (✅ SECURE):
 *   - NO JWT_SECRET in this service!
 *   - Delegates ALL authentication to Auth Service
 *   - Port fixed to 7000 (as per documentation)
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Migration Date: October 14, 2025
 * Package: @nilecare/auth-client v1.0.0
 */

// Initialize centralized auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || 'main-nilecare',
  timeout: 5000,
});

// Create middleware functions using the auth client
const { authenticate, optionalAuth, requireRole, requirePermission } = createAuthMiddleware(authClient);

// Export for use in routes
export { 
  authenticate, 
  optionalAuth,
  requireRole, 
  requirePermission, 
  authClient 
};

// Export as default for compatibility with existing imports
export default {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  authClient
};

