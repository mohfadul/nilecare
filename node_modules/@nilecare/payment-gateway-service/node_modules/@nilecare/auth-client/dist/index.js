"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
class AuthServiceClient {
    constructor(config) {
        this.config = config;
        if (!config.authServiceUrl) {
            throw new Error('AUTH_SERVICE_URL is required');
        }
        if (!config.serviceApiKey) {
            console.warn(`⚠️  AUTH_SERVICE_API_KEY not configured for ${config.serviceName}. ` +
                `Service-to-service authentication will fail!`);
        }
        this.client = axios_1.default.create({
            baseURL: config.authServiceUrl,
            timeout: config.timeout || 5000,
            headers: {
                'Content-Type': 'application/json',
                'X-Service-ID': config.serviceName,
                'X-API-Key': config.serviceApiKey || '',
            },
        });
        // Add request ID to all requests for tracing
        this.client.interceptors.request.use((config) => {
            config.headers['X-Request-ID'] = (0, uuid_1.v4)();
            return config;
        });
        // Log requests in debug mode
        this.client.interceptors.request.use((config) => {
            if (process.env.LOG_LEVEL === 'debug') {
                console.log(`[${this.config.serviceName}] → Auth Service: ${config.method?.toUpperCase()} ${config.url}`);
            }
            return config;
        });
        // Log errors
        this.client.interceptors.response.use((response) => response, (error) => {
            console.error(`[${this.config.serviceName}] Auth Service Error:`, {
                url: error.config?.url,
                status: error.response?.status,
                message: error.message,
            });
            return Promise.reject(error);
        });
    }
    /**
     * Validate JWT token
     * STANDARD ENDPOINT: /api/v1/integration/validate-token
     *
     * This is THE ONLY way services should validate tokens!
     */
    async validateToken(token) {
        try {
            const response = await this.client.post('/api/v1/integration/validate-token', { token });
            if (response.data.valid && response.data.user) {
                return {
                    valid: true,
                    user: {
                        userId: response.data.user.id || response.data.user.userId,
                        email: response.data.user.email,
                        username: response.data.user.username,
                        role: response.data.user.role,
                        permissions: response.data.permissions || response.data.user.permissions || [],
                        organizationId: response.data.user.organizationId,
                        facilityId: response.data.user.facilityId,
                    },
                };
            }
            return {
                valid: false,
                reason: response.data.reason || 'Invalid token',
            };
        }
        catch (error) {
            // Handle network errors
            if (error.code === 'ECONNREFUSED') {
                return {
                    valid: false,
                    reason: 'Auth service unavailable',
                };
            }
            // Handle timeout
            if (error.code === 'ECONNABORTED') {
                return {
                    valid: false,
                    reason: 'Auth service timeout',
                };
            }
            return {
                valid: false,
                reason: error.response?.data?.message || 'Authentication service error',
            };
        }
    }
    /**
     * Check if user has specific permission
     */
    async checkPermission(userId, permission) {
        try {
            const response = await this.client.post('/api/v1/integration/check-permission', { userId, permission });
            return response.data.allowed === true;
        }
        catch (error) {
            console.error(`[${this.config.serviceName}] Permission check error:`, error.message);
            return false; // Fail closed - deny on error
        }
    }
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const response = await this.client.get(`/api/v1/integration/users/${userId}`);
            if (response.data.success && response.data.user) {
                return {
                    userId: response.data.user.id,
                    email: response.data.user.email,
                    username: response.data.user.username,
                    role: response.data.user.role,
                    permissions: response.data.user.permissions || [],
                    organizationId: response.data.user.organizationId,
                    facilityId: response.data.user.facilityId,
                };
            }
            return null;
        }
        catch (error) {
            console.error(`[${this.config.serviceName}] Get user error:`, error.message);
            return null;
        }
    }
    /**
     * Health check - verify auth service is available
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health', { timeout: 3000 });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.AuthServiceClient = AuthServiceClient;
exports.default = AuthServiceClient;
//# sourceMappingURL=index.js.map