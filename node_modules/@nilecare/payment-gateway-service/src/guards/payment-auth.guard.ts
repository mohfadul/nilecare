/**
 * Payment Authentication Guard
 * Verifies JWT token and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  facilityId?: string;
}

/**
 * @deprecated Use shared authenticate middleware instead
 * @see shared/middleware/auth.ts
 * 
 * This guard is DEPRECATED. Import from shared middleware:
 * import { authenticate } from '../../../shared/middleware/auth';
 */
export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication token is required'
        }
      });
      return;
    }

    // Extract token
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token format is invalid. Use: Authorization: Bearer <token>'
        }
      });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user to request
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      facilityId: decoded.facilityId
    };

    next();

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authentication token is invalid'
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

export default authGuard;

