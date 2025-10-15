import { Request, Response } from 'express';
import { PatientService } from '../services/PatientService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { EventPublisher } from '../events/EventPublisher';

export class PatientController {
  private patientService: PatientService;
  private eventPublisher: EventPublisher;

  constructor() {
    this.patientService = new PatientService();
    this.eventPublisher = new EventPublisher();
  }

  /**
   * Get all patients with pagination and search
   */
  getAllPatients = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, sort = 'createdAt', order = 'desc' } = req.query;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const result = await this.patientService.getAllPatients({
        organizationId,
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        sort: sort as string,
        order: order as 'asc' | 'desc'
      });

      logger.info(`Retrieved ${result.patients.length} patients for organization ${organizationId}`);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting patients:', error);
      throw error;
    }
  };

  /**
   * Get patient by ID
   */
  getPatientById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const patient = await this.patientService.getPatientById(id, organizationId);

      if (!patient) {
        throw createError('Patient not found', 404);
      }

      logger.info(`Retrieved patient ${id} for organization ${organizationId}`);

      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error(`Error getting patient ${req.params.id}:`, error);
      throw error;
    }
  };

  /**
   * Create a new patient
   */
  createPatient = async (req: Request, res: Response) => {
    try {
      const patientData = {
        ...req.body,
        organizationId: req.user?.organizationId,
        createdBy: req.user?.userId
      };

      // Validate required fields
      if (!patientData.organizationId) {
        throw createError('Organization context required', 400);
      }

      if (!patientData.createdBy) {
        throw createError('User context required', 400);
      }

      const patient = await this.patientService.createPatient(patientData);

      // Publish patient created event
      await this.eventPublisher.publishEvent('patient.created', {
        patientId: patient.id,
        organizationId: patient.organizationId,
        createdBy: patient.createdBy,
        timestamp: new Date().toISOString()
      });

      logger.info(`Created patient ${patient.id} for organization ${patientData.organizationId}`);

      res.status(201).json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error('Error creating patient:', error);
      throw error;
    }
  };

  /**
   * Update patient
   */
  updatePatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const organizationId = req.user?.organizationId;
      const updatedBy = req.user?.userId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      if (!updatedBy) {
        throw createError('User context required', 400);
      }

      const patient = await this.patientService.updatePatient(id, {
        ...updateData,
        organizationId,
        updatedBy
      });

      if (!patient) {
        throw createError('Patient not found', 404);
      }

      // Publish patient updated event
      await this.eventPublisher.publishEvent('patient.updated', {
        patientId: patient.id,
        organizationId: patient.organizationId,
        updatedBy,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      logger.info(`Updated patient ${id} for organization ${organizationId}`);

      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      logger.error(`Error updating patient ${req.params.id}:`, error);
      throw error;
    }
  };

  /**
   * Delete patient
   */
  deletePatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      const deletedBy = req.user?.userId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      if (!deletedBy) {
        throw createError('User context required', 400);
      }

      const deleted = await this.patientService.deletePatient(id, organizationId);

      if (!deleted) {
        throw createError('Patient not found', 404);
      }

      // Publish patient deleted event
      await this.eventPublisher.publishEvent('patient.deleted', {
        patientId: id,
        organizationId,
        deletedBy,
        timestamp: new Date().toISOString()
      });

      logger.info(`Deleted patient ${id} for organization ${organizationId}`);

      res.status(200).json({
        success: true,
        message: 'Patient deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting patient ${req.params.id}:`, error);
      throw error;
    }
  };

  /**
   * Get patient encounters
   */
  getPatientEncounters = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      // Check if patient exists and belongs to organization
      const patient = await this.patientService.getPatientById(id, organizationId);
      if (!patient) {
        throw createError('Patient not found', 404);
      }

      const encounters = await this.patientService.getPatientEncounters(id, {
        page: Number(page),
        limit: Number(limit)
      });

      logger.info(`Retrieved ${encounters.length} encounters for patient ${id}`);

      res.status(200).json({
        success: true,
        data: {
          patientId: id,
          encounters
        }
      });
    } catch (error) {
      logger.error(`Error getting encounters for patient ${req.params.id}:`, error);
      throw error;
    }
  };
}
