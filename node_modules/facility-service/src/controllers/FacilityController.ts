import { Request, Response } from 'express';
import { FacilityService } from '../services/FacilityService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Facility Controller
 * HTTP request handlers for facility management
 */

export class FacilityController {
  private facilityService: FacilityService;

  constructor() {
    this.facilityService = new FacilityService();
  }

  /**
   * GET /api/v1/facilities
   * Get all facilities (with filters)
   */
  getAllFacilities = asyncHandler(async (req: Request, res: Response) => {
    const params = {
      organizationId: req.query.organizationId as string,
      type: req.query.type as any,
      status: req.query.status as any,
      city: req.query.city as string,
      state: req.query.state as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
    };

    const result = await this.facilityService.searchFacilities(params, (req as any).user);

    res.json({
      success: true,
      data: result.facilities,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: result.total,
        pages: Math.ceil(result.total / (params.limit || 50)),
      },
    });
  });

  /**
   * POST /api/v1/facilities
   * Create new facility
   */
  createFacility = asyncHandler(async (req: Request, res: Response) => {
    const dto = {
      organizationId: req.body.organizationId,
      facilityCode: req.body.facilityCode,
      name: req.body.name,
      type: req.body.type,
      address: req.body.address,
      contact: req.body.contact,
      capacity: req.body.capacity,
      licensing: req.body.licensing,
      operatingHours: req.body.operatingHours,
      services: req.body.services,
      createdBy: (req as any).user.userId,
    };

    const facility = await this.facilityService.createFacility(dto, (req as any).user);

    res.status(201).json({
      success: true,
      data: facility,
      message: 'Facility created successfully',
    });
  });

  /**
   * GET /api/v1/facilities/:id
   * Get facility by ID
   */
  getFacilityById = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    const facility = await this.facilityService.getFacilityById(facilityId, (req as any).user);

    res.json({
      success: true,
      data: facility,
    });
  });

  /**
   * PUT /api/v1/facilities/:id
   * Update facility
   */
  updateFacility = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    const dto = {
      name: req.body.name,
      type: req.body.type,
      address: req.body.address,
      contact: req.body.contact,
      capacity: req.body.capacity,
      licensing: req.body.licensing,
      operatingHours: req.body.operatingHours,
      services: req.body.services,
      status: req.body.status,
      isActive: req.body.isActive,
    };

    const facility = await this.facilityService.updateFacility(facilityId, dto, (req as any).user);

    res.json({
      success: true,
      data: facility,
      message: 'Facility updated successfully',
    });
  });

  /**
   * DELETE /api/v1/facilities/:id
   * Delete facility (soft delete)
   */
  deleteFacility = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    await this.facilityService.deleteFacility(facilityId, (req as any).user);

    res.json({
      success: true,
      message: 'Facility deleted successfully',
    });
  });

  /**
   * GET /api/v1/facilities/:id/departments
   * Get facility departments
   */
  getFacilityDepartments = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    
    // Validate facility access
    await this.facilityService.getFacilityById(facilityId, (req as any).user);

    // Import DepartmentService dynamically to avoid circular dependency
    const { DepartmentService } = await import('../services/DepartmentService');
    const departmentService = new DepartmentService();
    const departments = await departmentService.getDepartmentsByFacility(facilityId, (req as any).user);

    res.json({
      success: true,
      data: departments,
    });
  });

  /**
   * GET /api/v1/facilities/:id/capacity
   * Get facility capacity information
   */
  getFacilityCapacity = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    const capacity = await this.facilityService.getFacilityCapacity(facilityId, (req as any).user);

    res.json({
      success: true,
      data: capacity,
    });
  });

  /**
   * GET /api/v1/facilities/:id/analytics
   * Get facility analytics
   */
  getFacilityAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.params.id;
    const period = req.query.period as string;

    const stats = await this.facilityService.getFacilityStatistics(facilityId, (req as any).user);

    res.json({
      success: true,
      data: {
        ...stats,
        period: period || 'current',
        timestamp: new Date().toISOString(),
      },
    });
  });
}

export default FacilityController;

