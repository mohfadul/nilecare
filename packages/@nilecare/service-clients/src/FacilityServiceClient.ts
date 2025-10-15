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

export class FacilityServiceClient extends BaseServiceClient {
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(config: ServiceClientConfig) {
    super(config);
  }

  /**
   * Get facility by ID (with caching)
   */
  async getFacility(facilityId: string, skipCache: boolean = false): Promise<Facility> {
    // Check cache first
    if (!skipCache) {
      const cached = this.getFromCache(`facility:${facilityId}`);
      if (cached) return cached;
    }

    const facility = await this.get<Facility>(`/api/v1/facilities/${facilityId}`);
    
    // Cache result
    this.setCache(`facility:${facilityId}`, facility);
    
    return facility;
  }

  /**
   * Get all facilities (cached)
   */
  async getAllFacilities(): Promise<Facility[]> {
    const cached = this.getFromCache('facilities:all');
    if (cached) return cached;

    const facilities = await this.get<Facility[]>('/api/v1/facilities');
    this.setCache('facilities:all', facilities);
    
    return facilities;
  }

  /**
   * Get departments for facility
   */
  async getDepartments(facilityId: string): Promise<Department[]> {
    return await this.get<Department[]>(`/api/v1/facilities/${facilityId}/departments`);
  }

  /**
   * Get available beds
   */
  async getAvailableBeds(facilityId: string, bedType?: string): Promise<Bed[]> {
    return await this.get<Bed[]>(`/api/v1/facilities/${facilityId}/beds/available`, {
      params: { bedType }
    });
  }

  /**
   * Update bed status
   */
  async updateBedStatus(bedId: string, status: string, patientId?: string): Promise<Bed> {
    // Clear cache after update
    this.clearCache();
    
    return await this.patch<Bed>(`/api/v1/beds/${bedId}/status`, {
      status,
      patientId
    });
  }

  /**
   * Validate facility exists
   */
  async validateFacilityExists(facilityId: string): Promise<boolean> {
    try {
      await this.getFacility(facilityId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Preload frequently accessed facilities
   */
  async preloadCache(facilityIds: string[]): Promise<void> {
    await Promise.all(
      facilityIds.map((id) => this.getFacility(id, true))
    );
  }
}

export default FacilityServiceClient;

