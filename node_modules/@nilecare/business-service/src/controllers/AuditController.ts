/**
 * Audit Controller
 * 
 * PRIORITY 1.1 - Audit Log Management and Compliance
 * 
 * Provides endpoints for:
 * - Querying audit logs (admin/compliance officers)
 * - Generating compliance reports
 * - Monitoring user activity
 * - Tracking data modifications
 * 
 * Access: Admin and Compliance Officer roles ONLY
 */

import { Request, Response } from 'express';
import type mysql from 'mysql2/promise';
import { AuditLogService, AuditAction, AuditResource } from '../services/AuditLogService';
import { logger } from '../utils/logger';
import { getOrganizationId } from '../config/constants';

export class AuditController {
  private auditLogService: AuditLogService;
  
  constructor(db: mysql.Pool) {
    this.auditLogService = new AuditLogService(db);
  }
  
  /**
   * Query audit logs with filters
   * 
   * GET /api/v1/audit/logs
   * 
   * Query Parameters:
   * - userId: Filter by user ID
   * - resource: Filter by resource type (APPOINTMENT, BILLING, etc.)
   * - action: Filter by action (VIEW, CREATE, UPDATE, DELETE, etc.)
   * - startDate: Filter from date
   * - endDate: Filter to date
   * - limit: Number of records (default 100)
   * - offset: Pagination offset
   * 
   * Access: Admin, Compliance Officer
   */
  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const organizationId = getOrganizationId(req.user?.organizationId);
      
      const filters = {
        userId: req.query.userId as string,
        organizationId: organizationId,
        resource: req.query.resource as AuditResource,
        action: req.query.action as AuditAction,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const logs = await this.auditLogService.query(filters);
      
      res.status(200).json({
        success: true,
        data: {
          logs,
          count: logs.length,
          filters
        }
      });
    } catch (error: any) {
      logger.error('Error querying audit logs:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to query audit logs' }
      });
    }
  };
  
  /**
   * Get audit statistics for monitoring
   * 
   * GET /api/v1/audit/stats
   * 
   * Returns:
   * - Total operations by action
   * - Success/failure rates
   * - Most active users
   * - Most accessed resources
   * 
   * Access: Admin, Compliance Officer
   */
  getAuditStats = async (req: Request, res: Response) => {
    try {
      const organizationId = getOrganizationId(req.user?.organizationId);
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      // Query statistics from database
      const [stats]: any = await this.auditLogService['db'].query(`
        SELECT 
          COUNT(*) as total_operations,
          COUNT(DISTINCT user_id) as unique_users,
          SUM(CASE WHEN result = 'SUCCESS' THEN 1 ELSE 0 END) as successful_operations,
          SUM(CASE WHEN result = 'FAILURE' THEN 1 ELSE 0 END) as failed_operations,
          action,
          resource,
          DATE(timestamp) as date
        FROM audit_logs
        WHERE organization_id = ?
          AND timestamp >= ?
          AND timestamp <= ?
        GROUP BY action, resource, DATE(timestamp)
        ORDER BY date DESC, total_operations DESC
      `, [organizationId, startDate, endDate]);
      
      res.status(200).json({
        success: true,
        data: {
          period: {
            startDate,
            endDate
          },
          stats: stats || []
        }
      });
    } catch (error: any) {
      logger.error('Error getting audit stats:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get audit statistics' }
      });
    }
  };
  
  /**
   * Get user activity report
   * 
   * GET /api/v1/audit/users/:userId/activity
   * 
   * Returns all actions performed by a specific user
   * 
   * Access: Admin, Compliance Officer
   */
  getUserActivity = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const organizationId = getOrganizationId(req.user?.organizationId);
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const logs = await this.auditLogService.query({
        userId,
        organizationId,
        limit,
        offset
      });
      
      res.status(200).json({
        success: true,
        data: {
          userId,
          activities: logs,
          count: logs.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting user activity:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get user activity' }
      });
    }
  };
  
  /**
   * Get failed operations (security monitoring)
   * 
   * GET /api/v1/audit/failed
   * 
   * Returns all failed operations for security analysis
   * 
   * Access: Admin, Compliance Officer
   */
  getFailedOperations = async (req: Request, res: Response) => {
    try {
      const organizationId = getOrganizationId(req.user?.organizationId);
      
      const [failedOps]: any = await this.auditLogService['db'].query(`
        SELECT *
        FROM audit_failed_operations
        WHERE organization_id = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `, [organizationId]);
      
      res.status(200).json({
        success: true,
        data: {
          failedOperations: failedOps || [],
          count: failedOps?.length || 0
        }
      });
    } catch (error: any) {
      logger.error('Error getting failed operations:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get failed operations' }
      });
    }
  };
  
  /**
   * Get data modification history
   * 
   * GET /api/v1/audit/modifications
   * 
   * Returns all CREATE/UPDATE/DELETE operations with before/after values
   * 
   * Access: Admin, Compliance Officer
   */
  getModifications = async (req: Request, res: Response) => {
    try {
      const organizationId = getOrganizationId(req.user?.organizationId);
      const resourceId = req.query.resourceId as string;
      const resource = req.query.resource as AuditResource;
      
      const [modifications]: any = await this.auditLogService['db'].query(`
        SELECT *
        FROM audit_modifications
        WHERE organization_id = ?
          ${resourceId ? 'AND resource_id = ?' : ''}
          ${resource ? 'AND resource = ?' : ''}
        ORDER BY timestamp DESC
        LIMIT 100
      `, [organizationId, resourceId, resource].filter(Boolean));
      
      res.status(200).json({
        success: true,
        data: {
          modifications: modifications || [],
          count: modifications?.length || 0
        }
      });
    } catch (error: any) {
      logger.error('Error getting modifications:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get modifications' }
      });
    }
  };
  
  /**
   * Get audit trail for specific resource
   * 
   * GET /api/v1/audit/resource/:resourceType/:resourceId
   * 
   * Returns complete audit trail for a specific resource (e.g., an appointment)
   * 
   * Access: Admin, Compliance Officer, Resource Owner
   */
  getResourceAuditTrail = async (req: Request, res: Response) => {
    try {
      const { resourceType, resourceId } = req.params;
      const organizationId = getOrganizationId(req.user?.organizationId);
      
      const logs = await this.auditLogService.query({
        organizationId,
        resource: resourceType as AuditResource,
        resourceId,
        limit: 1000 // Get complete history
      });
      
      res.status(200).json({
        success: true,
        data: {
          resourceType,
          resourceId,
          auditTrail: logs,
          totalEvents: logs.length
        }
      });
    } catch (error: any) {
      logger.error('Error getting resource audit trail:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get resource audit trail' }
      });
    }
  };
}

