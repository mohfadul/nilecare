import { FacilityRepository } from '../repositories/FacilityRepository';
import { Facility, CreateFacilityDTO, UpdateFacilityDTO, FacilitySearchParams } from '../models/Facility';
import { FacilityNotFoundError, ConflictError, AuthorizationError } from '../middleware/errorHandler';
import { logFacilityCreation, logFacilityAccess } from '../utils/logger';
import { cache } from '../utils/database';

/**
 * Facility Service
 * Core business logic for facility management
 */

export class FacilityService {
  private facilityRepo: FacilityRepository;

  constructor() {
    this.facilityRepo = new FacilityRepository();
  }

  /**
   * Create new facility
   */
  async createFacility(dto: CreateFacilityDTO, user: any): Promise<Facility> {
    // Validate unique facility code
    const existing = await this.facilityRepo.search({
      organizationId: dto.organizationId,
      search: dto.facilityCode,
    });

    if (existing.facilities.length > 0 && existing.facilities[0].facilityCode === dto.facilityCode) {
      throw new ConflictError(`Facility code ${dto.facilityCode} already exists`);
    }

    // Create facility
    const facility = await this.facilityRepo.create(dto);

    // Log creation
    logFacilityCreation({
      userId: user.userId,
      userRole: user.role,
      facilityId: facility.facilityId,
      facilityName: facility.name,
      facilityType: facility.type,
      organizationId: facility.organizationId,
    });

    // Clear cache
    await cache.clearPattern(`facilities:org:${dto.organizationId}:*`);

    // TODO: Publish facility.created event

    return facility;
  }

  /**
   * Get facility by ID
   */
  async getFacilityById(facilityId: string, user: any): Promise<Facility> {
    // Try cache first
    const cacheKey = `facility:${facilityId}`;
    const cached = await cache.getJSON<Facility>(cacheKey);
    if (cached) {
      return cached;
    }

    const facility = await this.facilityRepo.findById(facilityId);
    
    if (!facility) {
      throw new FacilityNotFoundError(facilityId);
    }

    // Validate access
    this.validateFacilityAccess(facility, user);

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, facility, 300);

    return facility;
  }

  /**
   * Get facilities by organization
   */
  async getFacilitiesByOrganization(organizationId: string, user: any): Promise<Facility[]> {
    // Validate user belongs to organization
    if (user.organizationId !== organizationId && !user.isSuperAdmin) {
      throw new AuthorizationError('You do not have access to this organization');
    }

    // Try cache first
    const cacheKey = `facilities:org:${organizationId}`;
    const cached = await cache.getJSON<Facility[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const facilities = await this.facilityRepo.findByOrganization(organizationId);

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, facilities, 300);

    return facilities;
  }

  /**
   * Search facilities
   */
  async searchFacilities(params: FacilitySearchParams, user: any): Promise<{ facilities: Facility[]; total: number }> {
    // Enforce organization filter if not super admin
    if (!user.isSuperAdmin && !params.organizationId) {
      params.organizationId = user.organizationId;
    }

    return this.facilityRepo.search(params);
  }

  /**
   * Update facility
   */
  async updateFacility(facilityId: string, dto: UpdateFacilityDTO, user: any): Promise<Facility> {
    const existing = await this.getFacilityById(facilityId, user);

    // Validate access
    this.validateFacilityAccess(existing, user);

    // Update
    const updated = await this.facilityRepo.update(facilityId, {
      ...dto,
      updatedBy: user.userId,
    });

    if (!updated) {
      throw new FacilityNotFoundError(facilityId);
    }

    // Clear cache
    await cache.del(`facility:${facilityId}`);
    await cache.clearPattern(`facilities:org:${existing.organizationId}:*`);

    // TODO: Publish facility.updated event

    return updated;
  }

  /**
   * Delete facility (soft delete)
   */
  async deleteFacility(facilityId: string, user: any): Promise<void> {
    const existing = await this.getFacilityById(facilityId, user);

    // Validate access
    this.validateFacilityAccess(existing, user);

    // Check if facility has active departments
    // TODO: Add check for active departments/wards/beds

    // Delete
    const deleted = await this.facilityRepo.delete(facilityId);

    if (!deleted) {
      throw new FacilityNotFoundError(facilityId);
    }

    // Clear cache
    await cache.del(`facility:${facilityId}`);
    await cache.clearPattern(`facilities:org:${existing.organizationId}:*`);

    // TODO: Publish facility.deleted event
  }

  /**
   * Get facility statistics
   */
  async getFacilityStatistics(facilityId: string, user: any): Promise<any> {
    const facility = await this.getFacilityById(facilityId, user);

    // Try cache first
    const cacheKey = `facility:${facilityId}:stats`;
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await this.facilityRepo.getStatistics(facilityId);

    // Cache for 1 minute (stats change frequently)
    await cache.setJSON(cacheKey, stats, 60);

    return stats;
  }

  /**
   * Get facility capacity information
   */
  async getFacilityCapacity(facilityId: string, user: any): Promise<any> {
    const facility = await this.getFacilityById(facilityId, user);

    return {
      facilityId: facility.facilityId,
      name: facility.name,
      capacity: facility.capacity,
      // Additional real-time data from stats
      ...(await this.getFacilityStatistics(facilityId, user)),
    };
  }

  /**
   * Validate user has access to facility
   */
  private validateFacilityAccess(facility: Facility, user: any): void {
    // Super admin has access to all
    if (user.isSuperAdmin) {
      return;
    }

    // Multi-facility admin has access to all facilities in their organization
    if (user.isMultiFacilityAdmin && facility.organizationId === user.organizationId) {
      return;
    }

    // Regular user must be assigned to the facility
    if (user.facilityId === facility.facilityId) {
      return;
    }

    // Check if user has access to multiple facilities
    if (user.facilityIds && user.facilityIds.includes(facility.facilityId)) {
      return;
    }

    // No access
    throw new AuthorizationError('You do not have access to this facility');
  }

  /**
   * Validate facility ownership for creating sub-resources
   */
  async validateFacilityOwnership(facilityId: string, user: any): Promise<Facility> {
    const facility = await this.getFacilityById(facilityId, user);
    this.validateFacilityAccess(facility, user);
    return facility;
  }
}

export default FacilityService;

