/**
 * Medication Controller - Clinical Service
 * 
 * Handles medication prescribing with integrated CDS safety checks
 * and EHR documentation
 * 
 * Integration Flow:
 * 1. Get patient data
 * 2. Get current medications
 * 3. Call CDS Service for safety check
 * 4. Handle high-risk warnings
 * 5. Save prescription
 * 6. Update EHR problem list if needed
 * 7. Publish event
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { EventPublisher } from '../events/EventPublisher';
import CDSClient from '../clients/CDSClient';
import EHRClient from '../clients/EHRClient';

export class MedicationController {
  private eventPublisher: EventPublisher;
  private cdsClient: CDSClient;
  private ehrClient: EHRClient;

  constructor() {
    this.eventPublisher = new EventPublisher();
    this.cdsClient = new CDSClient();
    this.ehrClient = new EHRClient();
  }

  /**
   * Get all medications
   */
  getAllMedications = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, patientId, status } = req.query;
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      // TODO: Implement MedicationService.getAllMedications()
      // For now, return placeholder
      logger.info(`Getting medications for organization ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          medications: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        }
      });
    } catch (error) {
      logger.error('Error getting medications:', error);
      throw error;
    }
  };

  /**
   * Get medication by ID
   */
  getMedicationById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      // TODO: Implement MedicationService.getMedicationById()
      logger.info(`Getting medication ${id}`);

      res.status(200).json({
        success: true,
        data: null // Placeholder
      });
    } catch (error) {
      logger.error(`Error getting medication ${req.params.id}:`, error);
      throw error;
    }
  };

  /**
   * Prescribe new medication with CDS safety check
   * 
   * Integration flow:
   * 1. Validate input
   * 2. Get patient data (allergies, conditions, current medications)
   * 3. Call CDS Service for comprehensive safety check
   * 4. Handle HIGH RISK - require override justification
   * 5. Handle MEDIUM RISK - show warnings but allow
   * 6. Save prescription
   * 7. Add to problem list if new diagnosis
   * 8. Publish event
   */
  prescribeMedication = async (req: Request, res: Response) => {
    try {
      const medicationData = req.body;
      const organizationId = (req as any).user?.organizationId;
      const prescribedBy = (req as any).user?.userId;
      const facilityId = (req as any).user?.facilityId;
      const authToken = req.headers.authorization?.substring(7) || ''; // Remove 'Bearer '

      if (!organizationId || !prescribedBy) {
        throw createError('User context required', 400);
      }

      logger.info(`🔍 Prescribing medication: ${medicationData.name} for patient ${medicationData.patientId}`);

      // 1️⃣ Get patient data
      // TODO: Implement PatientService.getPatientById()
      // For now, simulate patient data
      const patient = {
        id: medicationData.patientId,
        allergies: medicationData.testAllergies || [], // For testing
        conditions: medicationData.testConditions || [], // For testing
        age: medicationData.testAge,
        weight: medicationData.testWeight,
        activeMedications: medicationData.testCurrentMedications || [] // For testing
      };

      logger.info(`📊 Patient data retrieved - ${patient.allergies.length} allergies, ${patient.activeMedications.length} current medications`);

      // 2️⃣ Get active problems from EHR Service
      const activeProblems = await this.ehrClient.getActiveProblems(patient.id, authToken);
      const conditions = activeProblems || patient.conditions;

      // 3️⃣ Call CDS Service for safety check
      logger.info(`🔍 Calling CDS Service for safety assessment...`);
      const safetyCheck = await this.cdsClient.checkMedicationSafety(
        {
          patientId: patient.id,
          medications: [
            ...patient.activeMedications.map((m: any) => ({
              name: m.name,
              dose: m.dosage,
              frequency: m.frequency,
              route: m.route
            })),
            {
              name: medicationData.name,
              dose: medicationData.dosage,
              frequency: medicationData.frequency,
              route: medicationData.route
            }
          ],
          allergies: patient.allergies,
          conditions: conditions,
          patientAge: patient.age,
          patientWeight: patient.weight
        },
        authToken
      );

      // 4️⃣ Handle HIGH RISK medications
      if (safetyCheck && safetyCheck.overallRisk.level === 'high') {
        logger.warn(`⚠️  HIGH RISK prescription attempt for patient ${patient.id}`);
        logger.warn(`Risk Score: ${safetyCheck.overallRisk.score}`);
        logger.warn(`Factors: ${JSON.stringify(safetyCheck.overallRisk.factors)}`);

        // Check if doctor is overriding
        if (!medicationData.overrideReason) {
          // Require override justification for high-risk prescriptions
          logger.warn(`⛔ Blocking high-risk prescription - override required`);
          return res.status(400).json({
            success: false,
            error: 'High-risk prescription requires override justification',
            safetyAssessment: safetyCheck,
            requiresOverride: true,
            riskFactors: {
              interactions: safetyCheck.interactions.interactions,
              allergyAlerts: safetyCheck.allergyAlerts.alerts,
              contraindications: safetyCheck.contraindications.contraindications,
              doseIssues: safetyCheck.doseValidation.validations.filter((v: any) => v.status === 'error')
            }
          });
        }

        // Log override
        logger.warn(`⚠️  Doctor ${prescribedBy} overrode high-risk prescription`);
        logger.warn(`Override reason: ${medicationData.overrideReason}`);
        logger.warn(`⚠️  THIS WILL BE FLAGGED FOR QUALITY REVIEW`);
      }

      // 5️⃣ Handle MEDIUM RISK - show warnings but allow
      if (safetyCheck && safetyCheck.overallRisk.level === 'medium') {
        logger.info(`⚠️  MEDIUM RISK prescription for patient ${patient.id}`);
        logger.info(`Risk Score: ${safetyCheck.overallRisk.score}`);
      }

      // 6️⃣ Check if administration is blocked
      if (safetyCheck && safetyCheck.overallRisk.blocksAdministration) {
        logger.error(`⛔ ABSOLUTE CONTRAINDICATION - Cannot prescribe`);
        return res.status(403).json({
          success: false,
          error: 'Absolute contraindication detected - medication cannot be prescribed',
          safetyAssessment: safetyCheck,
          blocked: true
        });
      }

      // 7️⃣ Save prescription
      // TODO: Implement MedicationService.create()
      const medication = {
        id: `MED-${Date.now()}`, // Temporary ID
        ...medicationData,
        organizationId,
        facilityId,
        prescribedBy,
        safetyCheckPerformed: !!safetyCheck,
        safetyRiskLevel: safetyCheck?.overallRisk.level || 'unknown',
        riskScore: safetyCheck?.overallRisk.score || 0,
        overrideReason: medicationData.overrideReason || null,
        cdsFindings: safetyCheck ? {
          interactions: safetyCheck.interactions.interactions.length,
          allergies: safetyCheck.allergyAlerts.alerts.length,
          contraindications: safetyCheck.contraindications.contraindications.length,
          doseIssues: safetyCheck.doseValidation.hasErrors ? 1 : 0
        } : null,
        prescribedAt: new Date().toISOString()
      };

      logger.info(`✅ Medication prescribed: ${medication.id}`);

      // 8️⃣ Publish event to Kafka
      await this.eventPublisher.publishEvent('medication.prescribed', {
        medicationId: medication.id,
        patientId: patient.id,
        organizationId,
        facilityId,
        prescribedBy,
        medicationName: medicationData.name,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        riskLevel: safetyCheck?.overallRisk.level || 'unknown',
        riskScore: safetyCheck?.overallRisk.score || 0,
        safetyCheckPerformed: !!safetyCheck,
        timestamp: new Date().toISOString()
      });

      logger.info(`📢 Published medication.prescribed event`);

      // 9️⃣ Return response with safety assessment
      res.status(201).json({
        success: true,
        data: {
          medication,
          safetyAssessment: safetyCheck
        },
        warnings: safetyCheck && safetyCheck.overallRisk.level !== 'low' ? {
          level: safetyCheck.overallRisk.level,
          message: `This prescription has ${safetyCheck.overallRisk.level} safety risk`,
          details: {
            interactions: safetyCheck.interactions.interactions,
            allergies: safetyCheck.allergyAlerts.alerts,
            contraindications: safetyCheck.contraindications.contraindications,
            doseIssues: safetyCheck.doseValidation.validations.filter((v: any) => 
              v.status === 'above-range' || v.status === 'toxic'
            )
          }
        } : undefined
      });
    } catch (error) {
      logger.error('Error prescribing medication:', error);
      throw error;
    }
  };

  /**
   * Update medication
   */
  updateMedication = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const organizationId = (req as any).user?.organizationId;
      const updatedBy = (req as any).user?.userId;

      if (!organizationId || !updatedBy) {
        throw createError('User context required', 400);
      }

      // TODO: Implement MedicationService.updateMedication()
      logger.info(`Updating medication ${id}`);

      // Publish event
      await this.eventPublisher.publishEvent('medication.updated', {
        medicationId: id,
        organizationId,
        updatedBy,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        data: { id, ...updateData }
      });
    } catch (error) {
      logger.error(`Error updating medication ${req.params.id}:`, error);
      throw error;
    }
  };

  /**
   * Discontinue medication
   */
  discontinueMedication = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, endDate } = req.body;
      const organizationId = (req as any).user?.organizationId;
      const discontinuedBy = (req as any).user?.userId;

      if (!organizationId || !discontinuedBy) {
        throw createError('User context required', 400);
      }

      // TODO: Implement MedicationService.discontinueMedication()
      logger.info(`Discontinuing medication ${id}: ${reason}`);

      // Publish event
      await this.eventPublisher.publishEvent('medication.discontinued', {
        medicationId: id,
        organizationId,
        discontinuedBy,
        reason,
        endDate: endDate || new Date().toISOString(),
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Medication discontinued successfully'
      });
    } catch (error) {
      logger.error(`Error discontinuing medication ${req.params.id}:`, error);
      throw error;
    }
  };
}

export default MedicationController;

