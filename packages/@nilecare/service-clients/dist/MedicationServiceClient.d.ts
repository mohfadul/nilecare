/**
 * Medication Service Client
 * Provides type-safe access to Medication Service APIs
 */
export declare class MedicationServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Get active prescriptions count
     */
    getActivePrescriptionsCount(): Promise<number>;
    /**
     * Get medication alerts count
     */
    getAlertsCount(): Promise<number>;
    /**
     * Get recent alerts
     */
    getRecentAlerts(limit?: number): Promise<any[]>;
    /**
     * Get all medication stats
     */
    getAllStats(): Promise<any>;
}
export default MedicationServiceClient;
