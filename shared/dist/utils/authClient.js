"use strict";
/**
 * Auth Service Client
 *
 * Helper functions for microservices to interact with the Auth Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authClient = void 0;
const axios_1 = __importDefault(require("axios"));
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
class AuthClient {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: AUTH_SERVICE_URL,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Verify token validity
     */
    async verifyToken(token) {
        try {
            const response = await this.client.get('/api/v1/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return {
                valid: response.data.success,
                user: response.data.user
            };
        }
        catch (error) {
            return { valid: false };
        }
    }
    /**
     * Check if user has permission
     */
    async hasPermission(userId, permission, token) {
        try {
            const response = await this.client.get('/api/v1/roles/permissions/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                const permissions = response.data.permissions || [];
                // Check wildcard
                if (permissions.includes('*')) {
                    return true;
                }
                // Check exact permission
                if (permissions.includes(permission)) {
                    return true;
                }
                // Check resource wildcard
                const [resource] = permission.split(':');
                if (permissions.includes(`${resource}:*`)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get user by ID (service-to-service call)
     */
    async getUserById(userId, serviceToken) {
        try {
            const response = await this.client.get(`/api/v1/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${serviceToken}`
                }
            });
            return response.data.success ? response.data.user : null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validate session
     */
    async validateSession(sessionId, userId, token) {
        try {
            const response = await this.client.get('/api/v1/sessions', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                const sessions = response.data.sessions || [];
                return sessions.some((s) => s.id === sessionId);
            }
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await this.client.post('/api/v1/auth/refresh-token', {}, {
                headers: {
                    Cookie: `refreshToken=${refreshToken}`
                }
            });
            return {
                success: response.data.success,
                accessToken: response.data.accessToken
            };
        }
        catch (error) {
            return { success: false };
        }
    }
    /**
     * Logout user (invalidate tokens)
     */
    async logout(token) {
        try {
            const response = await this.client.post('/api/v1/auth/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data.success;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data.status === 'healthy';
        }
        catch (error) {
            return false;
        }
    }
}
// Export singleton instance
exports.authClient = new AuthClient();
exports.default = exports.authClient;
//# sourceMappingURL=authClient.js.map