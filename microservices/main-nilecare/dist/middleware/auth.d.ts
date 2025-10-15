/**
 * Shared Authentication Middleware (Local Copy)
 *
 * Central authentication and authorization middleware for NileCare microservices.
 * This middleware validates JWT tokens issued by the Auth Service and enforces RBAC.
 *
 * NOTE: This is a local copy from ../../shared/middleware/auth.ts for module resolution
 */
import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    organizationId?: string;
    facilityId?: string;
    permissions: string[];
    iat: number;
    exp: number;
    iss?: string;
    aud?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
/**
 * Main authentication middleware
 * Validates JWT token and attaches user to request
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Role-based access control middleware
 * Requires user to have one of the specified roles
 */
export declare function requireRole(roles: string | string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Permission-based access control middleware
 */
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map