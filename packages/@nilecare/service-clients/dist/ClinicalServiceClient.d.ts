import { NileCareResponse } from '@nilecare/response-wrapper';
/**
 * Clinical Service Client
 * Provides type-safe access to Clinical Service APIs
 */
export declare class ClinicalServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Set request ID for correlation tracking
     * Propagates request ID across service calls for end-to-end tracing
     */
    setRequestId(requestId: string): void;
    /**
     * Get patient count statistics
     */
    getPatientsCount(): Promise<number>;
    /**
     * Get recent patients
     */
    getRecentPatients(limit?: number): Promise<any[]>;
    /**
     * Get single patient by ID
     */
    getPatient(id: number): Promise<any>;
    /**
     * Get patients list with pagination
     */
    getPatients(params: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<NileCareResponse<any>>;
    /**
     * Search patients
     */
    searchPatients(query: string, filters?: any): Promise<any[]>;
    /**
     * Create new patient
     */
    createPatient(data: any): Promise<any>;
    /**
     * Update patient
     */
    updatePatient(id: number, data: any): Promise<any>;
    /**
     * Get encounters count
     */
    getEncountersCount(): Promise<number>;
    /**
     * Get today's encounters
     */
    getTodayEncounters(): Promise<any[]>;
}
export default ClinicalServiceClient;
