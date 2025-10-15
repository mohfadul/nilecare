/**
 * Payment Authentication Guard
 * Verifies JWT token and attaches user to request
 */
import { Request, Response, NextFunction } from 'express';
export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    facilityId?: string;
}
/**
 * Authentication guard middleware
 */
export declare const authGuard: (req: Request, res: Response, next: NextFunction) => void;
export default authGuard;
//# sourceMappingURL=payment-auth.guard.d.ts.map