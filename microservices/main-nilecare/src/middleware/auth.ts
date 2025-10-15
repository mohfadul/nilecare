/**
 * Authentication Middleware for Main NileCare Orchestrator
 * Phase 2: Uses @nilecare/auth-client for centralized authentication
 */

import { Request, Response, NextFunction } from 'express';
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

// Initialize auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: 'main-nilecare',
  timeout: 5000
});

// Create middleware functions
const { authenticate, optionalAuth, requireRole, requirePermission } = createAuthMiddleware(authClient);

// Export middleware functions
export { authenticate, optionalAuth, requireRole, requirePermission };
export default authenticate;
