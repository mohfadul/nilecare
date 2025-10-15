"use strict";
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
const axios_1 = __importDefault(require("axios"));
/**
 * Validate environment configuration
 */
function validateAuthConfig() {
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    const serviceApiKey = process.env.AUTH_SERVICE_API_KEY;
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';
    if (!authServiceUrl) {
        throw new Error('CRITICAL: AUTH_SERVICE_URL environment variable is not set. ' +
            'This microservice cannot authenticate users without the Auth Service URL. ' +
            'Example: AUTH_SERVICE_URL=http://localhost:7020');
    }
    if (!serviceApiKey) {
        throw new Error('CRITICAL: AUTH_SERVICE_API_KEY environment variable is not set. ' +
            'This microservice cannot communicate with Auth Service without a valid API key. ' +
            'Generate a secure key and set it in both this service and the Auth Service.');
    }
    return { authServiceUrl, serviceApiKey, serviceName };
}
/**
 * Main authentication middleware
 * Delegates token validation to Auth Service
 */
async function authenticate(req, res, next) {
    const startTime = Date.now();
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logAuthAttempt('UNAUTHORIZED', 'No authorization header', req, startTime);
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
            logAuthAttempt('INVALID_FORMAT', 'Invalid header format', req, startTime);
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
            logAuthAttempt('UNAUTHORIZED', 'Empty token', req, startTime);
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'No token provided'
                }
            });
            return;
        }
        // Validate configuration
        const { authServiceUrl, serviceApiKey, serviceName } = validateAuthConfig();
        // ═══════════════════════════════════════════════════════════════════════
        // DELEGATE TO AUTH SERVICE - THIS IS THE CORE OF THE ARCHITECTURE
        // ═══════════════════════════════════════════════════════════════════════
        try {
            const response = await axios_1.default.post(`${authServiceUrl}/api/v1/integration/validate-token`, { token }, {
                headers: {
                    'X-Service-Key': serviceApiKey,
                    'X-Service-Name': serviceName,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5 second timeout
            });
            const { valid, user, tokenInfo, reason } = response.data;
            if (!valid) {
                logAuthAttempt('TOKEN_INVALID', reason || 'Token validation failed', req, startTime, tokenInfo);
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: reason || 'Token is not valid'
                    }
                });
                return;
            }
            if (!user) {
                logAuthAttempt('USER_NOT_FOUND', 'User not found in auth service response', req, startTime);
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_FAILED',
                        message: 'User not found'
                    }
                });
                return;
            }
            // Attach user info to request (from Auth Service response)
            req.user = {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                permissions: user.permissions || [],
                iat: tokenInfo?.issuedAt,
                exp: tokenInfo?.expiresAt
            };
            // Log successful authentication
            logAuthAttempt('SUCCESS', 'Token validated successfully', req, startTime, user);
            next();
        }
        catch (error) {
            // Handle errors from Auth Service call
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                if (axiosError.code === 'ECONNREFUSED') {
                    console.error(`[Auth Middleware] CRITICAL: Cannot connect to Auth Service at ${authServiceUrl}`);
                    logAuthAttempt('AUTH_SERVICE_UNAVAILABLE', 'Auth Service unavailable', req, startTime);
                    res.status(503).json({
                        success: false,
                        error: {
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'Authentication service is currently unavailable'
                        }
                    });
                    return;
                }
                if (axiosError.code === 'ETIMEDOUT') {
                    console.error('[Auth Middleware] Auth Service request timeout');
                    logAuthAttempt('AUTH_SERVICE_TIMEOUT', 'Auth Service timeout', req, startTime);
                    res.status(504).json({
                        success: false,
                        error: {
                            code: 'GATEWAY_TIMEOUT',
                            message: 'Authentication service timed out'
                        }
                    });
                    return;
                }
                if (axiosError.response?.status === 401) {
                    console.error('[Auth Middleware] Invalid service API key');
                    logAuthAttempt('INVALID_SERVICE_KEY', 'Service authentication failed', req, startTime);
                    res.status(500).json({
                        success: false,
                        error: {
                            code: 'CONFIGURATION_ERROR',
                            message: 'Service authentication misconfigured'
                        }
                    });
                    return;
                }
                console.error('[Auth Middleware] Auth Service error:', axiosError.message);
                logAuthAttempt('AUTH_SERVICE_ERROR', axiosError.message, req, startTime);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_ERROR',
                        message: 'Failed to validate authentication'
                    }
                });
                return;
            }
            // Generic error
            console.error('[Auth Middleware] Unexpected authentication error:', error);
            logAuthAttempt('UNKNOWN_ERROR', 'Unexpected error', req, startTime);
            res.status(500).json({
                success: false,
                error: {
                    code: 'AUTHENTICATION_FAILED',
                    message: 'Authentication failed'
                }
            });
        }
    }
    catch (error) {
        console.error('[Auth Middleware] Critical error:', error);
        logAuthAttempt('CRITICAL_ERROR', error.message, req, startTime);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal authentication error'
            }
        });
    }
}
/**
 * Log authentication attempt with detailed information
 */
function logAuthAttempt(status, message, req, startTime, user) {
    const duration = Date.now() - startTime;
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';
    const timestamp = new Date().toISOString();
    const logData = {
        timestamp,
        service: serviceName,
        status,
        message,
        duration: `${duration}ms`,
        method: req.method,
        path: req.path,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        ...(user && {
            userId: user.id || user.userId,
            userEmail: user.email,
            userRole: user.role
        })
    };
    if (status === 'SUCCESS') {
        console.log('[Auth Middleware] ✓', JSON.stringify(logData));
    }
    else {
        console.warn('[Auth Middleware] ✗', JSON.stringify(logData));
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
 * Delegates permission checking to Auth Service for real-time validation
 *
 * This ensures:
 * - Permission changes take effect immediately (no stale tokens)
 * - Centralized audit logging of all permission checks
 * - Consistent permission logic across all services
 *
 * @param permission - Permission string (e.g., 'patients:read', 'appointments:write')
 */
function requirePermission(permission) {
    return async (req, res, next) => {
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
        // Parse permission into resource and action
        const [resource, action] = permission.split(':');
        if (!resource || !action) {
            console.error(`[Auth] Invalid permission format: ${permission}. Expected format: 'resource:action'`);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INVALID_PERMISSION',
                    message: 'Invalid permission configuration'
                }
            });
            return;
        }
        try {
            const { authServiceUrl, serviceApiKey, serviceName } = validateAuthConfig();
            // Delegate permission check to Auth Service
            const response = await axios_1.default.post(`${authServiceUrl}/api/v1/integration/verify-permission`, {
                userId: req.user.userId,
                resource,
                action
            }, {
                headers: {
                    'X-Service-Key': serviceApiKey,
                    'X-Service-Name': serviceName,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            const { allowed } = response.data;
            if (!allowed) {
                console.warn(`[Auth] Permission denied: service=${serviceName}, user=${req.user.userId}, ` +
                    `email=${req.user.email}, role=${req.user.role}, required=${permission}`);
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: `This action requires the permission: ${permission}`
                    }
                });
                return;
            }
            // Permission granted
            console.log(`[Auth] Permission granted: service=${serviceName}, user=${req.user.userId}, permission=${permission}`);
            next();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error('[Auth] Permission check failed - Auth Service error:', error.message);
                res.status(503).json({
                    success: false,
                    error: {
                        code: 'PERMISSION_CHECK_FAILED',
                        message: 'Unable to verify permissions at this time'
                    }
                });
                return;
            }
            console.error('[Auth] Permission check failed:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'PERMISSION_CHECK_ERROR',
                    message: 'Failed to verify permissions'
                }
            });
        }
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
 * Also delegates to Auth Service but doesn't fail if validation fails
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        if (!token) {
            next();
            return;
        }
        try {
            const { authServiceUrl, serviceApiKey, serviceName } = validateAuthConfig();
            const response = await axios_1.default.post(`${authServiceUrl}/api/v1/integration/validate-token`, { token }, {
                headers: {
                    'X-Service-Key': serviceApiKey,
                    'X-Service-Name': serviceName,
                    'Content-Type': 'application/json'
                },
                timeout: 3000 // Shorter timeout for optional auth
            });
            const { valid, user, tokenInfo } = response.data;
            if (valid && user) {
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                    permissions: user.permissions || [],
                    iat: tokenInfo?.issuedAt,
                    exp: tokenInfo?.expiresAt
                };
            }
        }
        catch (error) {
            // Silently ignore errors for optional auth
            // This allows the request to continue even if auth service is down
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