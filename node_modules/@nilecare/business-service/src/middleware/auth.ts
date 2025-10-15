/**
 * ✅ PHASE 1 REFACTORING: Centralized Authentication
 * 
 * CRITICAL SECURITY CHANGE:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * OLD (❌ INSECURE):
 *   - Had JWT_SECRET in .env
 *   - Verified tokens locally with jwt.verify()
 *   - No centralized audit trail
 * 
 * NEW (✅ SECURE):
 *   - NO JWT_SECRET in this service!
 *   - Delegates ALL authentication to Auth Service
 *   - Complete audit trail in auth service
 *   - Easy token rotation
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Migration Date: October 14, 2025
 * Package: @nilecare/auth-client v1.0.0
 */

import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

// Initialize centralized auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || 'business-service',
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
