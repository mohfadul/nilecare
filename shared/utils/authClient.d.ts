/**
 * Auth Service Client
 *
 * Helper functions for microservices to interact with the Auth Service
 */
declare class AuthClient {
    private client;
    constructor();
    /**
     * Verify token validity
     */
    verifyToken(token: string): Promise<{
        valid: boolean;
        user?: any;
    }>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: string, permission: string, token: string): Promise<boolean>;
    /**
     * Get user by ID (service-to-service call)
     */
    getUserById(userId: string, serviceToken: string): Promise<any | null>;
    /**
     * Validate session
     */
    validateSession(sessionId: string, userId: string, token: string): Promise<boolean>;
    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken: string): Promise<{
        success: boolean;
        accessToken?: string;
    }>;
    /**
     * Logout user (invalidate tokens)
     */
    logout(token: string): Promise<boolean>;
    /**
     * Health check
     */
    healthCheck(): Promise<boolean>;
}
export declare const authClient: AuthClient;
export default authClient;
//# sourceMappingURL=authClient.d.ts.map