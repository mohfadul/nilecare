/**
 * Centralized Authentication Service Client
 * All microservices MUST use this to validate tokens
 *
 * ⚠️ CRITICAL: Services should NEVER verify JWT tokens locally!
 * All authentication is delegated to Auth Service (port 7020)
 */
export interface AuthConfig {
    authServiceUrl: string;
    serviceApiKey: string;
    serviceName: string;
    timeout?: number;
}
export interface UserInfo {
    userId: string;
    email: string;
    username?: string;
    role: string;
    permissions: string[];
    organizationId?: string;
    facilityId?: string;
}
export interface TokenValidationResult {
    valid: boolean;
    user?: UserInfo;
    reason?: string;
}
export declare class AuthServiceClient {
    private client;
    private config;
    constructor(config: AuthConfig);
    /**
     * Validate JWT token
     * STANDARD ENDPOINT: /api/v1/integration/validate-token
     *
     * This is THE ONLY way services should validate tokens!
     */
    validateToken(token: string): Promise<TokenValidationResult>;
    /**
     * Check if user has specific permission
     */
    checkPermission(userId: string, permission: string): Promise<boolean>;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<UserInfo | null>;
    /**
     * Health check - verify auth service is available
     */
    healthCheck(): Promise<boolean>;
}
export default AuthServiceClient;
//# sourceMappingURL=index.d.ts.map