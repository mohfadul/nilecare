import { Request, Response, NextFunction } from 'express';
import { MedicationService } from '../services/MedicationService';
import { asyncHandler } from '../middleware/errorHandler';
import { CreateMedicationDTO, UpdateMedicationDTO } from '../models/Medication';
import { CreatePrescriptionDTO, DispensePrescriptionDTO } from '../models/Prescription';

/**
 * Medication Controller
 * Handles HTTP requests for medication management
 */

export class MedicationController {
  private medicationService: MedicationService;

  constructor() {
    this.medicationService = new MedicationService();
  }

  /**
   * Create new medication
   * POST /api/v1/medications
   */
  createMedication = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const facilityContext = (req as any).facilityContext;

    const dto: CreateMedicationDTO = {
      ...req.body,
      facilityId: req.body.facilityId || facilityContext?.facilityId,
      organizationId: req.body.organizationId || facilityContext?.organizationId,
      createdBy: user.userId,
    };

    const medication = await this.medicationService.createMedication(dto);

    res.status(201).json({
      success: true,
      data: medication,
      message: 'Medication created successfully',
    });
  });

  /**
   * Get medication by ID
   * GET /api/v1/medications/:id
   */
  getMedication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const facilityContext = (req as any).facilityContext;

    const medication = await this.medicationService.getMedicationById(
      id,
      facilityContext?.facilityId
    );

    res.json({
      success: true,
      data: medication,
    });
  });

  /**
   * Search medications
   * GET /api/v1/medications/search?q=searchTerm
   */
  searchMedications = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query;
    const facilityContext = (req as any).facilityContext;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query parameter "q" is required' },
      });
    }

    const medications = await this.medicationService.searchMedications(
      q as string,
      facilityContext.facilityId,
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      success: true,
      data: medications,
      count: medications.length,
    });
  });

  /**
   * Update medication
   * PUT /api/v1/medications/:id
   */
  updateMedication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    const facilityContext = (req as any).facilityContext;

    const dto: UpdateMedicationDTO = {
      ...req.body,
      updatedBy: user.userId,
    };

    const medication = await this.medicationService.updateMedication(
      id,
      dto,
      facilityContext?.facilityId
    );

    res.json({
      success: true,
      data: medication,
      message: 'Medication updated successfully',
    });
  });

  /**
   * Create prescription
   * POST /api/v1/prescriptions
   */
  createPrescription = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const facilityContext = (req as any).facilityContext;

    const dto: CreatePrescriptionDTO = {
      ...req.body,
      facilityId: req.body.facilityId || facilityContext?.facilityId,
      organizationId: req.body.organizationId || facilityContext?.organizationId,
      createdBy: user.userId,
      startDate: new Date(req.body.startDate),
    };

    const prescription = await this.medicationService.createPrescription(dto);

    res.status(201).json({
      success: true,
      data: prescription,
      message: 'Prescription created successfully',
    });
  });

  /**
   * Dispense medication from prescription
   * POST /api/v1/prescriptions/:id/dispense
   */
  dispenseMedication = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    const facilityContext = (req as any).facilityContext;

    const dto: DispensePrescriptionDTO = {
      prescriptionId: id,
      quantity: req.body.quantity,
      batchNumber: req.body.batchNumber,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      dispensedBy: user.userId,
      facilityId: req.body.facilityId || facilityContext?.facilityId,
    };

    const result = await this.medicationService.dispenseMedication(dto, {
      userId: user.userId,
      userRole: user.role,
    });

    res.json({
      success: true,
      data: {
        prescription: result.prescription,
        inventoryReduced: result.inventoryReduced,
        billingRecord: result.billingRecord,
      },
      warnings: result.warnings,
      message: 'Medication dispensed successfully',
    });
  });

  /**
   * Get patient's active prescriptions
   * GET /api/v1/patients/:patientId/prescriptions
   */
  getPatientPrescriptions = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const facilityContext = (req as any).facilityContext;

    const prescriptions = await this.medicationService.getPatientActivePrescriptions(
      patientId,
      facilityContext.facilityId
    );

    res.json({
      success: true,
      data: prescriptions,
      count: prescriptions.length,
    });
  });

  /**
   * Cancel prescription
   * POST /api/v1/prescriptions/:id/cancel
   */
  cancelPrescription = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;
    const facilityContext = (req as any).facilityContext;

    const prescription = await this.medicationService.cancelPrescription(
      id,
      user.userId,
      reason || 'No reason provided',
      facilityContext.facilityId
    );

    res.json({
      success: true,
      data: prescription,
      message: 'Prescription cancelled successfully',
    });
  });
}

export default MedicationController;

