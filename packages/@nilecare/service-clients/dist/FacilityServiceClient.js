"use strict";
/**
 * Facility Service Client
 * API client for Facility Service communication
 *
 * Note: Implements aggressive caching for facility data
 * as facilities rarely change but are accessed frequently
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilityServiceClient = void 0;
const BaseServiceClient_1 = require("./BaseServiceClient");
class FacilityServiceClient extends BaseServiceClient_1.BaseServiceClient {
    constructor(config) {
        super(config);
        this.cache = new Map();
        this.CACHE_TTL = 3600000; // 1 hour
    }
    /**
     * Get facility by ID (with caching)
     */
    async getFacility(facilityId, skipCache = false) {
        // Check cache first
        if (!skipCache) {
            const cached = this.getFromCache(`facility:${facilityId}`);
            if (cached)
                return cached;
        }
        const facility = await this.get(`/api/v1/facilities/${facilityId}`);
        // Cache result
        this.setCache(`facility:${facilityId}`, facility);
        return facility;
    }
    /**
     * Get all facilities (cached)
     */
    async getAllFacilities() {
        const cached = this.getFromCache('facilities:all');
        if (cached)
            return cached;
        const facilities = await this.get('/api/v1/facilities');
        this.setCache('facilities:all', facilities);
        return facilities;
    }
    /**
     * Get departments for facility
     */
    async getDepartments(facilityId) {
        return await this.get(`/api/v1/facilities/${facilityId}/departments`);
    }
    /**
     * Get available beds
     */
    async getAvailableBeds(facilityId, bedType) {
        return await this.get(`/api/v1/facilities/${facilityId}/beds/available`, {
            params: { bedType }
        });
    }
    /**
     * Update bed status
     */
    async updateBedStatus(bedId, status, patientId) {
        // Clear cache after update
        this.clearCache();
        return await this.patch(`/api/v1/beds/${bedId}/status`, {
            status,
            patientId
        });
    }
    /**
     * Validate facility exists
     */
    async validateFacilityExists(facilityId) {
        try {
            await this.getFacility(facilityId);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    setCache(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + this.CACHE_TTL
        });
    }
    clearCache() {
        this.cache.clear();
    }
    /**
     * Preload frequently accessed facilities
     */
    async preloadCache(facilityIds) {
        await Promise.all(facilityIds.map((id) => this.getFacility(id, true)));
    }
}
exports.FacilityServiceClient = FacilityServiceClient;
exports.default = FacilityServiceClient;
