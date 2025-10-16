import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { db } from '../utils/database';

/**
 * Stats Controller
 * Provides statistics endpoints for the medication service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  /**
   * Get active prescriptions count
   * GET /api/v1/stats/prescriptions/active
   */
  async getActivePrescriptionsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM prescriptions 
         WHERE organization_id = ? 
           AND status = 'active'
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved active prescriptions count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting active prescriptions count:', error);
      next(error);
    }
  }

  /**
   * Get medication alerts count
   * GET /api/v1/stats/alerts/count
   */
  async getAlertsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM medication_alerts 
         WHERE organization_id = ? 
           AND status = 'active'
           AND acknowledged_at IS NULL
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved medication alerts count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting medication alerts count:', error);
      next(error);
    }
  }

  /**
   * Get recent alerts
   * GET /api/v1/stats/alerts/recent
   */
  async getRecentAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const alerts = await db.query(
        `SELECT 
          ma.id,
          ma.prescription_id as prescriptionId,
          ma.alert_type as alertType,
          ma.severity,
          ma.message,
          ma.status,
          ma.created_at as createdAt,
          ma.acknowledged_at as acknowledgedAt,
          p.patient_id as patientId,
          m.name as medicationName
         FROM medication_alerts ma
         LEFT JOIN prescriptions p ON ma.prescription_id = p.id
         LEFT JOIN medications m ON p.medication_id = m.id
         WHERE ma.organization_id = ?
           AND ma.deleted_at IS NULL
         ORDER BY ma.created_at DESC
         LIMIT ?`,
        [organizationId, limit]
      );

      logger.info(`Stats: Retrieved ${alerts.length} recent medication alerts for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          alerts,
          count: alerts.length,
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting recent medication alerts:', error);
      next(error);
    }
  }

  /**
   * Get due medications count
   * GET /api/v1/stats/medications/due
   */
  async getDueMedicationsCount(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      const [result] = await db.query(
        `SELECT COUNT(*) as count 
         FROM medication_administrations 
         WHERE organization_id = ? 
           AND status = 'pending'
           AND scheduled_time <= NOW()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved due medications count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting due medications count:', error);
      next(error);
    }
  }

  /**
   * Get all medication stats (combined)
   * GET /api/v1/stats
   */
  async getAllStats(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user?.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_REQUIRED',
            message: 'Organization context required',
          },
        });
      }

      // Get all stats in parallel
      const [activePresResult, alertsResult, dueResult, totalPresResult] = await Promise.all([
        db.query(
          `SELECT COUNT(*) as count FROM prescriptions 
           WHERE organization_id = ? AND status = 'active' AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM medication_alerts 
           WHERE organization_id = ? AND status = 'active' AND acknowledged_at IS NULL AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM medication_administrations 
           WHERE organization_id = ? AND status = 'pending' AND scheduled_time <= NOW() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM prescriptions 
           WHERE organization_id = ? AND deleted_at IS NULL`,
          [organizationId]
        ),
      ]);

      const stats = {
        prescriptions: {
          active: parseInt(activePresResult[0][0]?.count || 0, 10),
          total: parseInt(totalPresResult[0][0]?.count || 0, 10),
        },
        alerts: {
          unacknowledged: parseInt(alertsResult[0][0]?.count || 0, 10),
        },
        administrations: {
          due: parseInt(dueResult[0][0]?.count || 0, 10),
        },
        organizationId,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Stats: Retrieved all medication stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting all medication stats:', error);
      next(error);
    }
  }
}

export const statsController = new StatsController();

