/**
 * Shared Authentication Middleware (Local Copy)
 * 
 * Central authentication and authorization middleware for NileCare microservices.
 * This middleware validates JWT tokens issued by the Auth Service and enforces RBAC.
 * 
 * NOTE: This is a local copy from ../../shared/middleware/auth.ts for module resolution
 */

/**
 * ✅ PHASE 1 REFACTORING: Centralized Authentication
 * Migration Date: October 14, 2025
 */
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

// Initialize centralized auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || 'appointment-service',
  timeout: 5000,
});

// Create middleware functions
const { authenticate, optionalAuth, requireRole, requirePermission } = createAuthMiddleware(authClient);

// Export for use in routes
export { authenticate, optionalAuth, requireRole, requirePermission, authClient };
export default { authenticate, optionalAuth, requireRole, requirePermission, authClient };


