"use strict";
/**
 * Health Check Routes
 * System health and readiness endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promise_1 = __importDefault(require("mysql2/promise"));
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
/**
 * Get database connection
 */
const getConnection = async () => {
    return await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nilecare',
    });
};
/**
 * Liveness probe
 * GET /health
 */
router.get('/', async (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'main-nilecare',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
/**
 * Readiness probe
 * GET /health/ready
 */
router.get('/ready', async (_req, res) => {
    const checks = {
        database: 'unknown',
        authService: 'unknown',
        paymentService: 'unknown'
    };
    try {
        // Check database connection
        const connection = await getConnection();
        await connection.execute('SELECT 1');
        await connection.end();
        checks.database = 'connected';
    }
    catch (error) {
        checks.database = 'disconnected';
        checks.databaseError = error.message;
    }
    // Check auth-service
    try {
        const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        await axios_1.default.get(`${authUrl}/health`, { timeout: 3000 });
        checks.authService = 'healthy';
    }
    catch (error) {
        checks.authService = 'unreachable';
    }
    // Check payment-service
    try {
        const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007';
        await axios_1.default.get(`${paymentUrl}/health`, { timeout: 3000 });
        checks.paymentService = 'healthy';
    }
    catch (error) {
        checks.paymentService = 'unreachable';
    }
    const isReady = checks.database === 'connected';
    res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not_ready',
        service: 'main-nilecare',
        version: '1.0.0',
        checks,
        timestamp: new Date().toISOString()
    });
});
/**
 * Detailed status
 * GET /health/status
 */
router.get('/status', async (_req, res) => {
    const connection = await getConnection();
    try {
        // Get system statistics
        const [patientsCount] = await connection.execute('SELECT COUNT(*) as count FROM patients');
        const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [appointmentsCount] = await connection.execute('SELECT COUNT(*) as count FROM appointments');
        res.json({
            success: true,
            service: 'main-nilecare',
            version: '1.0.0',
            uptime: Math.floor(process.uptime()),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            },
            database: {
                status: 'connected',
                totalPatients: patientsCount[0].count,
                totalUsers: usersCount[0].count,
                totalAppointments: appointmentsCount[0].count
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: { code: 'HEALTH_CHECK_FAILED', message: error.message }
        });
    }
    finally {
        await connection.end();
    }
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map