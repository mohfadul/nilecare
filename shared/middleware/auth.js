"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireOrganization = requireOrganization;
exports.requireFacility = requireFacility;
exports.optionalAuth = optionalAuth;
exports.getServiceAuthHeaders = getServiceAuthHeaders;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Main authentication middleware
 * Validates JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No authorization header provided'
                }
            });
            return;
        }
        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN_FORMAT',
                    message: 'Authorization header must use Bearer scheme'
                }
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided'
                }
            });
            return;
        }
        // Verify JWT_SECRET is configured
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('[Auth Middleware] CRITICAL: JWT_SECRET environment variable is not set');
            res.status(500).json({
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'Authentication service is misconfigured'
                }
            });
            return;
        }
        // Verify and decode token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Additional expiration check (redundant but safe)
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired, please refresh'
                }
            });
            return;
        }
        // Attach user info to request
        req.user = decoded;
        // Log successful authentication (optional, can be disabled in production)
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_AUTH === 'true') {
            console.log(`[Auth] Authenticated: user=${decoded.userId}, role=${decoded.role}`);
        }
        next();
    }
    catch (error) {
        // Handle JWT-specific errors
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token provided'
                }
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired, please refresh'
                }
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.NotBeforeError) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_NOT_ACTIVE',
                    message: 'Token is not yet valid'
                }
            });
            return;
        }
        // Generic error
        console.error('[Auth Middleware] Authentication error:', error);
        res.status(401).json({
            success: false,
            error: {
                code: 'AUTHENTICATION_FAILED',
                message: 'Authentication failed'
            }
        });
    }
}
/**
 * Role-based access control middleware
 * Requires user to have one of the specified roles
 *
 * @param roles - Single role or array of roles
 */
function requireRole(roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`[Auth] Access denied: user=${req.user.userId}, role=${req.user.role}, required=${allowedRoles.join(', ')}`);
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
                }
            });
            return;
        }
        next();
    };
}
/**
 * Permission-based access control middleware
 * Requires user to have specific permission
 *
 * @param permission - Permission string (e.g., 'patients:read', 'appointments:write')
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            return;
        }
        const userPermissions = req.user.permissions || [];
        // Check for wildcard permission (admin)
        if (userPermissions.includes('*')) {
            next();
            return;
        }
        // Check exact permission
        if (userPermissions.includes(permission)) {
            next();
            return;
        }
        // Check resource wildcard (e.g., 'patients:*' matches 'patients:read')
        const [resource] = permission.split(':');
        if (userPermissions.includes(`${resource}:*`)) {
            next();
            return;
        }
        console.warn(`[Auth] Permission denied: user=${req.user.userId}, required=${permission}, has=[${userPermissions.join(', ')}]`);
        res.status(403).json({
            success: false,
            error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `This action requires the permission: ${permission}`
            }
        });
    };
}
/**
 * Organization isolation middleware
 * Ensures user can only access data from their organization
 */
function requireOrganization(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
        return;
    }
    if (!req.user.organizationId) {
        console.warn(`[Auth] User ${req.user.userId} has no organization`);
        res.status(403).json({
            success: false,
            error: {
                code: 'NO_ORGANIZATION',
                message: 'User must be associated with an organization'
            }
        });
        return;
    }
    next();
}
/**
 * Facility isolation middleware
 * Ensures user can only access data from their facility
 */
function requireFacility(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
        return;
    }
    if (!req.user.facilityId) {
        console.warn(`[Auth] User ${req.user.userId} has no facility`);
        res.status(403).json({
            success: false,
            error: {
                code: 'NO_FACILITY',
                message: 'User must be associated with a facility'
            }
        });
        return;
    }
    next();
}
/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require authentication
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret && token) {
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            req.user = decoded;
        }
    }
    catch (error) {
        // Silently ignore errors for optional auth
    }
    next();
}
/**
 * Service-to-service authentication helper
 * Returns headers for authenticated service calls
 */
function getServiceAuthHeaders(userToken) {
    const headers = {
        'X-Service-Name': process.env.SERVICE_NAME || 'unknown-service',
        'X-Service-Version': process.env.SERVICE_VERSION || '1.0.0',
    };
    if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
    }
    return headers;
}
// Export all middleware
exports.default = {
    authenticate,
    requireRole,
    requirePermission,
    requireOrganization,
    requireFacility,
    optionalAuth,
    getServiceAuthHeaders,
};
//# sourceMappingURL=auth.js.map