import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { db } from '../../../shared/database/connection';

/**
 * Stats Controller
 * Provides statistics endpoints for the appointment service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  /**
   * Get today's appointments count
   * GET /api/v1/stats/appointments/today
   */
  async getTodayAppointmentsCount(req: Request, res: Response, next: NextFunction) {
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
         FROM appointments 
         WHERE organization_id = ? 
           AND DATE(scheduled_at) = CURDATE()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved today appointments count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting today appointments count:', error);
      next(error);
    }
  }

  /**
   * Get today's appointments details
   * GET /api/v1/stats/appointments/today/details
   */
  async getTodayAppointments(req: Request, res: Response, next: NextFunction) {
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

      const appointments = await db.query(
        `SELECT 
          a.id,
          a.patient_id as patientId,
          a.provider_id as providerId,
          a.appointment_type as type,
          a.status,
          a.scheduled_at as scheduledAt,
          a.duration,
          a.reason,
          p.first_name as patientFirstName,
          p.last_name as patientLastName,
          u.first_name as providerFirstName,
          u.last_name as providerLastName
         FROM appointments a
         LEFT JOIN patients p ON a.patient_id = p.id
         LEFT JOIN users u ON a.provider_id = u.id
         WHERE a.organization_id = ?
           AND DATE(a.scheduled_at) = CURDATE()
           AND a.deleted_at IS NULL
         ORDER BY a.scheduled_at ASC`,
        [organizationId]
      );

      logger.info(`Stats: Retrieved ${appointments.length} appointments for today for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          appointments,
          count: appointments.length,
          organizationId,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting today appointments:', error);
      next(error);
    }
  }

  /**
   * Get pending appointments count
   * GET /api/v1/stats/appointments/pending
   */
  async getPendingAppointmentsCount(req: Request, res: Response, next: NextFunction) {
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
         FROM appointments 
         WHERE organization_id = ? 
           AND status = 'pending'
           AND scheduled_at >= NOW()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved pending appointments count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting pending appointments count:', error);
      next(error);
    }
  }

  /**
   * Get upcoming appointments (next 7 days)
   * GET /api/v1/stats/appointments/upcoming
   */
  async getUpcomingAppointmentsCount(req: Request, res: Response, next: NextFunction) {
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
         FROM appointments 
         WHERE organization_id = ? 
           AND scheduled_at >= NOW()
           AND scheduled_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved upcoming appointments count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          period: '7 days',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting upcoming appointments count:', error);
      next(error);
    }
  }

  /**
   * Get cancelled appointments count (today)
   * GET /api/v1/stats/appointments/cancelled
   */
  async getCancelledAppointmentsCount(req: Request, res: Response, next: NextFunction) {
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
         FROM appointments 
         WHERE organization_id = ? 
           AND status = 'cancelled'
           AND DATE(updated_at) = CURDATE()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved cancelled appointments count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting cancelled appointments count:', error);
      next(error);
    }
  }

  /**
   * Get all appointment stats (combined)
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
      const [todayResult, pendingResult, upcomingResult, cancelledResult, totalResult] = await Promise.all([
        db.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE organization_id = ? AND DATE(scheduled_at) = CURDATE() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE organization_id = ? AND status = 'pending' AND scheduled_at >= NOW() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE organization_id = ? AND scheduled_at >= NOW() AND scheduled_at <= DATE_ADD(NOW(), INTERVAL 7 DAY) AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE organization_id = ? AND status = 'cancelled' AND DATE(updated_at) = CURDATE() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE organization_id = ? AND deleted_at IS NULL`,
          [organizationId]
        ),
      ]);

      const stats = {
        appointments: {
          today: parseInt(todayResult[0][0]?.count || 0, 10),
          pending: parseInt(pendingResult[0][0]?.count || 0, 10),
          upcoming7Days: parseInt(upcomingResult[0][0]?.count || 0, 10),
          cancelledToday: parseInt(cancelledResult[0][0]?.count || 0, 10),
          total: parseInt(totalResult[0][0]?.count || 0, 10),
        },
        organizationId,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Stats: Retrieved all appointment stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting all appointment stats:', error);
      next(error);
    }
  }
}

export const statsController = new StatsController();

