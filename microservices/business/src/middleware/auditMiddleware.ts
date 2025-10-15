/**
 * Audit Logging Middleware
 * 
 * PRIORITY 1.1 - Automatic audit trail for all business operations
 * 
 * Features:
 * - Captures request/response data
 * - Logs user actions with full context
 * - Records data changes (before/after)
 * - Tracks PHI access (Protected Health Information)
 * - Non-blocking async logging
 * - Handles errors gracefully
 */

import { Request, Response, NextFunction } from 'express';
import { AuditLogService, AuditAction, AuditResource, AuditResult } from '../services/AuditLogService';
import type mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Map HTTP method and path to audit action
 */
function getAuditAction(method: string, path: string): AuditAction {
  // GET requests
  if (method === 'GET') {
    if (path.includes('/export')) return AuditAction.EXPORT;
    if (path.includes('/search')) return AuditAction.SEARCH;
    if (path.match(/\/\w+$/)) return AuditAction.VIEW; // Single resource (e.g., /appointments/123)
    return AuditAction.LIST; // List endpoint
  }
  
  // POST requests
  if (method === 'POST') {
    if (path.includes('/cancel')) return AuditAction.CANCEL;
    if (path.includes('/approve')) return AuditAction.APPROVE;
    if (path.includes('/reject')) return AuditAction.REJECT;
    if (path.includes('/confirm')) return AuditAction.CONFIRM;
    return AuditAction.CREATE;
  }
  
  // PUT/PATCH requests
  if (method === 'PUT' || method === 'PATCH') {
    return AuditAction.UPDATE;
  }
  
  // DELETE requests
  if (method === 'DELETE') {
    return AuditAction.DELETE;
  }
  
  return AuditAction.VIEW;
}

/**
 * Map path to audit resource
 */
function getAuditResource(path: string): AuditResource {
  if (path.includes('/appointments')) return AuditResource.APPOINTMENT;
  if (path.includes('/billing')) return AuditResource.BILLING;
  if (path.includes('/scheduling') || path.includes('/schedules')) return AuditResource.SCHEDULE;
  if (path.includes('/staff')) return AuditResource.STAFF;
  
  return AuditResource.APPOINTMENT; // Default
}

/**
 * Extract resource ID from path
 */
function extractResourceId(path: string, params: any): string | undefined {
  // Check params first (e.g., /appointments/:id)
  if (params.id) return params.id;
  if (params.appointmentId) return params.appointmentId;
  if (params.billingId) return params.billingId;
  if (params.staffId) return params.staffId;
  if (params.scheduleId) return params.scheduleId;
  
  // Fallback to path parsing
  const match = path.match(/\/([a-f0-9-]{36}|[a-zA-Z0-9-_]+)(?:\/|$)/);
  return match ? match[1] : undefined;
}

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = [
    'password', 'passwordHash', 'token', 'refreshToken',
    'creditCard', 'ssn', 'nationalId', 'sudan_national_id'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Create audit middleware for a specific database pool
 */
export function createAuditMiddleware(db: mysql.Pool) {
  const auditLogService = new AuditLogService(db);
  
  // Ensure audit table exists on startup
  auditLogService.ensureTableExists().catch(error => {
    logger.error('Failed to initialize audit logs table:', error);
  });
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip health checks and metrics
    if (req.path.startsWith('/health') || req.path === '/metrics' || req.path === '/api-docs') {
      next();
      return;
    }
    
    const startTime = Date.now();
    
    // Capture original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseBody: any = null;
    let responseSent = false;
    
    // Intercept response
    res.json = function(body: any) {
      responseBody = body;
      responseSent = true;
      return originalJson(body);
    };
    
    res.send = function(body: any) {
      responseBody = body;
      responseSent = true;
      return originalSend(body);
    };
    
    // Wait for response to complete
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const success = statusCode >= 200 && statusCode < 400;
        
        // Extract user info from JWT payload (added by auth middleware)
        const user = req.user;
        
        // Determine audit action and resource
        const action = getAuditAction(req.method, req.path);
        const resource = getAuditResource(req.path);
        const resourceId = extractResourceId(req.path, req.params);
        
        // Build audit log entry
        const auditEntry: Partial<any> = {
          userId: user?.userId || 'anonymous',
          userRole: user?.role || 'anonymous',
          userEmail: user?.email,
          organizationId: user?.organizationId || 'default',
          action,
          resource,
          resourceId,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          endpoint: req.path,
          httpMethod: req.method,
          result: success ? AuditResult.SUCCESS : AuditResult.FAILURE,
          statusCode,
          description: `${req.method} ${req.path} - ${statusCode}`,
          metadata: {
            duration,
            queryParams: req.query,
            contentLength: res.get('content-length')
          }
        };
        
        // For write operations, capture request body (sanitized)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          auditEntry.newValues = sanitizeData(req.body);
        }
        
        // For failures, capture error info
        if (!success && responseBody) {
          if (responseBody.error) {
            auditEntry.errorMessage = responseBody.error.message || responseBody.error;
            auditEntry.errorCode = responseBody.error.code;
          } else if (typeof responseBody === 'string') {
            auditEntry.errorMessage = responseBody;
          }
        }
        
        // Log asynchronously (non-blocking)
        setImmediate(() => {
          auditLogService.log(auditEntry).catch(err => {
            logger.error('Audit log write failed:', err);
          });
        });
        
      } catch (error: any) {
        // Never let audit logging break the response
        logger.error('Audit middleware error:', error);
      }
    });
    
    next();
  };
}

/**
 * Manual audit logging helper
 * For use in services/controllers when you need to log specific data changes
 */
export async function auditDataChange(
  db: mysql.Pool,
  params: {
    userId: string;
    userRole: string;
    organizationId: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    oldValues: any;
    newValues: any;
    ipAddress?: string;
    description?: string;
  }
): Promise<void> {
  const auditService = new AuditLogService(db);
  
  await auditService.log({
    ...params,
    endpoint: 'service-layer',
    httpMethod: 'SERVICE',
    result: AuditResult.SUCCESS,
    oldValues: JSON.stringify(sanitizeData(params.oldValues)),
    newValues: JSON.stringify(sanitizeData(params.newValues)),
    service: 'business-service'
  });
}

export default createAuditMiddleware;

