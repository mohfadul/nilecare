/**
 * Audit Logging Middleware
 * Tracks all API requests and user actions
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Audit Logger Middleware
 */
export declare const auditLogger: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Manually log a specific action (for non-HTTP operations)
 */
export declare function logAction(params: {
    action: string;
    entityType: string;
    entityId?: string;
    userId: string;
    userName?: string;
    userRole?: string;
    details?: any;
    success?: boolean;
    errorMessage?: string;
}): Promise<void>;
/**
 * Log a security event
 */
export declare function logSecurityEvent(params: {
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    userName?: string;
    ipAddress?: string;
    description: string;
    details?: any;
}): Promise<void>;
/**
 * Log a login attempt
 */
export declare function logLoginAttempt(params: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
}): Promise<void>;
/**
 * Log a data export
 */
export declare function logDataExport(params: {
    userId: string;
    userName?: string;
    exportType: 'excel' | 'pdf' | 'csv';
    entityType: string;
    recordCount?: number;
    filters?: any;
    ipAddress?: string;
}): Promise<void>;
export default auditLogger;
//# sourceMappingURL=audit-logger.d.ts.map