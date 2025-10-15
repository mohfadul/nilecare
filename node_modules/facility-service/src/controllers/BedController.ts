import { Request, Response } from 'express';
import { BedService } from '../services/BedService';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Bed Controller
 * HTTP request handlers for bed management
 */

export class BedController {
  private bedService: BedService;

  constructor() {
    this.bedService = new BedService();
  }

  /**
   * GET /api/v1/beds
   * Get all beds (with filters)
   */
  getAllBeds = asyncHandler(async (req: Request, res: Response) => {
    const params = {
      facilityId: req.query.facilityId as string,
      departmentId: req.query.departmentId as string,
      wardId: req.query.wardId as string,
      bedType: req.query.bedType as any,
      bedStatus: req.query.bedStatus as any,
      patientId: req.query.patientId as string,
      hasOxygen: req.query.hasOxygen === 'true',
      hasMonitor: req.query.hasMonitor === 'true',
      hasVentilator: req.query.hasVentilator === 'true',
      isolationCapable: req.query.isolationCapable === 'true',
      isAvailable: req.query.isAvailable === 'true',
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await this.bedService.searchBeds(params, (req as any).user);

    res.json({
      success: true,
      data: result.beds,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: result.total,
        pages: Math.ceil(result.total / (params.limit || 50)),
      },
    });
  });

  /**
   * POST /api/v1/beds
   * Create new bed
   */
  createBed = asyncHandler(async (req: Request, res: Response) => {
    const dto = {
      facilityId: req.body.facilityId,
      departmentId: req.body.departmentId,
      wardId: req.body.wardId,
      bedNumber: req.body.bedNumber,
      bedType: req.body.bedType,
      location: req.body.location,
      hasOxygen: req.body.hasOxygen,
      hasMonitor: req.body.hasMonitor,
      hasVentilator: req.body.hasVentilator,
      isolationCapable: req.body.isolationCapable,
      createdBy: (req as any).user.userId,
    };

    const bed = await this.bedService.createBed(dto, (req as any).user);

    res.status(201).json({
      success: true,
      data: bed,
      message: 'Bed created successfully',
    });
  });

  /**
   * GET /api/v1/beds/:id
   * Get bed by ID
   */
  getBedById = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const bed = await this.bedService.getBedById(bedId, (req as any).user);

    res.json({
      success: true,
      data: bed,
    });
  });

  /**
   * PUT /api/v1/beds/:id
   * Update bed
   */
  updateBed = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const dto = {
      bedNumber: req.body.bedNumber,
      bedType: req.body.bedType,
      bedStatus: req.body.bedStatus,
      location: req.body.location,
      hasOxygen: req.body.hasOxygen,
      hasMonitor: req.body.hasMonitor,
      hasVentilator: req.body.hasVentilator,
      isolationCapable: req.body.isolationCapable,
      isActive: req.body.isActive,
      notes: req.body.notes,
      lastMaintenanceDate: req.body.lastMaintenanceDate,
    };

    const bed = await this.bedService.updateBed(bedId, dto, (req as any).user);

    res.json({
      success: true,
      data: bed,
      message: 'Bed updated successfully',
    });
  });

  /**
   * PUT /api/v1/beds/:id/status
   * Update bed status
   */
  updateBedStatus = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const status = req.body.status;

    const bed = await this.bedService.updateBedStatus(bedId, status, (req as any).user);

    res.json({
      success: true,
      data: bed,
      message: 'Bed status updated successfully',
    });
  });

  /**
   * POST /api/v1/beds/:id/assign
   * Assign bed to patient
   */
  assignBed = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const dto = {
      bedId,
      patientId: req.body.patientId,
      assignmentDate: req.body.assignmentDate,
      expectedDischargeDate: req.body.expectedDischargeDate,
      notes: req.body.notes,
      assignedBy: (req as any).user.userId,
    };

    const bed = await this.bedService.assignBed(dto, (req as any).user);

    res.json({
      success: true,
      data: bed,
      message: 'Bed assigned successfully',
    });
  });

  /**
   * POST /api/v1/beds/:id/release
   * Release bed from patient
   */
  releaseBed = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const dto = {
      bedId,
      releaseReason: req.body.releaseReason,
      releasedBy: (req as any).user.userId,
    };

    const bed = await this.bedService.releaseBed(dto, (req as any).user);

    res.json({
      success: true,
      data: bed,
      message: 'Bed released successfully',
    });
  });

  /**
   * GET /api/v1/beds/available
   * Get available beds
   */
  getAvailableBeds = asyncHandler(async (req: Request, res: Response) => {
    const facilityId = req.query.facilityId as string;
    const filters = {
      wardId: req.query.wardId as string,
      bedType: req.query.bedType as any,
      hasOxygen: req.query.hasOxygen === 'true',
      hasMonitor: req.query.hasMonitor === 'true',
      hasVentilator: req.query.hasVentilator === 'true',
      isolationCapable: req.query.isolationCapable === 'true',
    };

    const beds = await this.bedService.getAvailableBeds(facilityId, filters);

    res.json({
      success: true,
      data: beds,
      count: beds.length,
    });
  });

  /**
   * GET /api/v1/beds/:id/history
   * Get bed history
   */
  getBedHistory = asyncHandler(async (req: Request, res: Response) => {
    const bedId = req.params.id;
    const history = await this.bedService.getBedHistory(bedId, (req as any).user);

    res.json({
      success: true,
      data: history,
    });
  });
}

export default BedController;

