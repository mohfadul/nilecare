import { Request, Response, NextFunction } from 'express';
import { AuthServiceClient, UserInfo } from './index';
declare global {
    namespace Express {
        interface Request {
            user?: UserInfo;
            traceId?: string;
        }
    }
}
/**
 * Create authentication middleware for Express
 * This replaces local JWT verification in all services
 */
export declare function createAuthMiddleware(authClient: AuthServiceClient): {
    authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
    requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default createAuthMiddleware;
//# sourceMappingURL=middleware.d.ts.map