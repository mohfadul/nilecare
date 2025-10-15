import { MedicationRepository } from '../repositories/MedicationRepository';
import { PrescriptionRepository } from '../repositories/PrescriptionRepository';
import { InventoryServiceClient } from './integrations/InventoryServiceClient';
import { BillingServiceClient } from './integrations/BillingServiceClient';
import { logger, logMedicationDispensing } from '../utils/logger';
import { Medication, CreateMedicationDTO, UpdateMedicationDTO } from '../models/Medication';
import { Prescription, CreatePrescriptionDTO, DispensePrescriptionDTO } from '../models/Prescription';
import { ValidationError, NotFoundError, ExternalServiceError } from '../middleware/errorHandler';

/**
 * Medication Service
 * Core business logic for medication management, prescriptions, and dispensing
 */

export class MedicationService {
  private medicationRepo: MedicationRepository;
  private prescriptionRepo: PrescriptionRepository;
  private inventoryClient: InventoryServiceClient;
  private billingClient: BillingServiceClient;

  constructor() {
    this.medicationRepo = new MedicationRepository();
    this.prescriptionRepo = new PrescriptionRepository();
    this.inventoryClient = new InventoryServiceClient();
    this.billingClient = new BillingServiceClient();
  }

  /**
   * Create new medication
   */
  async createMedication(dto: CreateMedicationDTO): Promise<Medication> {
    logger.info('Creating new medication', { name: dto.name, facilityId: dto.facilityId });
    return await this.medicationRepo.create(dto);
  }

  /**
   * Get medication by ID
   */
  async getMedicationById(id: string, facilityId?: string): Promise<Medication> {
    const medication = await this.medicationRepo.findById(id, facilityId);
    
    if (!medication) {
      throw new NotFoundError(`Medication not found: ${id}`);
    }

    return medication;
  }

  /**
   * Search medications
   */
  async searchMedications(
    searchTerm: string,
    facilityId: string,
    limit: number = 20
  ): Promise<Medication[]> {
    return await this.medicationRepo.search(searchTerm, facilityId, limit);
  }

  /**
   * Update medication
   */
  async updateMedication(
    id: string,
    dto: UpdateMedicationDTO,
    facilityId?: string
  ): Promise<Medication> {
    const medication = await this.medicationRepo.update(id, dto, facilityId);
    
    if (!medication) {
      throw new NotFoundError(`Medication not found or access denied: ${id}`);
    }

    logger.info('Medication updated', { medicationId: id, facilityId });
    return medication;
  }

  /**
   * Create prescription
   */
  async createPrescription(dto: CreatePrescriptionDTO): Promise<Prescription> {
    // Verify medication exists
    const medication = await this.getMedicationById(dto.medicationId, dto.facilityId);

    if (medication.status !== 'active') {
      throw new ValidationError(`Medication is not active: ${medication.name}`);
    }

    // Check if controlled substance - may require additional validations
    if (medication.isControlledSubstance) {
      logger.warn('Controlled substance prescribed', {
        medicationId: dto.medicationId,
        patientId: dto.patientId,
        providerId: dto.providerId,
        schedule: medication.controlledSubstanceSchedule,
      });
    }

    // Create prescription
    const prescription = await this.prescriptionRepo.create(dto);

    logger.info('Prescription created', {
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: dto.patientId,
      medicationId: dto.medicationId,
    });

    return prescription;
  }

  /**
   * Dispense medication from prescription
   * This is the main workflow that integrates with Inventory and Billing services
   */
  async dispenseMedication(dto: DispensePrescriptionDTO, dispensingUser: {
    userId: string;
    userRole: string;
  }): Promise<{
    prescription: Prescription;
    inventoryReduced: boolean;
    billingRecord?: any;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // 1. Get and validate prescription
    const prescription = await this.prescriptionRepo.findById(dto.prescriptionId, dto.facilityId);
    
    if (!prescription) {
      throw new NotFoundError(`Prescription not found: ${dto.prescriptionId}`);
    }

    if (prescription.status === 'cancelled') {
      throw new ValidationError('Cannot dispense cancelled prescription');
    }

    if (prescription.status === 'completed') {
      throw new ValidationError('Prescription already completed');
    }

    if (prescription.refillsRemaining <= 0) {
      throw new ValidationError('No refills remaining on prescription');
    }

    // 2. Get medication details
    const medication = await this.getMedicationById(prescription.medicationId, dto.facilityId);

    // 3. Check inventory availability
    logger.info('Checking inventory for dispensing', {
      medicationId: medication.id,
      quantity: dto.quantity,
      facilityId: dto.facilityId,
    });

    const stockCheck = await this.inventoryClient.checkStock(
      medication.id,
      dto.quantity,
      dto.facilityId
    );

    if (!stockCheck) {
      throw new ExternalServiceError('Inventory service unavailable');
    }

    if (!stockCheck.available || stockCheck.outOfStock) {
      throw new ValidationError(`Insufficient stock for ${medication.name}. Available: ${stockCheck.availableStock}, Requested: ${dto.quantity}`);
    }

    if (stockCheck.lowStock) {
      warnings.push(`Low stock warning: ${medication.name} has only ${stockCheck.availableStock} units remaining`);
    }

    // 4. Reduce inventory
    logger.info('Reducing inventory stock', {
      medicationId: medication.id,
      quantity: dto.quantity,
    });

    const inventoryReduced = await this.inventoryClient.reduceStock(
      medication.id,
      dto.quantity,
      dto.facilityId,
      `Dispensed for prescription ${prescription.prescriptionNumber}`,
      {
        type: 'dispensing',
        id: prescription.id,
      },
      dto.dispensedBy
    );

    if (!inventoryReduced) {
      throw new ExternalServiceError('Failed to reduce inventory stock');
    }

    // 5. Get medication price and create billing record
    logger.info('Creating billing record', {
      patientId: prescription.patientId,
      medicationId: medication.id,
    });

    let billingRecord = null;
    const medicationPrice = await this.billingClient.getMedicationPrice(medication.id, dto.facilityId);

    if (medicationPrice) {
      billingRecord = await this.billingClient.createMedicationCharge({
        patientId: prescription.patientId,
        facilityId: dto.facilityId,
        prescriptionId: prescription.id,
        medicationId: medication.id,
        medicationName: medication.name,
        quantity: dto.quantity,
        unitPrice: medicationPrice,
        dispensedBy: dto.dispensedBy,
        encounterId: prescription.encounterId,
        notes: `Dispensed: ${dto.quantity} units of ${medication.name}`,
      });

      if (!billingRecord) {
        warnings.push('Billing record creation failed - manual billing may be required');
      }
    } else {
      warnings.push('Medication price not found in charge master - manual billing required');
    }

    // 6. Update prescription status
    const updatedPrescription = await this.prescriptionRepo.markAsDispensed(
      prescription.id,
      dto.facilityId
    );

    if (!updatedPrescription) {
      throw new Error('Failed to update prescription status');
    }

    // 7. Log the dispensing action for audit/compliance
    logMedicationDispensing({
      userId: dispensingUser.userId,
      userRole: dispensingUser.userRole,
      patientId: prescription.patientId,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: prescription.dosage,
      quantity: dto.quantity,
      prescriptionId: prescription.id,
      verificationMethod: 'manual',
      facilityId: dto.facilityId,
    });

    logger.info('Medication dispensed successfully', {
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      medicationId: medication.id,
      quantity: dto.quantity,
      billingRecordCreated: !!billingRecord,
    });

    return {
      prescription: updatedPrescription,
      inventoryReduced: true,
      billingRecord,
      warnings,
    };
  }

  /**
   * Get patient's active prescriptions
   */
  async getPatientActivePrescriptions(patientId: string, facilityId: string): Promise<Prescription[]> {
    return await this.prescriptionRepo.findByPatient(patientId, facilityId, { active: true });
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(
    prescriptionId: string,
    cancelledBy: string,
    reason: string,
    facilityId: string
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepo.cancel(prescriptionId, cancelledBy, reason, facilityId);
    
    if (!prescription) {
      throw new NotFoundError(`Prescription not found or access denied: ${prescriptionId}`);
    }

    logger.info('Prescription cancelled', { prescriptionId, reason, cancelledBy });
    return prescription;
  }
}

export default MedicationService;

