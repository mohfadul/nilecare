/**
 * Finance Role Guard
 * Ensures user has finance/accountant role
 */

import { Request, Response, NextFunction } from 'express';

const FINANCE_ROLES = [
  'super_admin',
  'hospital_admin',
  'accountant',
  'finance_manager',
  'billing_staff'
];

/**
 * Finance role guard middleware
 */
export const financeRoleGuard = (req: Request, res: Response, next: NextFunction): void => {
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

    // Check if user has finance role
    if (!FINANCE_ROLES.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Finance role required to access this resource',
          requiredRoles: FINANCE_ROLES
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

export default financeRoleGuard;

