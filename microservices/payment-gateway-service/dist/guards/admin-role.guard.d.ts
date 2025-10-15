/**
 * Admin Role Guard
 * Ensures user has admin role
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Admin role guard middleware
 */
export declare const adminRoleGuard: (req: Request, res: Response, next: NextFunction) => void;
export default adminRoleGuard;
//# sourceMappingURL=admin-role.guard.d.ts.map