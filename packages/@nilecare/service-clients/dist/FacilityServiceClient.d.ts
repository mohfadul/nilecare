/**
 * Facility Service Client
 * API client for Facility Service communication
 *
 * Note: Implements aggressive caching for facility data
 * as facilities rarely change but are accessed frequently
 */
import { BaseServiceClient, ServiceClientConfig } from './BaseServiceClient';
export interface Facility {
    id: string;
    facilityCode: string;
    facilityName: string;
    facilityType: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        country: string;
    };
    phone: string;
    email?: string;
    isActive: boolean;
}
export interface Department {
    id: string;
    facilityId: string;
    departmentCode: string;
    departmentName: string;
    departmentType: string;
    isActive: boolean;
}
export interface Bed {
    id: string;
    facilityId: string;
    departmentId?: string;
    wardId?: string;
    bedNumber: string;
    bedType: string;
    status: string;
    currentPatientId?: string;
}
export declare class FacilityServiceClient extends BaseServiceClient {
    private cache;
    private readonly CACHE_TTL;
    constructor(config: ServiceClientConfig);
    /**
     * Get facility by ID (with caching)
     */
    getFacility(facilityId: string, skipCache?: boolean): Promise<Facility>;
    /**
     * Get all facilities (cached)
     */
    getAllFacilities(): Promise<Facility[]>;
    /**
     * Get departments for facility
     */
    getDepartments(facilityId: string): Promise<Department[]>;
    /**
     * Get available beds
     */
    getAvailableBeds(facilityId: string, bedType?: string): Promise<Bed[]>;
    /**
     * Update bed status
     */
    updateBedStatus(bedId: string, status: string, patientId?: string): Promise<Bed>;
    /**
     * Validate facility exists
     */
    validateFacilityExists(facilityId: string): Promise<boolean>;
    /**
     * Cache management
     */
    private getFromCache;
    private setCache;
    private clearCache;
    /**
     * Preload frequently accessed facilities
     */
    preloadCache(facilityIds: string[]): Promise<void>;
}
export default FacilityServiceClient;
