/**
 * Audit Log Service
 * 
 * PRIORITY 1.1 - Comprehensive Audit Logging
 * 
 * Implements enterprise-grade audit logging for:
 * - WHO: User ID, role, organization
 * - WHAT: Action performed, resource affected, data changes
 * - WHEN: Timestamp with millisecond precision
 * - WHERE: IP address, user agent, service name
 * - CONTEXT: Before/after values, metadata
 * 
 * Compliance Requirements:
 * - Healthcare data access tracking (HIPAA-style)
 * - Sudan Ministry of Health regulations
 * - Data modification history
 * - Security event tracking
 */

import type mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export enum AuditAction {
  // Read operations
  VIEW = 'VIEW',
  LIST = 'LIST',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',
  
  // Write operations
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Business operations
  CANCEL = 'CANCEL',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CONFIRM = 'CONFIRM',
  
  // Security events
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export enum AuditResource {
  APPOINTMENT = 'APPOINTMENT',
  BILLING = 'BILLING',
  SCHEDULE = 'SCHEDULE',
  STAFF = 'STAFF'
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL'
}

export interface AuditLogEntry {
  id: string;
  
  // WHO
  userId: string;
  userRole: string;
  userEmail?: string;
  organizationId: string;
  
  // WHAT
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceType?: string;
  
  // WHEN
  timestamp: Date;
  
  // WHERE
  ipAddress?: string;
  userAgent?: string;
  service: string;
  endpoint: string;
  httpMethod: string;
  
  // RESULT
  result: AuditResult;
  statusCode?: number;
  
  // CONTEXT
  description?: string;
  oldValues?: string; // JSON
  newValues?: string; // JSON
  metadata?: string;  // JSON
  
  // ERROR INFO
  errorMessage?: string;
  errorCode?: string;
}

export class AuditLogService {
  private db: mysql.Pool;
  private readonly tableName = 'audit_logs';
  
  constructor(db: mysql.Pool) {
    this.db = db;
  }
  
  /**
   * Log an audit event
   */
  async log(entry: Partial<AuditLogEntry>): Promise<void> {
    const id = uuidv4();
    const timestamp = new Date();
    
    try {
      // Create audit log entry
      const auditEntry: AuditLogEntry = {
        id,
        userId: entry.userId || 'system',
        userRole: entry.userRole || 'system',
        userEmail: entry.userEmail,
        organizationId: entry.organizationId || 'default',
        action: entry.action || AuditAction.VIEW,
        resource: entry.resource!,
        resourceId: entry.resourceId,
        resourceType: entry.resourceType,
        timestamp,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        service: 'business-service',
        endpoint: entry.endpoint || 'unknown',
        httpMethod: entry.httpMethod || 'UNKNOWN',
        result: entry.result || AuditResult.SUCCESS,
        statusCode: entry.statusCode,
        description: entry.description,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        errorMessage: entry.errorMessage,
        errorCode: entry.errorCode
      } as AuditLogEntry;
      
      // Insert into database
      await this.db.query(
        `INSERT INTO ${this.tableName} (
          id, user_id, user_role, user_email, organization_id,
          action, resource, resource_id, resource_type,
          timestamp, ip_address, user_agent, service, endpoint, http_method,
          result, status_code, description,
          old_values, new_values, metadata,
          error_message, error_code,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          auditEntry.userId,
          auditEntry.userRole,
          auditEntry.userEmail,
          auditEntry.organizationId,
          auditEntry.action,
          auditEntry.resource,
          auditEntry.resourceId,
          auditEntry.resourceType,
          timestamp,
          auditEntry.ipAddress,
          auditEntry.userAgent,
          auditEntry.service,
          auditEntry.endpoint,
          auditEntry.httpMethod,
          auditEntry.result,
          auditEntry.statusCode,
          auditEntry.description,
          auditEntry.oldValues,
          auditEntry.newValues,
          auditEntry.metadata,
          auditEntry.errorMessage,
          auditEntry.errorCode
        ]
      );
      
      // Also log to Winston for immediate visibility
      logger.info('AUDIT LOG', {
        auditId: id,
        action: auditEntry.action,
        resource: auditEntry.resource,
        resourceId: auditEntry.resourceId,
        userId: auditEntry.userId,
        result: auditEntry.result
      });
      
    } catch (error: any) {
      // Critical: Audit logging failure must not break the application
      // but must be logged with high priority
      logger.error('⚠️  CRITICAL: Audit logging failed', {
        error: error.message,
        stack: error.stack,
        entry
      });
      
      // Optionally: Send alert to monitoring system
      // TODO: Integrate with alerting system (e.g., Sentry, PagerDuty)
    }
  }
  
  /**
   * Log a successful operation
   */
  async logSuccess(params: {
    userId: string;
    userRole: string;
    userEmail?: string;
    organizationId: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint: string;
    httpMethod: string;
    description?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }): Promise<void> {
    await this.log({
      ...params,
      result: AuditResult.SUCCESS,
      statusCode: 200
    });
  }
  
  /**
   * Log a failed operation
   */
  async logFailure(params: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    organizationId?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint: string;
    httpMethod: string;
    statusCode: number;
    errorMessage: string;
    errorCode?: string;
    metadata?: any;
  }): Promise<void> {
    await this.log({
      ...params,
      result: AuditResult.FAILURE
    });
  }
  
  /**
   * Log an access denied event
   */
  async logAccessDenied(params: {
    userId?: string;
    userRole?: string;
    organizationId?: string;
    resource: AuditResource;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint: string;
    httpMethod: string;
    reason: string;
  }): Promise<void> {
    await this.log({
      ...params,
      action: AuditAction.ACCESS_DENIED,
      result: AuditResult.FAILURE,
      statusCode: 403,
      description: params.reason,
      errorMessage: params.reason
    });
  }
  
  /**
   * Query audit logs (for admin/compliance review)
   */
  async query(filters: {
    userId?: string;
    organizationId?: string;
    resource?: AuditResource;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params: any[] = [];
      
      if (filters.userId) {
        sql += ' AND user_id = ?';
        params.push(filters.userId);
      }
      
      if (filters.organizationId) {
        sql += ' AND organization_id = ?';
        params.push(filters.organizationId);
      }
      
      if (filters.resource) {
        sql += ' AND resource = ?';
        params.push(filters.resource);
      }
      
      if (filters.action) {
        sql += ' AND action = ?';
        params.push(filters.action);
      }
      
      if (filters.startDate) {
        sql += ' AND timestamp >= ?';
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        sql += ' AND timestamp <= ?';
        params.push(filters.endDate);
      }
      
      sql += ' ORDER BY timestamp DESC';
      
      if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
      }
      
      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(filters.offset);
      }
      
      const [rows] = await this.db.query(sql, params);
      return rows as AuditLogEntry[];
      
    } catch (error: any) {
      logger.error('Error querying audit logs:', error);
      throw error;
    }
  }
  
  /**
   * Create audit_logs table if it doesn't exist
   */
  async ensureTableExists(): Promise<void> {
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id CHAR(36) PRIMARY KEY,
          
          -- WHO
          user_id CHAR(36) NOT NULL,
          user_role VARCHAR(50) NOT NULL,
          user_email VARCHAR(255),
          organization_id VARCHAR(100) NOT NULL,
          
          -- WHAT
          action VARCHAR(50) NOT NULL,
          resource VARCHAR(50) NOT NULL,
          resource_id VARCHAR(100),
          resource_type VARCHAR(50),
          
          -- WHEN
          timestamp DATETIME NOT NULL,
          
          -- WHERE
          ip_address VARCHAR(45),
          user_agent TEXT,
          service VARCHAR(50) NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          http_method VARCHAR(10) NOT NULL,
          
          -- RESULT
          result ENUM('SUCCESS', 'FAILURE', 'PARTIAL') NOT NULL,
          status_code INT,
          
          -- CONTEXT
          description TEXT,
          old_values JSON,
          new_values JSON,
          metadata JSON,
          
          -- ERROR INFO
          error_message TEXT,
          error_code VARCHAR(50),
          
          -- METADATA
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          -- INDEXES for performance
          INDEX idx_user_id (user_id),
          INDEX idx_organization_id (organization_id),
          INDEX idx_resource (resource, resource_id),
          INDEX idx_action (action),
          INDEX idx_timestamp (timestamp),
          INDEX idx_result (result),
          INDEX idx_composite (user_id, resource, timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      logger.info('✅ Audit logs table verified/created');
    } catch (error: any) {
      logger.error('❌ Failed to create audit_logs table:', error);
      throw error;
    }
  }
}

