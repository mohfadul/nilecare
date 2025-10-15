"use strict";
/**
 * Audit Logging Middleware
 * Tracks all API requests and user actions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
exports.logAction = logAction;
exports.logSecurityEvent = logSecurityEvent;
exports.logLoginAttempt = logLoginAttempt;
exports.logDataExport = logDataExport;
const promise_1 = __importDefault(require("mysql2/promise"));
const getConnection = async () => {
    return await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nilecare',
    });
};
/**
 * Extract entity type and ID from URL
 */
function extractEntityInfo(url, method) {
    const pathParts = url.split('/').filter(Boolean);
    // Common patterns:
    // /api/v1/patients -> type: patients, id: null
    // /api/v1/patients/123 -> type: patients, id: 123
    // /api/v1/appointments/123/confirm -> type: appointments, id: 123
    let entityType = 'unknown';
    let entityId = null;
    if (pathParts.length >= 3) {
        entityType = pathParts[2]; // After /api/v1/
        if (pathParts.length >= 4 && pathParts[3] !== 'search' && !isNaN(Number(pathParts[3]))) {
            entityId = pathParts[3];
        }
    }
    return { type: entityType, id: entityId };
}
/**
 * Map HTTP method to action
 */
function mapMethodToAction(method, url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('/login'))
        return 'login';
    if (urlLower.includes('/logout'))
        return 'logout';
    if (urlLower.includes('/register'))
        return 'register';
    if (urlLower.includes('/search'))
        return 'search';
    if (urlLower.includes('/export'))
        return 'export';
    switch (method) {
        case 'POST':
            return 'create';
        case 'GET':
            return 'read';
        case 'PUT':
        case 'PATCH':
            return 'update';
        case 'DELETE':
            return 'delete';
        default:
            return method.toLowerCase();
    }
}
/**
 * Mask sensitive data in request body
 */
function maskSensitiveData(data) {
    if (!data)
        return null;
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'ssn', 'nationalId', 'creditCard'];
    for (const field of sensitiveFields) {
        if (masked[field]) {
            masked[field] = '***MASKED***';
        }
    }
    return masked;
}
/**
 * Audit Logger Middleware
 */
const auditLogger = async (req, res, next) => {
    const startTime = Date.now();
    // Skip health checks and static files
    if (req.path === '/health' || req.path.startsWith('/static')) {
        return next();
    }
    // Store original end function
    const originalEnd = res.end;
    // Override res.end to capture response
    res.end = function (chunk, encoding, callback) {
        const duration = Date.now() - startTime;
        // Log to audit table
        logAudit(req, res, duration).catch((error) => {
            console.error('Audit logging failed:', error);
        });
        // Call original end
        originalEnd.call(this, chunk, encoding, callback);
    };
    next();
};
exports.auditLogger = auditLogger;
/**
 * Log audit entry to database
 */
async function logAudit(req, res, duration) {
    let connection;
    try {
        connection = await getConnection();
        const { type: entityType, id: entityId } = extractEntityInfo(req.originalUrl || req.url, req.method);
        const action = mapMethodToAction(req.method, req.originalUrl || req.url);
        // Extract user info from request (set by auth middleware)
        const user = req.user || {};
        // Get IP address
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.socket.remoteAddress ||
            null;
        const auditEntry = {
            action,
            entityType,
            entityId,
            userId: user.id || user.userId || 'anonymous',
            userName: user.name || user.username || null,
            userRole: user.role || null,
            userEmail: user.email || null,
            ipAddress,
            userAgent: req.headers['user-agent'] || null,
            requestMethod: req.method,
            requestUrl: req.originalUrl || req.url,
            requestBody: maskSensitiveData(req.body),
            responseStatus: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 400,
            errorMessage: res.statusCode >= 400 ? (res.statusMessage || 'Error') : null,
            duration,
            sessionId: req.sessionId || null,
            requestId: req.requestId || null,
            changes: null, // Can be populated by specific routes
        };
        await connection.execute(`INSERT INTO audit_logs (
        action, entity_type, entity_id,
        user_id, user_name, user_role, user_email,
        ip_address, user_agent,
        request_method, request_url, request_body,
        response_status, success, error_message,
        duration, session_id, request_id, changes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            auditEntry.action,
            auditEntry.entityType,
            auditEntry.entityId,
            auditEntry.userId,
            auditEntry.userName,
            auditEntry.userRole,
            auditEntry.userEmail,
            auditEntry.ipAddress,
            auditEntry.userAgent,
            auditEntry.requestMethod,
            auditEntry.requestUrl,
            JSON.stringify(auditEntry.requestBody),
            auditEntry.responseStatus,
            auditEntry.success,
            auditEntry.errorMessage,
            auditEntry.duration,
            auditEntry.sessionId,
            auditEntry.requestId,
            JSON.stringify(auditEntry.changes),
        ]);
    }
    catch (error) {
        console.error('Failed to write audit log:', error.message);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
/**
 * Manually log a specific action (for non-HTTP operations)
 */
async function logAction(params) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(`INSERT INTO audit_logs (
        action, entity_type, entity_id,
        user_id, user_name, user_role,
        success, error_message, request_body
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            params.action,
            params.entityType,
            params.entityId || null,
            params.userId,
            params.userName || null,
            params.userRole || null,
            params.success !== false,
            params.errorMessage || null,
            JSON.stringify(params.details || {}),
        ]);
    }
    catch (error) {
        console.error('Failed to write audit log:', error.message);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
/**
 * Log a security event
 */
async function logSecurityEvent(params) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(`INSERT INTO security_events (
        event_type, severity, user_id, user_name, ip_address, description, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            params.eventType,
            params.severity,
            params.userId || null,
            params.userName || null,
            params.ipAddress || null,
            params.description,
            JSON.stringify(params.details || {}),
        ]);
    }
    catch (error) {
        console.error('Failed to write security event:', error.message);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
/**
 * Log a login attempt
 */
async function logLoginAttempt(params) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(`INSERT INTO login_attempts (
        email, ip_address, user_agent, success, failure_reason
      ) VALUES (?, ?, ?, ?, ?)`, [
            params.email,
            params.ipAddress || null,
            params.userAgent || null,
            params.success,
            params.failureReason || null,
        ]);
    }
    catch (error) {
        console.error('Failed to write login attempt:', error.message);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
/**
 * Log a data export
 */
async function logDataExport(params) {
    let connection;
    try {
        connection = await getConnection();
        await connection.execute(`INSERT INTO data_export_logs (
        user_id, user_name, export_type, entity_type, record_count, filters, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            params.userId,
            params.userName || null,
            params.exportType,
            params.entityType,
            params.recordCount || null,
            JSON.stringify(params.filters || {}),
            params.ipAddress || null,
        ]);
    }
    catch (error) {
        console.error('Failed to write data export log:', error.message);
    }
    finally {
        if (connection) {
            await connection.end();
        }
    }
}
exports.default = exports.auditLogger;
//# sourceMappingURL=audit-logger.js.map