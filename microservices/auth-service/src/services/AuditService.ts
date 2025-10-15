import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Service
 * Logs all security-critical events to database for compliance
 * 
 * COMPLIANCE: HIPAA, GDPR, SOC2
 */

export interface AuditLogEntry {
  userId?: string;
  email?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Log security event to database
   * All authentication and authorization events should be logged
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const pool = getPool();
      
      await pool.query(
        `INSERT INTO auth_audit_logs (
          id, user_id, email, action, resource, result,
          reason, ip_address, user_agent, metadata, timestamp
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          entry.userId || null,
          entry.email || null,
          entry.action,
          entry.resource,
          entry.result,
          entry.reason || null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null
        ]
      );

      // Also log to application logs for real-time monitoring
      const logLevel = entry.result === 'success' ? 'info' : 'warn';
      logger[logLevel]('Audit event', {
        action: entry.action,
        resource: entry.resource,
        result: entry.result,
        userId: entry.userId,
        email: entry.email
      });
    } catch (error: any) {
      // Don't throw - audit failures shouldn't break the application
      logger.error('Failed to write audit log', {
        error: error.message,
        entry
      });
    }
  }

  /**
   * Log login attempt (success or failure)
   */
  async logLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const pool = getPool();
      
      await pool.query(
        `INSERT INTO auth_login_attempts (
          id, email, ip_address, user_agent, success, reason, timestamp
        ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
        [email, ipAddress, userAgent, success, reason || null]
      );

      // Also log to audit trail
      await this.log({
        email,
        action: 'LOGIN_ATTEMPT',
        resource: 'authentication',
        result: success ? 'success' : 'failure',
        reason,
        ipAddress,
        userAgent
      });
    } catch (error: any) {
      logger.error('Failed to log login attempt', {
        error: error.message,
        email
      });
    }
  }

  /**
   * Log user registration
   */
  async logRegistration(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      userId,
      email,
      action: 'USER_REGISTRATION',
      resource: 'users',
      result: 'success',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(
    email: string,
    ipAddress: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      email,
      action: 'PASSWORD_RESET_REQUEST',
      resource: 'password',
      result: success ? 'success' : 'failure',
      ipAddress
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(
    userId: string,
    email: string,
    ipAddress: string,
    success: boolean
  ): Promise<void> {
    await this.log({
      userId,
      email,
      action: 'PASSWORD_CHANGE',
      resource: 'password',
      result: success ? 'success' : 'failure',
      ipAddress
    });
  }

  /**
   * Log MFA enable/disable
   */
  async logMFAChange(
    userId: string,
    email: string,
    action: 'MFA_ENABLED' | 'MFA_DISABLED',
    ipAddress: string
  ): Promise<void> {
    await this.log({
      userId,
      email,
      action,
      resource: 'mfa',
      result: 'success',
      ipAddress
    });
  }

  /**
   * Log permission check
   */
  async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'PERMISSION_CHECK',
      resource: `${resource}:${action}`,
      result: allowed ? 'success' : 'failure',
      ipAddress,
      metadata: { resource, action, allowed }
    });
  }

  /**
   * Log role assignment
   */
  async logRoleAssignment(
    adminUserId: string,
    targetUserId: string,
    roleName: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: 'ROLE_ASSIGNMENT',
      resource: 'roles',
      result: 'success',
      ipAddress,
      metadata: { targetUserId, roleName }
    });
  }

  /**
   * Log session revocation
   */
  async logSessionRevocation(
    userId: string,
    sessionId: string,
    reason: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'SESSION_REVOKED',
      resource: 'sessions',
      result: 'success',
      reason,
      ipAddress,
      metadata: { sessionId }
    });
  }

  /**
   * Get recent audit logs for a user (for user's own activity view)
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT * FROM auth_audit_logs
         WHERE user_id = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        [userId, limit]
      );

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map(row => this.mapToAuditEntry(row));
    } catch (error: any) {
      logger.error('Failed to get user audit logs', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get audit logs by action (admin)
   */
  async getAuditLogsByAction(
    action: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT * FROM auth_audit_logs
         WHERE action = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        [action, limit]
      );

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map(row => this.mapToAuditEntry(row));
    } catch (error: any) {
      logger.error('Failed to get audit logs by action', {
        action,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get failed login attempts for security monitoring
   */
  async getFailedLoginAttempts(
    timeWindowMinutes: number = 60,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const pool = getPool();
      
      const [rows]: any = await pool.query(
        `SELECT email, ip_address, COUNT(*) as attempt_count, MAX(timestamp) as last_attempt
         FROM auth_login_attempts
         WHERE success = FALSE
           AND timestamp > DATE_SUB(NOW(), INTERVAL ? MINUTE)
         GROUP BY email, ip_address
         HAVING attempt_count >= 3
         ORDER BY attempt_count DESC
         LIMIT ?`,
        [timeWindowMinutes, limit]
      );

      return Array.isArray(rows) ? rows : [];
    } catch (error: any) {
      logger.error('Failed to get failed login attempts', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get audit statistics (admin dashboard)
   */
  async getAuditStats(timeWindowHours: number = 24): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      const pool = getPool();
      
      // Overall stats
      const [statsRows]: any = await pool.query(
        `SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN result = 'success' THEN 1 ELSE 0 END) as successful_events,
          SUM(CASE WHEN result = 'failure' THEN 1 ELSE 0 END) as failed_events,
          COUNT(DISTINCT user_id) as unique_users
         FROM auth_audit_logs
         WHERE timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)`,
        [timeWindowHours]
      );

      // Top actions
      const [actionRows]: any = await pool.query(
        `SELECT action, COUNT(*) as count
         FROM auth_audit_logs
         WHERE timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR)
         GROUP BY action
         ORDER BY count DESC
         LIMIT 10`,
        [timeWindowHours]
      );

      const stats = statsRows[0];
      
      return {
        totalEvents: parseInt(stats.total_events) || 0,
        successfulEvents: parseInt(stats.successful_events) || 0,
        failedEvents: parseInt(stats.failed_events) || 0,
        uniqueUsers: parseInt(stats.unique_users) || 0,
        topActions: Array.isArray(actionRows) ? actionRows.map(row => ({
          action: row.action,
          count: parseInt(row.count)
        })) : []
      };
    } catch (error: any) {
      logger.error('Failed to get audit stats', {
        error: error.message
      });
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        uniqueUsers: 0,
        topActions: []
      };
    }
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const pool = getPool();
      
      const [result]: any = await pool.query(
        `DELETE FROM auth_audit_logs
         WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [retentionDays]
      );

      const count = result.affectedRows || 0;
      if (count > 0) {
        logger.info(`Cleaned up ${count} audit logs older than ${retentionDays} days`);
      }

      return count;
    } catch (error: any) {
      logger.error('Failed to cleanup old audit logs', {
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Map database row to AuditLogEntry
   */
  private mapToAuditEntry(row: any): AuditLogEntry {
    let metadata: Record<string, any> = {};
    if (row.metadata) {
      try {
        metadata = typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;
      } catch (e) {
        metadata = {};
      }
    }

    return {
      userId: row.user_id,
      email: row.email,
      action: row.action,
      resource: row.resource,
      result: row.result,
      reason: row.reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata
    };
  }
}

export default AuditService;

