import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { db } from '../config/database';

/**
 * Stats Controller
 * Provides statistics endpoints for the auth service
 * Used by main-nilecare orchestrator for dashboard data
 */
export class StatsController {
  /**
   * Get users count
   * GET /api/v1/stats/users/count
   */
  async getUsersCount(req: Request, res: Response, next: NextFunction) {
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
        'SELECT COUNT(*) as count FROM users WHERE organization_id = ? AND deleted_at IS NULL',
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved users count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting users count:', error);
      next(error);
    }
  }

  /**
   * Get active users count (logged in within last 24 hours)
   * GET /api/v1/stats/users/active
   */
  async getActiveUsersCount(req: Request, res: Response, next: NextFunction) {
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
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM user_sessions 
         WHERE organization_id = ? 
           AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR)
           AND status = 'active'`,
        [organizationId]
      );

      const count = result[0]?.count || 0;

      logger.info(`Stats: Retrieved active users count ${count} for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          count: parseInt(count, 10),
          organizationId,
          period: '24h',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting active users count:', error);
      next(error);
    }
  }

  /**
   * Get users by role count
   * GET /api/v1/stats/users/by-role
   */
  async getUsersByRole(req: Request, res: Response, next: NextFunction) {
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

      const results = await db.query(
        `SELECT 
          r.name as role, 
          COUNT(ur.user_id) as count
         FROM roles r
         LEFT JOIN user_roles ur ON r.id = ur.role_id
         LEFT JOIN users u ON ur.user_id = u.id
         WHERE u.organization_id = ? 
           AND u.deleted_at IS NULL
         GROUP BY r.id, r.name
         ORDER BY count DESC`,
        [organizationId]
      );

      logger.info(`Stats: Retrieved users by role for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          roles: results,
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting users by role:', error);
      next(error);
    }
  }

  /**
   * Get recent login activity
   * GET /api/v1/stats/logins/recent
   */
  async getRecentLogins(req: Request, res: Response, next: NextFunction) {
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

      const logins = await db.query(
        `SELECT 
          al.id,
          al.user_id as userId,
          u.email,
          u.first_name as firstName,
          u.last_name as lastName,
          al.action,
          al.ip_address as ipAddress,
          al.user_agent as userAgent,
          al.created_at as timestamp
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.organization_id = ?
           AND al.action IN ('login.success', 'login.mfa.success')
         ORDER BY al.created_at DESC
         LIMIT ?`,
        [organizationId, limit]
      );

      logger.info(`Stats: Retrieved ${logins.length} recent logins for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: {
          logins,
          count: logins.length,
          organizationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error getting recent logins:', error);
      next(error);
    }
  }

  /**
   * Get all auth stats (combined)
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
      const [totalUsersResult, activeUsersResult, mfaEnabledResult] = await Promise.all([
        db.query(
          'SELECT COUNT(*) as count FROM users WHERE organization_id = ? AND deleted_at IS NULL',
          [organizationId]
        ),
        db.query(
          `SELECT COUNT(DISTINCT user_id) as count 
           FROM user_sessions 
           WHERE organization_id = ? 
             AND last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR)
             AND status = 'active'`,
          [organizationId]
        ),
        db.query(
          'SELECT COUNT(*) as count FROM users WHERE organization_id = ? AND mfa_enabled = 1 AND deleted_at IS NULL',
          [organizationId]
        ),
      ]);

      const stats = {
        users: {
          total: parseInt(totalUsersResult[0][0]?.count || 0, 10),
          active24h: parseInt(activeUsersResult[0][0]?.count || 0, 10),
          mfaEnabled: parseInt(mfaEnabledResult[0][0]?.count || 0, 10),
        },
        organizationId,
        timestamp: new Date().toISOString(),
      };

      logger.info(`Stats: Retrieved all auth stats for org ${organizationId}`);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting all stats:', error);
      next(error);
    }
  }
}

export const statsController = new StatsController();

