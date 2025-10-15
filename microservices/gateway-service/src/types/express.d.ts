/**
 * Type definitions for Express with custom properties
 */

import { JwtPayload } from '@shared/middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      id?: string;
    }
  }
}

export {};

