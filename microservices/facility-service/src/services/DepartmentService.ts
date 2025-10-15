import { DepartmentRepository } from '../repositories/DepartmentRepository';
import { Department, CreateDepartmentDTO, UpdateDepartmentDTO, DepartmentSearchParams } from '../models/Department';
import { DepartmentNotFoundError, ConflictError } from '../middleware/errorHandler';
import { logDepartmentCreation } from '../utils/logger';
import { cache } from '../utils/database';

/**
 * Department Service
 * Business logic for department management
 */

export class DepartmentService {
  private departmentRepo: DepartmentRepository;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
  }

  /**
   * Create new department
   */
  async createDepartment(dto: CreateDepartmentDTO, user: any): Promise<Department> {
    // Check for duplicate department code in facility
    const existing = await this.departmentRepo.findByFacility(dto.facilityId);
    if (existing.some(d => d.code === dto.code)) {
      throw new ConflictError(`Department code ${dto.code} already exists in this facility`);
    }

    // Create department
    const department = await this.departmentRepo.create(dto);

    // Log creation
    logDepartmentCreation({
      userId: user.userId,
      facilityId: dto.facilityId,
      departmentId: department.departmentId,
      departmentName: department.name,
    });

    // Clear cache
    await cache.clearPattern(`departments:facility:${dto.facilityId}*`);

    // TODO: Publish department.created event

    return department;
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId: string, user: any): Promise<Department> {
    const cacheKey = `department:${departmentId}`;
    const cached = await cache.getJSON<Department>(cacheKey);
    if (cached) return cached;

    const department = await this.departmentRepo.findById(departmentId);
    
    if (!department) {
      throw new DepartmentNotFoundError(departmentId);
    }

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, department, 300);

    return department;
  }

  /**
   * Get departments by facility
   */
  async getDepartmentsByFacility(facilityId: string, user: any): Promise<Department[]> {
    const cacheKey = `departments:facility:${facilityId}`;
    const cached = await cache.getJSON<Department[]>(cacheKey);
    if (cached) return cached;

    const departments = await this.departmentRepo.findByFacility(facilityId);

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, departments, 300);

    return departments;
  }

  /**
   * Search departments
   */
  async searchDepartments(params: DepartmentSearchParams, user: any): Promise<{ departments: Department[]; total: number }> {
    return this.departmentRepo.search(params);
  }

  /**
   * Update department
   */
  async updateDepartment(departmentId: string, dto: UpdateDepartmentDTO, user: any): Promise<Department> {
    const existing = await this.getDepartmentById(departmentId, user);

    const updated = await this.departmentRepo.update(departmentId, {
      ...dto,
      updatedBy: user.userId,
    });

    if (!updated) {
      throw new DepartmentNotFoundError(departmentId);
    }

    // Clear cache
    await cache.del(`department:${departmentId}`);
    await cache.clearPattern(`departments:facility:${existing.facilityId}*`);

    // TODO: Publish department.updated event

    return updated;
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(departmentId: string, user: any): Promise<void> {
    const existing = await this.getDepartmentById(departmentId, user);

    // Check if department has active wards
    // TODO: Add check for active wards

    const deleted = await this.departmentRepo.delete(departmentId);

    if (!deleted) {
      throw new DepartmentNotFoundError(departmentId);
    }

    // Clear cache
    await cache.del(`department:${departmentId}`);
    await cache.clearPattern(`departments:facility:${existing.facilityId}*`);

    // TODO: Publish department.deleted event
  }
}

export default DepartmentService;

