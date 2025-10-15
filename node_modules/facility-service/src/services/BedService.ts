import { BedRepository } from '../repositories/BedRepository';
import { WardRepository } from '../repositories/WardRepository';
import { Bed, CreateBedDTO, UpdateBedDTO, BedSearchParams, AssignBedDTO, ReleaseBedDTO, BedHistory } from '../models/Bed';
import { BedNotFoundError, BedUnavailableError, ConflictError } from '../middleware/errorHandler';
import { logBedAssignment } from '../utils/logger';
import { cache } from '../utils/database';

/**
 * Bed Service
 * Business logic for hospital bed management
 */

export class BedService {
  private bedRepo: BedRepository;
  private wardRepo: WardRepository;

  constructor() {
    this.bedRepo = new BedRepository();
    this.wardRepo = new WardRepository();
  }

  /**
   * Create new bed
   */
  async createBed(dto: CreateBedDTO, user: any): Promise<Bed> {
    // Validate ward exists
    const ward = await this.wardRepo.findById(dto.wardId);
    if (!ward) {
      throw new ConflictError(`Ward ${dto.wardId} not found`);
    }

    // Check for duplicate bed number in ward
    const existing = await this.bedRepo.findByWard(dto.wardId);
    if (existing.some(b => b.bedNumber === dto.bedNumber)) {
      throw new ConflictError(`Bed number ${dto.bedNumber} already exists in this ward`);
    }

    // Create bed
    const bed = await this.bedRepo.create(dto);

    // Update ward occupancy
    await this.wardRepo.updateOccupancy(dto.wardId);

    // Clear cache
    await this.clearBedCache(dto.facilityId, dto.wardId);

    // TODO: Publish bed.created event

    return bed;
  }

  /**
   * Get bed by ID
   */
  async getBedById(bedId: string, user: any): Promise<Bed> {
    const cacheKey = `bed:${bedId}`;
    const cached = await cache.getJSON<Bed>(cacheKey);
    if (cached) return cached;

    const bed = await this.bedRepo.findById(bedId);
    if (!bed) {
      throw new BedNotFoundError(bedId);
    }

    // Cache for 1 minute (status changes frequently)
    await cache.setJSON(cacheKey, bed, 60);

    return bed;
  }

  /**
   * Get beds by ward
   */
  async getBedsByWard(wardId: string, user: any): Promise<Bed[]> {
    const cacheKey = `beds:ward:${wardId}`;
    const cached = await cache.getJSON<Bed[]>(cacheKey);
    if (cached) return cached;

    const beds = await this.bedRepo.findByWard(wardId);

    // Cache for 1 minute
    await cache.setJSON(cacheKey, beds, 60);

    return beds;
  }

  /**
   * Search beds
   */
  async searchBeds(params: BedSearchParams, user: any): Promise<{ beds: Bed[]; total: number }> {
    return this.bedRepo.search(params);
  }

  /**
   * Get available beds
   */
  async getAvailableBeds(facilityId: string, filters?: Partial<BedSearchParams>): Promise<Bed[]> {
    const result = await this.bedRepo.search({
      facilityId,
      isAvailable: true,
      ...filters,
    });

    return result.beds;
  }

  /**
   * Update bed
   */
  async updateBed(bedId: string, dto: UpdateBedDTO, user: any): Promise<Bed> {
    const existing = await this.getBedById(bedId, user);

    const updated = await this.bedRepo.update(bedId, {
      ...dto,
      updatedBy: user.userId,
    });

    if (!updated) {
      throw new BedNotFoundError(bedId);
    }

    // If status changed, update ward occupancy
    if (dto.bedStatus && dto.bedStatus !== existing.bedStatus) {
      await this.wardRepo.updateOccupancy(existing.wardId);
    }

    // Clear cache
    await this.clearBedCache(existing.facilityId, existing.wardId);

    // TODO: Publish bed.updated event

    return updated;
  }

  /**
   * Assign bed to patient
   */
  async assignBed(dto: AssignBedDTO, user: any): Promise<Bed> {
    const bed = await this.getBedById(dto.bedId, user);

    // Validate bed is available
    if (bed.bedStatus !== 'available') {
      throw new BedUnavailableError(dto.bedId, `Bed is ${bed.bedStatus}`);
    }

    // Assign bed
    const assigned = await this.bedRepo.assignBed(dto);

    if (!assigned) {
      throw new BedUnavailableError(dto.bedId, 'Bed could not be assigned');
    }

    // Update ward occupancy
    await this.wardRepo.updateOccupancy(bed.wardId);

    // Log assignment
    logBedAssignment({
      userId: user.userId,
      userRole: user.role,
      bedId: dto.bedId,
      bedNumber: bed.bedNumber,
      wardId: bed.wardId,
      patientId: dto.patientId,
      action: 'assign',
      facilityId: bed.facilityId,
    });

    // Clear cache
    await this.clearBedCache(bed.facilityId, bed.wardId);

    // TODO: Publish bed.assigned event (for real-time updates)

    return assigned;
  }

  /**
   * Release bed from patient
   */
  async releaseBed(dto: ReleaseBedDTO, user: any): Promise<Bed> {
    const bed = await this.getBedById(dto.bedId, user);

    // Validate bed is occupied
    if (bed.bedStatus !== 'occupied') {
      throw new BedUnavailableError(dto.bedId, 'Bed is not occupied');
    }

    // Release bed
    const released = await this.bedRepo.releaseBed(dto);

    if (!released) {
      throw new BedNotFoundError(dto.bedId);
    }

    // Update ward occupancy
    await this.wardRepo.updateOccupancy(bed.wardId);

    // Log release
    logBedAssignment({
      userId: user.userId,
      userRole: user.role,
      bedId: dto.bedId,
      bedNumber: bed.bedNumber,
      wardId: bed.wardId,
      patientId: bed.patientId,
      action: 'release',
      facilityId: bed.facilityId,
    });

    // Clear cache
    await this.clearBedCache(bed.facilityId, bed.wardId);

    // TODO: Publish bed.released event

    // Schedule automatic bed status change to 'available' after cleaning
    // TODO: Implement background job or delay mechanism

    return released;
  }

  /**
   * Get bed history
   */
  async getBedHistory(bedId: string, user: any): Promise<BedHistory[]> {
    const bed = await this.getBedById(bedId, user);
    return this.bedRepo.getBedHistory(bedId);
  }

  /**
   * Update bed status (for cleaning, maintenance, etc.)
   */
  async updateBedStatus(bedId: string, status: string, user: any): Promise<Bed> {
    return this.updateBed(bedId, { bedStatus: status as any }, user);
  }

  /**
   * Get beds requiring maintenance
   */
  async getBedsRequiringMaintenance(facilityId: string): Promise<Bed[]> {
    const result = await this.bedRepo.search({
      facilityId,
      bedStatus: 'maintenance',
    });

    return result.beds;
  }

  /**
   * Clear bed-related cache
   */
  private async clearBedCache(facilityId: string, wardId: string): Promise<void> {
    await cache.clearPattern(`beds:ward:${wardId}*`);
    await cache.clearPattern(`beds:facility:${facilityId}*`);
    await cache.clearPattern(`ward:${wardId}*`);
  }
}

export default BedService;

