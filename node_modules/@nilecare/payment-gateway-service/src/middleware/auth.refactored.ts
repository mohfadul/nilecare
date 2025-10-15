/**
 * Payment Gateway Authentication Middleware
 * ✅ Phase 1: Centralized authentication via auth-service
 * 
 * This file replaces payment-auth.guard.ts
 * All authentication is now delegated to the central auth service
 */

import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware, AuthServiceClient } from '@nilecare/auth-client';

// Initialize auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL!,
  apiKey: process.env.AUTH_SERVICE_API_KEY!,
  serviceName: 'payment-gateway-service'
});

/**
 * Basic authentication (any authenticated user)
 */
export const requireAuth = createAuthMiddleware({
  permissions: ['payment:read']
});

/**
 * Payment write permissions (initiate, create)
 */
export const requirePaymentWrite = createAuthMiddleware({
  permissions: ['payment:write', 'payment:initiate']
});

/**
 * Finance role (verify, reconcile)
 */
export const requireFinance = createAuthMiddleware({
  permissions: ['finance:verify', 'finance:reconcile', 'payment:verify']
});

/**
 * Admin role (refunds, cancellations)
 */
export const requireAdmin = createAuthMiddleware({
  permissions: ['admin:refund', 'admin:cancel', 'payment:refund']
});

/**
 * Manual permission check (for complex scenarios)
 */
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'Authentication required'
          }
        });
      }

      const hasPermission = await authClient.checkPermission(token, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Missing required permission: ${permission}`
          }
        });
      }

      next();
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  };
};

// Export auth client for direct use if needed
export { authClient };

