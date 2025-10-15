import { Request, Response } from 'express';
import { WardService } from '../services/WardService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Ward Controller
 * HTTP request handlers for ward management
 */

export class WardController {
  private wardService: WardService;

  constructor() {
    this.wardService = new WardService();
  }

  /**
   * GET /api/v1/wards
   * Get all wards (with filters)
   */
  getAllWards = asyncHandler(async (req: Request, res: Response) => {
    const params = {
      facilityId: req.query.facilityId as string,
      departmentId: req.query.departmentId as string,
      wardType: req.query.wardType as any,
      status: req.query.status as any,
      hasAvailableBeds: req.query.hasAvailableBeds === 'true',
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await this.wardService.searchWards(params, (req as any).user);

    res.json({
      success: true,
      data: result.wards,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: result.total,
        pages: Math.ceil(result.total / (params.limit || 50)),
      },
    });
  });

  /**
   * POST /api/v1/wards
   * Create new ward
   */
  createWard = asyncHandler(async (req: Request, res: Response) => {
    const dto = {
      facilityId: req.body.facilityId,
      departmentId: req.body.departmentId,
      name: req.body.name,
      wardCode: req.body.wardCode,
      wardType: req.body.wardType,
      floor: req.body.floor,
      totalBeds: req.body.totalBeds,
      nurseStationPhone: req.body.nurseStationPhone,
      specialtyType: req.body.specialtyType,
      genderRestriction: req.body.genderRestriction,
      createdBy: (req as any).user.userId,
    };

    const ward = await this.wardService.createWard(dto, (req as any).user);

    res.status(201).json({
      success: true,
      data: ward,
      message: 'Ward created successfully',
    });
  });

  /**
   * GET /api/v1/wards/:id
   * Get ward by ID
   */
  getWardById = asyncHandler(async (req: Request, res: Response) => {
    const wardId = req.params.id;
    const ward = await this.wardService.getWardById(wardId, (req as any).user);

    res.json({
      success: true,
      data: ward,
    });
  });

  /**
   * PUT /api/v1/wards/:id
   * Update ward
   */
  updateWard = asyncHandler(async (req: Request, res: Response) => {
    const wardId = req.params.id;
    const dto = {
      name: req.body.name,
      wardType: req.body.wardType,
      floor: req.body.floor,
      totalBeds: req.body.totalBeds,
      nurseStationPhone: req.body.nurseStationPhone,
      status: req.body.status,
      isActive: req.body.isActive,
      specialtyType: req.body.specialtyType,
      genderRestriction: req.body.genderRestriction,
    };

    const ward = await this.wardService.updateWard(wardId, dto, (req as any).user);

    res.json({
      success: true,
      data: ward,
      message: 'Ward updated successfully',
    });
  });

  /**
   * DELETE /api/v1/wards/:id
   * Delete ward (soft delete)
   */
  deleteWard = asyncHandler(async (req: Request, res: Response) => {
    const wardId = req.params.id;
    await this.wardService.deleteWard(wardId, (req as any).user);

    res.json({
      success: true,
      message: 'Ward deleted successfully',
    });
  });

  /**
   * GET /api/v1/wards/:id/beds
   * Get ward beds
   */
  getWardBeds = asyncHandler(async (req: Request, res: Response) => {
    const wardId = req.params.id;
    
    // Validate ward access
    await this.wardService.getWardById(wardId, (req as any).user);

    // Import BedService dynamically
    const { BedService } = await import('../services/BedService');
    const bedService = new BedService();
    const beds = await bedService.getBedsByWard(wardId, (req as any).user);

    res.json({
      success: true,
      data: beds,
    });
  });

  /**
   * GET /api/v1/wards/:id/occupancy
   * Get ward occupancy information
   */
  getWardOccupancy = asyncHandler(async (req: Request, res: Response) => {
    const wardId = req.params.id;
    const occupancy = await this.wardService.getWardOccupancy(wardId, (req as any).user);

    res.json({
      success: true,
      data: occupancy,
    });
  });
}

export default WardController;

