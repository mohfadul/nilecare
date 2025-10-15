import { Request, Response } from 'express';
import { DepartmentService } from '../services/DepartmentService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Department Controller
 * HTTP request handlers for department management
 */

export class DepartmentController {
  private departmentService: DepartmentService;

  constructor() {
    this.departmentService = new DepartmentService();
  }

  /**
   * GET /api/v1/departments
   * Get all departments (with filters)
   */
  getAllDepartments = asyncHandler(async (req: Request, res: Response) => {
    const params = {
      facilityId: req.query.facilityId as string,
      specialization: req.query.specialization as string,
      isActive: req.query.isActive === 'true',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await this.departmentService.searchDepartments(params, (req as any).user);

    res.json({
      success: true,
      data: result.departments,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: result.total,
        pages: Math.ceil(result.total / (params.limit || 50)),
      },
    });
  });

  /**
   * POST /api/v1/departments
   * Create new department
   */
  createDepartment = asyncHandler(async (req: Request, res: Response) => {
    const dto = {
      facilityId: req.body.facilityId,
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      headOfDepartment: req.body.headOfDepartment,
      specialization: req.body.specialization,
      floor: req.body.floor,
      building: req.body.building,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      operatingHours: req.body.operatingHours,
      createdBy: (req as any).user.userId,
    };

    const department = await this.departmentService.createDepartment(dto, (req as any).user);

    res.status(201).json({
      success: true,
      data: department,
      message: 'Department created successfully',
    });
  });

  /**
   * GET /api/v1/departments/:id
   * Get department by ID
   */
  getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    const department = await this.departmentService.getDepartmentById(departmentId, (req as any).user);

    res.json({
      success: true,
      data: department,
    });
  });

  /**
   * PUT /api/v1/departments/:id
   * Update department
   */
  updateDepartment = asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    const dto = {
      name: req.body.name,
      description: req.body.description,
      headOfDepartment: req.body.headOfDepartment,
      specialization: req.body.specialization,
      floor: req.body.floor,
      building: req.body.building,
      contactPhone: req.body.contactPhone,
      contactEmail: req.body.contactEmail,
      operatingHours: req.body.operatingHours,
      isActive: req.body.isActive,
    };

    const department = await this.departmentService.updateDepartment(departmentId, dto, (req as any).user);

    res.json({
      success: true,
      data: department,
      message: 'Department updated successfully',
    });
  });

  /**
   * DELETE /api/v1/departments/:id
   * Delete department (soft delete)
   */
  deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    await this.departmentService.deleteDepartment(departmentId, (req as any).user);

    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  });

  /**
   * GET /api/v1/departments/:id/wards
   * Get department wards
   */
  getDepartmentWards = asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    
    // Validate department access
    await this.departmentService.getDepartmentById(departmentId, (req as any).user);

    // Import WardService dynamically
    const { WardService } = await import('../services/WardService');
    const wardService = new WardService();
    const wards = await wardService.getWardsByDepartment(departmentId, (req as any).user);

    res.json({
      success: true,
      data: wards,
    });
  });
}

export default DepartmentController;

