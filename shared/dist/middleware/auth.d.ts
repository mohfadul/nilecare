/**
 * Shared Authentication Middleware
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️  CRITICAL: AUTH SERVICE DELEGATION - NO LOCAL TOKEN VERIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This middleware delegates ALL authentication and authorization to the central
 * Authentication Service (port 7020). It does NOT perform local JWT verification.
 *
 * ARCHITECTURE:
 * ────────────────────────────────────────────────────────────────────────────
 * 1. User logs in → Auth Service validates credentials → Issues JWT token
 * 2. User makes request → Any Microservice → THIS MIDDLEWARE
 * 3. THIS MIDDLEWARE → Calls Auth Service /api/v1/integration/validate-token
 * 4. Auth Service validates token, checks user status, retrieves permissions
 * 5. Auth Service responds with user data or error
 * 6. THIS MIDDLEWARE attaches user to req.user → Proceeds to business logic
 *
 * WHY NOT LOCAL VERIFICATION?
 * ────────────────────────────────────────────────────────────────────────────
 * ✗ No single source of truth - each service has its own logic
 * ✗ No real-time user status validation (active/suspended/deleted)
 * ✗ No centralized audit logging of authentication attempts
 * ✗ Inconsistent permission/role handling across services
 * ✗ Security vulnerabilities if secrets are leaked or services misconfigured
 *
 * WHY AUTH SERVICE DELEGATION?
 * ────────────────────────────────────────────────────────────────────────────
 * ✓ Single source of truth for authentication and authorization
 * ✓ Real-time validation - inactive users immediately blocked
 * ✓ Centralized audit logging and security monitoring
 * ✓ Consistent RBAC across all microservices
 * ✓ No JWT secrets needed in other services (more secure)
 * ✓ Permission changes take effect immediately
 *
 * USAGE:
 * ────────────────────────────────────────────────────────────────────────────
 *   import { authenticate, requireRole, requirePermission } from '../../shared/middleware/auth';
 *
 *   router.get('/protected', authenticate, handler);
 *   router.post('/admin', authenticate, requireRole('admin'), handler);
 *   router.get('/patients', authenticate, requirePermission('patients:read'), handler);
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 * ────────────────────────────────────────────────────────────────────────────
 *   AUTH_SERVICE_URL=http://localhost:7020  (or auth-service:7020 in Docker)
 *   AUTH_SERVICE_API_KEY=<secure-service-api-key>
 *   SERVICE_NAME=<name-of-this-service>  (e.g., "business-service", "appointment-service")
 *
 * ═══════════════════════════════════════════════════════════════════════════
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
 * Delegates token validation to Auth Service
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
 * Delegates permission checking to Auth Service for real-time validation
 *
 * This ensures:
 * - Permission changes take effect immediately (no stale tokens)
 * - Centralized audit logging of all permission checks
 * - Consistent permission logic across all services
 *
 * @param permission - Permission string (e.g., 'patients:read', 'appointments:write')
 */
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
 * Also delegates to Auth Service but doesn't fail if validation fails
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