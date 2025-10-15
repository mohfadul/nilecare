/**
 * Authentication Middleware
 * Validates JWT tokens and service API keys
 */
import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
/**
 * Authenticate requests using JWT token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authorize user based on roles
 */
export declare const authorize: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Ensure user belongs to the same tenant as the resource
 */
export declare const ensureTenantAccess: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    authorize: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    ensureTenantAccess: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map