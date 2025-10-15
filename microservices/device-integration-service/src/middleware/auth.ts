/**
 * Authentication Middleware
 * Validates JWT tokens and service API keys
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { config } from '../config/env';
import logger from '../utils/logger';
import { AuthUser } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authenticate requests using JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication in development if bypass flag is set
    if (config.DEV_BYPASS_AUTH && config.NODE_ENV === 'development') {
      req.user = {
        userId: 'dev-user-001',
        username: 'devuser',
        email: 'dev@nilecare.local',
        roles: ['admin', 'clinician'],
        tenantId: 'dev-tenant-001',
      };
      return next();
    }

    // Check for service-to-service API key
    const serviceApiKey = req.headers['x-service-api-key'] as string;
    if (serviceApiKey === config.SERVICE_API_KEY) {
      // Service-to-service communication
      req.user = {
        userId: 'system',
        username: 'system',
        email: 'system@nilecare.local',
        roles: ['system'],
        tenantId: req.headers['x-tenant-id'] as string || 'system',
      };
      return next();
    }

    // Get JWT token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7);

    // Verify token with Authentication Service
    try {
      const response = await axios.post(
        `${config.AUTH_SERVICE_URL}/api/v1/auth/verify`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-service-name': config.SERVICE_NAME,
          },
          timeout: 5000,
        }
      );

      if (!response.data.valid) {
        throw new AuthenticationError('Invalid authentication token');
      }

      req.user = {
        userId: response.data.user.userId || response.data.user.user_id,
        username: response.data.user.username,
        email: response.data.user.email,
        roles: response.data.user.roles || [],
        tenantId: response.data.user.tenantId || response.data.user.tenant_id,
        facilityId: response.data.user.facilityId || response.data.user.facility_id,
      };

      next();
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new AuthenticationError('Invalid or expired token');
      }
      
      // Fallback to local JWT verification if auth service is down
      logger.warn('Auth service unavailable, falling back to local verification');
      
      try {
        const decoded: any = jwt.verify(token, config.JWT_SECRET);
        req.user = {
          userId: decoded.userId || decoded.sub,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles || [],
          tenantId: decoded.tenantId,
          facilityId: decoded.facilityId,
        };
        next();
      } catch (jwtError) {
        throw new AuthenticationError('Token verification failed');
      }
    }
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    } else {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication service error',
        code: 'AUTH_ERROR',
      });
    }
  }
};

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const hasRole = allowedRoles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};

/**
 * Ensure user belongs to the same tenant as the resource
 */
export const ensureTenantAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const resourceTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

  if (resourceTenantId && resourceTenantId !== req.user.tenantId) {
    // Allow system/admin users to access all tenants
    if (!req.user.roles.includes('system') && !req.user.roles.includes('admin')) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this tenant',
        code: 'TENANT_ACCESS_DENIED',
      });
      return;
    }
  }

  next();
};

export default {
  authenticate,
  authorize,
  ensureTenantAccess,
};

