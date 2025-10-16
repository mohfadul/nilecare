/**
 * Lab Service Client
 * Provides type-safe access to Lab Service APIs
 */
export declare class LabServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Get pending lab orders count
     */
    getPendingOrdersCount(): Promise<number>;
    /**
     * Get critical results count
     */
    getCriticalResultsCount(): Promise<number>;
    /**
     * Get recent critical results
     */
    getRecentCriticalResults(limit?: number): Promise<any[]>;
    /**
     * Get all lab stats
     */
    getAllStats(): Promise<any>;
}
export default LabServiceClient;
