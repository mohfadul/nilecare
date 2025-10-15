"use strict";
/**
 * Authentication Middleware for Main NileCare Orchestrator
 * Phase 2: Uses @nilecare/auth-client for centralized authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = exports.optionalAuth = exports.authenticate = void 0;
const auth_client_1 = require("@nilecare/auth-client");
// Initialize auth client
const authClient = new auth_client_1.AuthServiceClient({
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
    serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
    serviceName: 'main-nilecare',
    timeout: 5000
});
// Create middleware functions
const { authenticate, optionalAuth, requireRole, requirePermission } = (0, auth_client_1.createAuthMiddleware)(authClient);
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.default = authenticate;
//# sourceMappingURL=auth.js.map