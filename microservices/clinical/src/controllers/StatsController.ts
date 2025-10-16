import { Request, Response } from 'express';
import { PatientService } from '../services/PatientService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { db } from '../../../shared/database/connection';

/**
 * Stats Controller
 * Provides statistics endpoints for the clinical service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  /**
   * Get patients count
   * GET /api/v1/stats/patients/count
   */
  getPatientsCount = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const [result] = await db.query(
        'SELECT COUNT(*) as count FROM patients WHERE organization_id = ? AND deleted_at IS NULL',
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved patients count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting patients count:', error);
      throw error;
    }
  };

  /**
   * Get recent patients
   * GET /api/v1/stats/patients/recent
   */
  getRecentPatients = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const patients = await db.query(
        `SELECT 
          id, 
          first_name as firstName, 
          last_name as lastName, 
          date_of_birth as dateOfBirth, 
          gender, 
          phone_number as phoneNumber, 
          email, 
          created_at as createdAt
        FROM patients 
        WHERE organization_id = ? 
          AND deleted_at IS NULL
        ORDER BY created_at DESC 
        LIMIT ?`,
        [organizationId, limit]
      );

      logger.info(`Stats: Retrieved ${patients.length} recent patients for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          patients,
          count: patients.length,
          organizationId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting recent patients:', error);
      throw error;
    }
  };

  /**
   * Get encounters count
   * GET /api/v1/stats/encounters/count
   */
  getEncountersCount = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const [result] = await db.query(
        'SELECT COUNT(*) as count FROM encounters WHERE organization_id = ? AND deleted_at IS NULL',
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved encounters count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting encounters count:', error);
      throw error;
    }
  };

  /**
   * Get today's encounters
   * GET /api/v1/stats/encounters/today
   */
  getTodayEncounters = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const encounters = await db.query(
        `SELECT 
          e.id,
          e.patient_id as patientId,
          e.encounter_type as type,
          e.status,
          e.scheduled_at as scheduledAt,
          e.started_at as startedAt,
          e.ended_at as endedAt,
          p.first_name as patientFirstName,
          p.last_name as patientLastName
        FROM encounters e
        LEFT JOIN patients p ON e.patient_id = p.id
        WHERE e.organization_id = ?
          AND e.deleted_at IS NULL
          AND DATE(e.scheduled_at) = CURDATE()
        ORDER BY e.scheduled_at ASC`,
        [organizationId]
      );

      logger.info(`Stats: Retrieved ${encounters.length} encounters for today for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          encounters,
          count: encounters.length,
          organizationId,
          date: today.toISOString().split('T')[0],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting today encounters:', error);
      throw error;
    }
  };

  /**
   * Get all clinical stats (combined)
   * GET /api/v1/stats
   */
  getAllStats = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        throw createError('Organization context required', 400);
      }

      // Get all stats in parallel
      const [patientsResult, encountersResult, todayEncountersResult] = await Promise.all([
        db.query(
          'SELECT COUNT(*) as count FROM patients WHERE organization_id = ? AND deleted_at IS NULL',
          [organizationId]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM encounters WHERE organization_id = ? AND deleted_at IS NULL',
          [organizationId]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM encounters WHERE organization_id = ? AND deleted_at IS NULL AND DATE(scheduled_at) = CURDATE()',
          [organizationId]
        )
      ]);

      const stats = {
        patients: {
          total: parseInt(patientsResult[0][0]?.count || 0, 10)
        },
        encounters: {
          total: parseInt(encountersResult[0][0]?.count || 0, 10),
          today: parseInt(todayEncountersResult[0][0]?.count || 0, 10)
        },
        organizationId,
        timestamp: new Date().toISOString()
      };

      logger.info(`Stats: Retrieved all clinical stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting all stats:', error);
      throw error;
    }
  };
}

