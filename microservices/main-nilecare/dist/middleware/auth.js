"use strict";
/**
 * Shared Authentication Middleware (Local Copy)
 *
 * Central authentication and authorization middleware for NileCare microservices.
 * This middleware validates JWT tokens issued by the Auth Service and enforces RBAC.
 *
 * NOTE: This is a local copy from ../../shared/middleware/auth.ts for module resolution
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
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
        if (userPermissions.includes('*')) {
            next();
            return;
        }
        if (userPermissions.includes(permission)) {
            next();
            return;
        }
        const [resource] = permission.split(':');
        if (userPermissions.includes(`${resource}:*`)) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: `This action requires the permission: ${permission}`
            }
        });
    };
}
//# sourceMappingURL=auth.js.map