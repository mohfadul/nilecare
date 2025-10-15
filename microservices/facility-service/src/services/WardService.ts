import { WardRepository } from '../repositories/WardRepository';
import { Ward, CreateWardDTO, UpdateWardDTO, WardSearchParams, WardOccupancy } from '../models/Ward';
import { WardNotFoundError, ConflictError } from '../middleware/errorHandler';
import { logWardStatusChange } from '../utils/logger';
import { cache } from '../utils/database';

/**
 * Ward Service
 * Business logic for ward management
 */

export class WardService {
  private wardRepo: WardRepository;

  constructor() {
    this.wardRepo = new WardRepository();
  }

  /**
   * Create new ward
   */
  async createWard(dto: CreateWardDTO, user: any): Promise<Ward> {
    // Check for duplicate ward code in facility
    const existing = await this.wardRepo.search({
      facilityId: dto.facilityId,
      departmentId: dto.departmentId,
    });

    if (existing.wards.some(w => w.wardCode === dto.wardCode)) {
      throw new ConflictError(`Ward code ${dto.wardCode} already exists in this facility`);
    }

    // Create ward
    const ward = await this.wardRepo.create(dto);

    // Clear cache
    await cache.clearPattern(`wards:facility:${dto.facilityId}*`);
    await cache.clearPattern(`wards:department:${dto.departmentId}*`);

    // TODO: Publish ward.created event

    return ward;
  }

  /**
   * Get ward by ID
   */
  async getWardById(wardId: string, user: any): Promise<Ward> {
    const cacheKey = `ward:${wardId}`;
    const cached = await cache.getJSON<Ward>(cacheKey);
    if (cached) return cached;

    const ward = await this.wardRepo.findById(wardId);
    
    if (!ward) {
      throw new WardNotFoundError(wardId);
    }

    // Cache for 2 minutes (occupancy changes frequently)
    await cache.setJSON(cacheKey, ward, 120);

    return ward;
  }

  /**
   * Get wards by department
   */
  async getWardsByDepartment(departmentId: string, user: any): Promise<Ward[]> {
    const cacheKey = `wards:department:${departmentId}`;
    const cached = await cache.getJSON<Ward[]>(cacheKey);
    if (cached) return cached;

    const wards = await this.wardRepo.findByDepartment(departmentId);

    // Cache for 2 minutes
    await cache.setJSON(cacheKey, wards, 120);

    return wards;
  }

  /**
   * Search wards
   */
  async searchWards(params: WardSearchParams, user: any): Promise<{ wards: Ward[]; total: number }> {
    return this.wardRepo.search(params);
  }

  /**
   * Update ward
   */
  async updateWard(wardId: string, dto: UpdateWardDTO, user: any): Promise<Ward> {
    const existing = await this.getWardById(wardId, user);

    // Log status change if status is being updated
    if (dto.status && dto.status !== existing.status) {
      logWardStatusChange({
        userId: user.userId,
        wardId: wardId,
        wardName: existing.name,
        oldStatus: existing.status,
        newStatus: dto.status,
        facilityId: existing.facilityId,
      });
    }

    const updated = await this.wardRepo.update(wardId, {
      ...dto,
      updatedBy: user.userId,
    });

    if (!updated) {
      throw new WardNotFoundError(wardId);
    }

    // Clear cache
    await cache.del(`ward:${wardId}`);
    await cache.clearPattern(`wards:facility:${existing.facilityId}*`);
    await cache.clearPattern(`wards:department:${existing.departmentId}*`);

    // TODO: Publish ward.updated event

    return updated;
  }

  /**
   * Delete ward (soft delete)
   */
  async deleteWard(wardId: string, user: any): Promise<void> {
    const existing = await this.getWardById(wardId, user);

    // Check if ward has active beds
    // TODO: Add check for active beds

    const deleted = await this.wardRepo.delete(wardId);

    if (!deleted) {
      throw new WardNotFoundError(wardId);
    }

    // Clear cache
    await cache.del(`ward:${wardId}`);
    await cache.clearPattern(`wards:facility:${existing.facilityId}*`);
    await cache.clearPattern(`wards:department:${existing.departmentId}*`);

    // TODO: Publish ward.deleted event
  }

  /**
   * Get ward occupancy
   */
  async getWardOccupancy(wardId: string, user: any): Promise<WardOccupancy | null> {
    const cacheKey = `ward:${wardId}:occupancy`;
    const cached = await cache.getJSON<WardOccupancy>(cacheKey);
    if (cached) return cached;

    const occupancy = await this.wardRepo.getOccupancy(wardId);

    // Cache for 1 minute (changes frequently)
    if (occupancy) {
      await cache.setJSON(cacheKey, occupancy, 60);
    }

    return occupancy;
  }

  /**
   * Update ward capacity
   */
  async updateWardCapacity(wardId: string, newTotalBeds: number, user: any): Promise<Ward> {
    const existing = await this.getWardById(wardId, user);

    // Validate new capacity is not less than occupied beds
    if (newTotalBeds < existing.occupiedBeds) {
      throw new ConflictError(
        `Cannot reduce capacity to ${newTotalBeds}. Currently ${existing.occupiedBeds} beds are occupied.`
      );
    }

    return this.updateWard(wardId, { totalBeds: newTotalBeds }, user);
  }

  /**
   * Get wards with available beds
   */
  async getWardsWithAvailableBeds(facilityId: string): Promise<Ward[]> {
    const result = await this.wardRepo.search({
      facilityId,
      hasAvailableBeds: true,
      status: 'active',
    });

    return result.wards;
  }
}

export default WardService;

