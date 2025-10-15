"use strict";
/**
 * Audit Logs Routes
 * View and query audit logs, security events, and login attempts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const router = (0, express_1.Router)();
const getConnection = async () => {
    return await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nilecare',
    });
};
/**
 * GET /api/v1/audit/logs
 * Get audit logs with pagination and filters
 */
router.get('/logs', async (req, res) => {
    const connection = await getConnection();
    try {
        const { page = 1, limit = 50, userId, entityType, action, success, dateFrom, dateTo, } = req.query;
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];
        // Apply filters
        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }
        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }
        if (success !== undefined) {
            query += ' AND success = ?';
            params.push(success === 'true' || success === '1');
        }
        if (dateFrom) {
            query += ' AND created_at >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND created_at <= ?';
            params.push(dateTo + ' 23:59:59');
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        // Add pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [logs] = await connection.execute(query, params);
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/logs/:id
 * Get a specific audit log by ID
 */
router.get('/logs/:id', async (req, res) => {
    const connection = await getConnection();
    try {
        const { id } = req.params;
        const [rows] = await connection.execute('SELECT * FROM audit_logs WHERE id = ?', [id]);
        const logs = rows;
        if (logs.length === 0) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Audit log not found' },
            });
        }
        res.json({
            success: true,
            data: logs[0],
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/entity/:entityType/:entityId
 * Get audit history for a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req, res) => {
    const connection = await getConnection();
    try {
        const { entityType, entityId } = req.params;
        const { limit = 100 } = req.query;
        const [logs] = await connection.execute(`SELECT * FROM audit_logs 
       WHERE entity_type = ? AND entity_id = ?
       ORDER BY created_at DESC
       LIMIT ?`, [entityType, entityId, Number(limit)]);
        res.json({
            success: true,
            data: logs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/user/:userId
 * Get user activity logs
 */
router.get('/user/:userId', async (req, res) => {
    const connection = await getConnection();
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50, dateFrom, dateTo } = req.query;
        let query = 'SELECT * FROM audit_logs WHERE user_id = ?';
        const params = [userId];
        if (dateFrom) {
            query += ' AND created_at >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            query += ' AND created_at <= ?';
            params.push(dateTo + ' 23:59:59');
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        // Add pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [logs] = await connection.execute(query, params);
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/summary
 * Get audit summary statistics
 */
router.get('/summary', async (req, res) => {
    const connection = await getConnection();
    try {
        const { dateFrom, dateTo } = req.query;
        let dateFilter = '';
        const params = [];
        if (dateFrom) {
            dateFilter += ' AND created_at >= ?';
            params.push(dateFrom);
        }
        if (dateTo) {
            dateFilter += ' AND created_at <= ?';
            params.push(dateTo + ' 23:59:59');
        }
        // Total actions
        const [totalResult] = await connection.execute(`SELECT COUNT(*) as total FROM audit_logs WHERE 1=1 ${dateFilter}`, params);
        // Actions by type
        const [actionTypes] = await connection.execute(`SELECT action, COUNT(*) as count 
       FROM audit_logs WHERE 1=1 ${dateFilter}
       GROUP BY action
       ORDER BY count DESC`, params);
        // Most active users
        const [activeUsers] = await connection.execute(`SELECT user_id, user_name, COUNT(*) as action_count 
       FROM audit_logs WHERE 1=1 ${dateFilter}
       GROUP BY user_id, user_name
       ORDER BY action_count DESC
       LIMIT 10`, params);
        // Failed actions
        const [failedResult] = await connection.execute(`SELECT COUNT(*) as total FROM audit_logs 
       WHERE success = FALSE ${dateFilter}`, params);
        // Actions by entity type
        const [entityTypes] = await connection.execute(`SELECT entity_type, COUNT(*) as count 
       FROM audit_logs WHERE 1=1 ${dateFilter}
       GROUP BY entity_type
       ORDER BY count DESC`, params);
        res.json({
            success: true,
            data: {
                totalActions: totalResult[0].total,
                failedActions: failedResult[0].total,
                actionTypes,
                activeUsers,
                entityTypes,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/security-events
 * Get security events
 */
router.get('/security-events', async (req, res) => {
    const connection = await getConnection();
    try {
        const { page = 1, limit = 50, severity, status } = req.query;
        let query = 'SELECT * FROM security_events WHERE 1=1';
        const params = [];
        if (severity) {
            query += ' AND severity = ?';
            params.push(severity);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        // Add pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [events] = await connection.execute(query, params);
        res.json({
            success: true,
            data: {
                events,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/login-attempts
 * Get login attempts
 */
router.get('/login-attempts', async (req, res) => {
    const connection = await getConnection();
    try {
        const { page = 1, limit = 50, email, success } = req.query;
        let query = 'SELECT * FROM login_attempts WHERE 1=1';
        const params = [];
        if (email) {
            query += ' AND email LIKE ?';
            params.push(`%${email}%`);
        }
        if (success !== undefined) {
            query += ' AND success = ?';
            params.push(success === 'true' || success === '1');
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        // Add pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [attempts] = await connection.execute(query, params);
        res.json({
            success: true,
            data: {
                attempts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
/**
 * GET /api/v1/audit/data-exports
 * Get data export logs
 */
router.get('/data-exports', async (req, res) => {
    const connection = await getConnection();
    try {
        const { page = 1, limit = 50, userId, exportType, entityType } = req.query;
        let query = 'SELECT * FROM data_export_logs WHERE 1=1';
        const params = [];
        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }
        if (exportType) {
            query += ' AND export_type = ?';
            params.push(exportType);
        }
        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const [countResult] = await connection.execute(countQuery, params);
        const total = countResult[0].total;
        // Add pagination
        const offset = (Number(page) - 1) * Number(limit);
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [exports] = await connection.execute(query, params);
        res.json({
            success: true,
            data: {
                exports,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'DB_ERROR', message: error.message },
        });
    }
    finally {
        await connection.end();
    }
});
exports.default = router;
//# sourceMappingURL=audit.routes.js.map