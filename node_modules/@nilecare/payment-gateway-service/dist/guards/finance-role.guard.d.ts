/**
 * Finance Role Guard
 * Ensures user has finance/accountant role
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Finance role guard middleware
 */
export declare const financeRoleGuard: (req: Request, res: Response, next: NextFunction) => void;
export default financeRoleGuard;
//# sourceMappingURL=finance-role.guard.d.ts.map