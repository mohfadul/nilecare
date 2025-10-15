/**
 * Shared Authentication Middleware
 *
 * Central authentication and authorization middleware for all NileCare microservices.
 * This middleware validates JWT tokens issued by the Auth Service and enforces RBAC.
 *
 * Usage:
 *   import { authenticate, requireRole, requirePermission } from '../../shared/middleware/auth';
 *
 *   router.get('/protected', authenticate, handler);
 *   router.post('/admin', authenticate, requireRole('admin'), handler);
 *   router.get('/patients', authenticate, requirePermission('patients:read'), handler);
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
 *
 * @param roles - Single role or array of roles
 */
export declare function requireRole(roles: string | string[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Permission-based access control middleware
 * Requires user to have specific permission
 *
 * @param permission - Permission string (e.g., 'patients:read', 'appointments:write')
 */
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Organization isolation middleware
 * Ensures user can only access data from their organization
 */
export declare function requireOrganization(req: Request, res: Response, next: NextFunction): void;
/**
 * Facility isolation middleware
 * Ensures user can only access data from their facility
 */
export declare function requireFacility(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Service-to-service authentication helper
 * Returns headers for authenticated service calls
 */
export declare function getServiceAuthHeaders(userToken?: string): Record<string, string>;
declare const _default: {
    authenticate: typeof authenticate;
    requireRole: typeof requireRole;
    requirePermission: typeof requirePermission;
    requireOrganization: typeof requireOrganization;
    requireFacility: typeof requireFacility;
    optionalAuth: typeof optionalAuth;
    getServiceAuthHeaders: typeof getServiceAuthHeaders;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map