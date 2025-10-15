"use strict";
/**
 * Authentication Middleware
 * Validates JWT tokens and service API keys
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTenantAccess = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../utils/errors");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Authenticate requests using JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Skip authentication in development if bypass flag is set
        if (env_1.config.DEV_BYPASS_AUTH && env_1.config.NODE_ENV === 'development') {
            req.user = {
                userId: 'dev-user-001',
                username: 'devuser',
                email: 'dev@nilecare.local',
                roles: ['admin', 'clinician'],
                tenantId: 'dev-tenant-001',
            };
            return next();
        }
        // Check for service-to-service API key
        const serviceApiKey = req.headers['x-service-api-key'];
        if (serviceApiKey === env_1.config.SERVICE_API_KEY) {
            // Service-to-service communication
            req.user = {
                userId: 'system',
                username: 'system',
                email: 'system@nilecare.local',
                roles: ['system'],
                tenantId: req.headers['x-tenant-id'] || 'system',
            };
            return next();
        }
        // Get JWT token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.AuthenticationError('No authentication token provided');
        }
        const token = authHeader.substring(7);
        // Verify token with Authentication Service
        try {
            const response = await axios_1.default.post(`${env_1.config.AUTH_SERVICE_URL}/api/v1/auth/verify`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-service-name': env_1.config.SERVICE_NAME,
                },
                timeout: 5000,
            });
            if (!response.data.valid) {
                throw new errors_1.AuthenticationError('Invalid authentication token');
            }
            req.user = {
                userId: response.data.user.userId || response.data.user.user_id,
                username: response.data.user.username,
                email: response.data.user.email,
                roles: response.data.user.roles || [],
                tenantId: response.data.user.tenantId || response.data.user.tenant_id,
                facilityId: response.data.user.facilityId || response.data.user.facility_id,
            };
            next();
        }
        catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new errors_1.AuthenticationError('Invalid or expired token');
            }
            // Fallback to local JWT verification if auth service is down
            logger_1.default.warn('Auth service unavailable, falling back to local verification');
            try {
                const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
                req.user = {
                    userId: decoded.userId || decoded.sub,
                    username: decoded.username,
                    email: decoded.email,
                    roles: decoded.roles || [],
                    tenantId: decoded.tenantId,
                    facilityId: decoded.facilityId,
                };
                next();
            }
            catch (jwtError) {
                throw new errors_1.AuthenticationError('Token verification failed');
            }
        }
    }
    catch (error) {
        if (error instanceof errors_1.AuthenticationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
            });
        }
        else {
            logger_1.default.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication service error',
                code: 'AUTH_ERROR',
            });
        }
    }
};
exports.authenticate = authenticate;
/**
 * Authorize user based on roles
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized',
                code: 'UNAUTHORIZED',
            });
            return;
        }
        const hasRole = allowedRoles.some((role) => req.user.roles.includes(role));
        if (!hasRole) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Ensure user belongs to the same tenant as the resource
 */
const ensureTenantAccess = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized',
            code: 'UNAUTHORIZED',
        });
        return;
    }
    const resourceTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
    if (resourceTenantId && resourceTenantId !== req.user.tenantId) {
        // Allow system/admin users to access all tenants
        if (!req.user.roles.includes('system') && !req.user.roles.includes('admin')) {
            res.status(403).json({
                success: false,
                error: 'Access denied to this tenant',
                code: 'TENANT_ACCESS_DENIED',
            });
            return;
        }
    }
    next();
};
exports.ensureTenantAccess = ensureTenantAccess;
exports.default = {
    authenticate: exports.authenticate,
    authorize: exports.authorize,
    ensureTenantAccess: exports.ensureTenantAccess,
};
//# sourceMappingURL=auth.js.map