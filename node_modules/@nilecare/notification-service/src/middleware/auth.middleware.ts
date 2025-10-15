/**
 * Authentication Middleware
 * Delegates authentication to Auth Service (centralized)
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const AUTH_SERVICE_API_KEY = process.env.AUTH_SERVICE_API_KEY;
const SERVICE_NAME = process.env.SERVICE_NAME || 'notification-service';

/**
 * Main authentication middleware
 * Delegates token validation to Auth Service
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
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
          'X-Service-Key': AUTH_SERVICE_API_KEY,
          'X-Service-Name': SERVICE_NAME,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    if (!response.data.valid || !response.data.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: response.data.reason || 'Invalid token'
        }
      });
      return;
    }

    // Attach user to request
    req.user = {
      userId: response.data.user.id,
      email: response.data.user.email,
      role: response.data.user.role,
      organizationId: response.data.user.organizationId,
      facilityId: response.data.user.facilityId,
      permissions: response.data.user.permissions || [],
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error', {
      error: error.message,
      path: req.path,
    });

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: {
          code: 'AUTH_SERVICE_UNAVAILABLE',
          message: 'Authentication service unavailable'
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
 * Require specific role(s)
 */
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role(s): ${allowedRoles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
}

export default authenticate;

