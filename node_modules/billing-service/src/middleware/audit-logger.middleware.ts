/**
 * Audit Logger Middleware
 * Comprehensive audit logging for all billing operations
 * Compliant with HIPAA requirements
 */

import { Request, Response, NextFunction } from 'express';
import DatabaseConfig from '../config/database.config';
import { auditLogger } from '../config/logger.config';

interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id: string | null;
  user_id: string;
  user_name: string | null;
  user_role: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_method: string;
  request_url: string;
  result: 'success' | 'failure' | 'warning';
  error_message: string | null;
  old_values: any;
  new_values: any;
  changes_summary: string | null;
  metadata: any;
}

/**
 * Extract resource info from URL
 */
function extractResourceInfo(url: string, method: string): {
  type: string;
  id: string | null;
  action: string;
} {
  const pathParts = url.split('/').filter(Boolean);
  
  let resourceType = 'unknown';
  let resourceId = null;
  let action = method.toLowerCase();
  
  if (pathParts.length >= 3) {
    resourceType = pathParts[2]; // After /api/v1/
    
    if (pathParts.length >= 4 && pathParts[3].match(/^[a-f0-9-]{36}$/i)) {
      resourceId = pathParts[3];
    }
  }
  
  // Map actions
  const actionMap: Record<string, string> = {
    'POST': 'create',
    'GET': 'read',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  
  action = actionMap[method] || method.toLowerCase();
  
  // Special cases
  if (url.includes('/pay')) action = 'payment_applied';
  if (url.includes('/cancel')) action = 'cancelled';
  if (url.includes('/refund')) action = 'refunded';
  if (url.includes('/statement')) action = 'statement_generated';
  if (url.includes('/reminder')) action = 'reminder_sent';
  
  return { type: resourceType, id: resourceId, action };
}

/**
 * Mask sensitive data in request
 */
function maskSensitiveData(data: any): any {
  if (!data) return null;
  
  const masked = { ...data };
  const sensitiveFields = [
    'password', 'token', 'ssn', 'national_id', 
    'credit_card', 'bank_account', 'api_key'
  ];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * Audit logger middleware
 * Captures all requests and responses for compliance
 */
export const auditLoggerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }
  
  const startTime = Date.now();
  const { type: resourceType, id: resourceId, action } = extractResourceInfo(
    req.originalUrl || req.url,
    req.method
  );
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override res.end to capture response
  (res.end as any) = function (chunk?: any, encoding?: any, callback?: any) {
    // Don't log if already ended
    if (res.writableEnded) {
      return originalEnd.call(this, chunk, encoding, callback);
    }
    
    // Log to audit table
    logAudit(req, res, resourceType, resourceId, action).catch((error) => {
      auditLogger.error('Audit logging failed', { error: error.message });
    });
    
    // Call original end
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};

/**
 * Log audit entry to database
 */
async function logAudit(
  req: Request,
  res: Response,
  resourceType: string,
  resourceId: string | null,
  action: string
): Promise<void> {
  try {
    const user = req.user || {};
    
    // Get IP address
    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      null;
    
    const auditEntry: AuditLogEntry = {
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: user.id || 'anonymous',
      user_name: user.username || null,
      user_role: user.role || null,
      user_email: user.email || null,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'] || null,
      request_method: req.method,
      request_url: req.originalUrl || req.url,
      result: res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure',
      error_message: res.statusCode >= 400 ? (res.statusMessage || 'Error') : null,
      old_values: null,  // Can be populated by services
      new_values: maskSensitiveData(req.body),
      changes_summary: null,
      metadata: {
        statusCode: res.statusCode,
        responseTime: Date.now() - startTime
      }
    };
    
    // Insert into database
    await DatabaseConfig.query(
      `INSERT INTO billing_audit_log (
        id, action, resource_type, resource_id,
        user_id, user_name, user_role, user_email,
        ip_address, user_agent, request_method, request_url,
        result, error_message, old_values, new_values,
        changes_summary, metadata
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        auditEntry.action,
        auditEntry.resource_type,
        auditEntry.resource_id,
        auditEntry.user_id,
        auditEntry.user_name,
        auditEntry.user_role,
        auditEntry.user_email,
        auditEntry.ip_address,
        auditEntry.user_agent,
        auditEntry.request_method,
        auditEntry.request_url,
        auditEntry.result,
        auditEntry.error_message,
        JSON.stringify(auditEntry.old_values),
        JSON.stringify(auditEntry.new_values),
        auditEntry.changes_summary,
        JSON.stringify(auditEntry.metadata)
      ]
    );
    
    auditLogger.info('Audit log recorded', {
      action: auditEntry.action,
      resource: `${resourceType}:${resourceId || 'N/A'}`,
      user: auditEntry.user_id,
      result: auditEntry.result
    });
    
  } catch (error: any) {
    // Audit logging should never break the application
    auditLogger.error('Failed to write audit log', {
      error: error.message,
      path: req.path
    });
  }
}

/**
 * Manually log a specific billing action
 */
export async function logBillingAction(params: {
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  result?: 'success' | 'failure' | 'warning';
  errorMessage?: string;
  oldValues?: any;
  newValues?: any;
  changesSummary?: string;
  metadata?: any;
}): Promise<void> {
  try {
    await DatabaseConfig.query(
      `INSERT INTO billing_audit_log (
        id, action, resource_type, resource_id,
        user_id, user_name, user_role,
        result, error_message, old_values, new_values,
        changes_summary, metadata
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        params.action,
        params.resourceType,
        params.resourceId,
        params.userId,
        params.userName || null,
        params.userRole || null,
        params.result || 'success',
        params.errorMessage || null,
        JSON.stringify(params.oldValues || null),
        JSON.stringify(params.newValues || null),
        params.changesSummary || null,
        JSON.stringify(params.metadata || null)
      ]
    );
    
    auditLogger.info('Manual audit log recorded', {
      action: params.action,
      resource: `${params.resourceType}:${params.resourceId}`,
      user: params.userId
    });
    
  } catch (error: any) {
    auditLogger.error('Failed to write manual audit log', {
      error: error.message,
      action: params.action
    });
  }
}

export default auditLoggerMiddleware;

