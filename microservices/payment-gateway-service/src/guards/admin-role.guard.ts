/**
 * Admin Role Guard
 * Ensures user has admin role
 */

import { Request, Response, NextFunction } from 'express';

const ADMIN_ROLES = [
  'super_admin',
  'hospital_admin',
  'dental_admin'
];

/**
 * Admin role guard middleware
 */
export const adminRoleGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = (req as any).user;

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

    // Check if user has admin role
    if (!ADMIN_ROLES.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin role required to access this resource',
          requiredRoles: ADMIN_ROLES
        }
      });
      return;
    }

    next();

  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Authorization check failed'
      }
    });
  }
};

export default adminRoleGuard;

