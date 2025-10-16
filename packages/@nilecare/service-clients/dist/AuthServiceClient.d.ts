/**
 * Auth Service Client
 * Provides type-safe access to Auth Service APIs
 */
export declare class AuthServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Get users count
     */
    getUsersCount(): Promise<number>;
    /**
     * Get active users count
     */
    getActiveUsersCount(): Promise<number>;
    /**
     * Get all auth stats
     */
    getAllStats(): Promise<any>;
}
export default AuthServiceClient;
