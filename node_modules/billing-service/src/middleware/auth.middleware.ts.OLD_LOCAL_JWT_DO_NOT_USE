/**
 * Authentication Middleware
 * Delegates all authentication to Auth Service (centralized)
 * 
 * ⚠️ IMPORTANT: This service does NOT verify JWT tokens locally
 * All token validation is done via Auth Service API
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../config/logger.config';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const AUTH_SERVICE_API_KEY = process.env.AUTH_SERVICE_API_KEY;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        role: string;
        permissions?: string[];
        organizationId?: string;
        facilityId?: string;
      };
    }
  }
}

/**
 * Authenticate user via Auth Service
 * Validates JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Provide: Authorization: Bearer <token>'
        }
      });
      return;
    }

    const token = authHeader.substring(7);

    // Validate token with Auth Service
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/v1/integration/validate-token`,
      { token },
      {
        headers: {
          'X-Service-Key': AUTH_SERVICE_API_KEY
        },
        timeout: 5000
      }
    );

    if (!response.data.valid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: response.data.reason || 'Invalid or expired token'
        }
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: response.data.user.id,
      email: response.data.user.email,
      username: response.data.user.username,
      role: response.data.user.role,
      permissions: response.data.permissions || [],
      organizationId: response.data.user.organizationId,
      facilityId: response.data.user.facilityId
    };

    next();

  } catch (error: any) {
    logger.error('Authentication error:', {
      error: error.message,
      path: req.path,
      method: req.method
    });

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: {
          code: 'AUTH_SERVICE_UNAVAILABLE',
          message: 'Authentication service is unavailable'
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed'
      }
    });
  }
}

/**
 * Require specific permission
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      // Check permission with Auth Service
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/api/v1/integration/verify-permission`,
        {
          userId: user.id,
          resource,
          action
        },
        {
          headers: {
            'X-Service-Key': AUTH_SERVICE_API_KEY
          },
          timeout: 5000
        }
      );

      if (!response.data.allowed) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            required: `${resource}:${action}`
          }
        });
        return;
      }

      next();

    } catch (error: any) {
      logger.error('Permission check error:', {
        error: error.message,
        userId: req.user?.id,
        resource,
        action
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Permission verification failed'
        }
      });
    }
  };
}

/**
 * Require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role permissions',
          required: allowedRoles,
          current: user.role
        }
      });
      return;
    }

    next();
  };
}

export default authenticate;

