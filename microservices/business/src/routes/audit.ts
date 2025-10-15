/**
 * Audit Log Routes
 * 
 * PRIORITY 1.1 - Compliance and Security Audit Logging
 * 
 * Access Control:
 * - All endpoints require authentication
 * - Most endpoints require admin or compliance_officer role
 * - Resource-specific audit trails accessible to resource owners
 */

import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuditController } from '../controllers/AuditController';
import type mysql from 'mysql2/promise';

/**
 * Factory function to create audit routes with database pool
 */
export function createAuditRoutes(db: mysql.Pool) {
  const router = Router();
  const auditController = new AuditController(db);
  
  /**
   * @swagger
   * /api/v1/audit/logs:
   *   get:
   *     summary: Query audit logs
   *     description: Get filtered audit logs for compliance and security review
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         description: Filter by user ID
   *       - in: query
   *         name: resource
   *         schema:
   *           type: string
   *           enum: [APPOINTMENT, BILLING, SCHEDULE, STAFF]
   *         description: Filter by resource type
   *       - in: query
   *         name: action
   *         schema:
   *           type: string
   *           enum: [VIEW, LIST, CREATE, UPDATE, DELETE, CANCEL, APPROVE]
   *         description: Filter by action
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter from date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter to date
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Number of records
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Pagination offset
   *     responses:
   *       200:
   *         description: Audit logs retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin or Compliance Officer role required
   */
  router.get(
    '/logs',
    requireRole(['admin', 'compliance_officer']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getAuditLogs)
  );
  
  /**
   * @swagger
   * /api/v1/audit/stats:
   *   get:
   *     summary: Get audit statistics
   *     description: Get aggregated audit statistics for monitoring
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (default: 7 days ago)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (default: now)
   *     responses:
   *       200:
   *         description: Audit statistics retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/stats',
    requireRole(['admin', 'compliance_officer']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getAuditStats)
  );
  
  /**
   * @swagger
   * /api/v1/audit/users/{userId}/activity:
   *   get:
   *     summary: Get user activity report
   *     description: Get all actions performed by a specific user
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: User activity retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/users/:userId/activity',
    requireRole(['admin', 'compliance_officer']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getUserActivity)
  );
  
  /**
   * @swagger
   * /api/v1/audit/failed:
   *   get:
   *     summary: Get failed operations
   *     description: Get all failed operations for security monitoring
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Failed operations retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/failed',
    requireRole(['admin', 'compliance_officer']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getFailedOperations)
  );
  
  /**
   * @swagger
   * /api/v1/audit/modifications:
   *   get:
   *     summary: Get data modifications
   *     description: Get all CREATE/UPDATE/DELETE operations with before/after values
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: resourceId
   *         schema:
   *           type: string
   *         description: Filter by specific resource ID
   *       - in: query
   *         name: resource
   *         schema:
   *           type: string
   *           enum: [APPOINTMENT, BILLING, SCHEDULE, STAFF]
   *         description: Filter by resource type
   *     responses:
   *       200:
   *         description: Modifications retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/modifications',
    requireRole(['admin', 'compliance_officer']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getModifications)
  );
  
  /**
   * @swagger
   * /api/v1/audit/resource/{resourceType}/{resourceId}:
   *   get:
   *     summary: Get resource audit trail
   *     description: Get complete audit trail for a specific resource
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: resourceType
   *         required: true
   *         schema:
   *           type: string
   *           enum: [APPOINTMENT, BILLING, SCHEDULE, STAFF]
   *         description: Resource type
   *       - in: path
   *         name: resourceId
   *         required: true
   *         schema:
   *           type: string
   *         description: Resource ID
   *     responses:
   *       200:
   *         description: Audit trail retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  router.get(
    '/resource/:resourceType/:resourceId',
    requireRole(['admin', 'compliance_officer', 'doctor', 'nurse']),
    requirePermission('audit:read'),
    asyncHandler(auditController.getResourceAuditTrail)
  );
  
  return router;
}

