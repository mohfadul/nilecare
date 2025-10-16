import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { db } from '../utils/database';

/**
 * Stats Controller
 * Provides statistics endpoints for the lab service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  /**
   * Get pending lab orders count
   * GET /api/v1/stats/orders/pending
   */
  async getPendingOrdersCount(req: Request, res: Response, next: NextFunction) {
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
         FROM lab_orders 
         WHERE organization_id = ? 
           AND status IN ('pending', 'in_progress')
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved pending orders count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting pending orders count:', error);
      next(error);
    }
  }

  /**
   * Get critical results count
   * GET /api/v1/stats/results/critical
   */
  async getCriticalResultsCount(req: Request, res: Response, next: NextFunction) {
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
         FROM lab_results 
         WHERE organization_id = ? 
           AND is_critical = 1
           AND acknowledged_at IS NULL
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved critical results count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting critical results count:', error);
      next(error);
    }
  }

  /**
   * Get today's lab orders
   * GET /api/v1/stats/orders/today
   */
  async getTodayOrdersCount(req: Request, res: Response, next: NextFunction) {
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
         FROM lab_orders 
         WHERE organization_id = ? 
           AND DATE(created_at) = CURDATE()
           AND deleted_at IS NULL`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved today orders count ${count} for org ${organizationId}`);

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
      logger.error('Error getting today orders count:', error);
      next(error);
    }
  }

  /**
   * Get recent critical results
   * GET /api/v1/stats/results/critical/recent
   */
  async getRecentCriticalResults(req: Request, res: Response, next: NextFunction) {
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

      const results = await db.query(
        `SELECT 
          lr.id,
          lr.lab_order_id as labOrderId,
          lr.test_name as testName,
          lr.result_value as resultValue,
          lr.unit,
          lr.reference_range as referenceRange,
          lr.is_critical as isCritical,
          lr.critical_notes as criticalNotes,
          lr.resulted_at as resultedAt,
          lr.acknowledged_at as acknowledgedAt,
          lo.patient_id as patientId,
          lo.order_number as orderNumber
         FROM lab_results lr
         LEFT JOIN lab_orders lo ON lr.lab_order_id = lo.id
         WHERE lr.organization_id = ?
           AND lr.is_critical = 1
           AND lr.deleted_at IS NULL
         ORDER BY lr.resulted_at DESC
         LIMIT ?`,
        [organizationId, limit]
      );

      logger.info(`Stats: Retrieved ${results.length} recent critical results for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          results,
          count: results.length,
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting recent critical results:', error);
      next(error);
    }
  }

  /**
   * Get all lab stats (combined)
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
      const [pendingResult, criticalResult, todayResult, completedResult] = await Promise.all([
        db.query(
          `SELECT COUNT(*) as count FROM lab_orders 
           WHERE organization_id = ? AND status IN ('pending', 'in_progress') AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM lab_results 
           WHERE organization_id = ? AND is_critical = 1 AND acknowledged_at IS NULL AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM lab_orders 
           WHERE organization_id = ? AND DATE(created_at) = CURDATE() AND deleted_at IS NULL`,
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(*) as count FROM lab_orders 
           WHERE organization_id = ? AND status = 'completed' AND deleted_at IS NULL`,
          [organizationId]
        ),
      ]);

      const stats = {
        orders: {
          pending: parseInt(pendingResult[0][0]?.count || 0, 10),
          today: parseInt(todayResult[0][0]?.count || 0, 10),
          completed: parseInt(completedResult[0][0]?.count || 0, 10),
        },
        results: {
          criticalUnacknowledged: parseInt(criticalResult[0][0]?.count || 0, 10),
        },
        organizationId,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Stats: Retrieved all lab stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting all lab stats:', error);
      next(error);
    }
  }
}

export const statsController = new StatsController();

