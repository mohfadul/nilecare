/**
 * ⚠️ DEPRECATED: Payment Auth Guard
 * 
 * This file is DEPRECATED and should NOT be used.
 * Use shared authentication middleware instead.
 * 
 * @deprecated Since 2025-10-12
 * @see shared/middleware/auth.ts
 * 
 * Migration:
 *   OLD: import { authGuard } from '../guards/payment-auth.guard';
 *   NEW: import { authenticate } from '../../../shared/middleware/auth';
 * 
 *   OLD: router.post('/endpoint', authGuard, handler);
 *   NEW: router.post('/endpoint', authenticate, handler);
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
 * This guard is kept for backwards compatibility only
 */
export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  res.status(410).json({
    success: false,
    error: {
      code: 'DEPRECATED_ENDPOINT',
      message: 'This authentication method is deprecated',
      migration: 'Please use shared/middleware/auth.ts authenticate function',
      documentation: 'See MIGRATE_SERVICES_TO_SHARED_AUTH.md'
    }
  });
};

export default authGuard;

