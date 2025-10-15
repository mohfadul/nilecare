"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
/**
 * Create authentication middleware for Express
 * This replaces local JWT verification in all services
 */
function createAuthMiddleware(authClient) {
    /**
     * Authenticate user via Auth Service
     * This middleware delegates ALL authentication to Auth Service
     */
    async function authenticate(req, res, next) {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required. Provide: Authorization: Bearer <token>',
                    },
                });
                return;
            }
            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            // Validate token with Auth Service (NOT locally!)
            const result = await authClient.validateToken(token);
            if (!result.valid) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: result.reason || 'Invalid or expired token',
                    },
                });
                return;
            }
            // Attach user info to request
            req.user = result.user;
            // Optional: Log successful authentication
            if (process.env.LOG_AUTH === 'true') {
                console.log(`[Auth] Authenticated: user=${result.user?.userId}, role=${result.user?.role}`);
            }
            next();
        }
        catch (error) {
            console.error('Authentication middleware error:', error.message);
            res.status(500).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_FAILED',
                    message: 'Authentication failed',
                },
            });
        }
    }
    /**
     * Optional authentication (doesn't fail if no token)
     */
    async function optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                next();
                return;
            }
            const token = authHeader.substring(7);
            const result = await authClient.validateToken(token);
            if (result.valid && result.user) {
                req.user = result.user;
            }
            next();
        }
        catch (error) {
            // Ignore errors for optional auth
            next();
        }
    }
    /**
     * Require specific role(s)
     */
    function requireRole(roles) {
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }
            if (!allowedRoles.includes(req.user.role)) {
                console.warn(`[Auth] Access denied: user=${req.user.userId}, role=${req.user.role}, ` +
                    `required=${allowedRoles.join(', ')}`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
                    },
                });
                return;
            }
            next();
        };
    }
    /**
     * Require specific permission
     */
    function requirePermission(permission) {
        return async (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }
            // Check permission via Auth Service
            const hasPermission = await authClient.checkPermission(req.user.userId, permission);
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: `This action requires the permission: ${permission}`,
                    },
                });
                return;
            }
            next();
        };
    }
    return {
        authenticate,
        optionalAuth,
        requireRole,
        requirePermission,
    };
}
exports.default = createAuthMiddleware;
//# sourceMappingURL=middleware.js.map