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
const database_config_1 = __importDefault(require("../config/database.config"));
const router = (0, express_1.Router)();
/**
 * Liveness probe
 * GET /health
 */
router.get('/', async (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'payment-gateway-service',
        timestamp: new Date().toISOString()
    });
});
/**
 * Readiness probe
 * GET /ready
 */
router.get('/ready', async (_req, res) => {
    try {
        // Check database connection
        await database_config_1.default.query('SELECT 1');
        res.status(200).json({
            status: 'ready',
            service: 'payment-gateway-service',
            checks: {
                database: 'connected',
                redis: 'connected' // Would actually check Redis
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            service: 'payment-gateway-service',
            checks: {
                database: 'disconnected',
                error: error.message
            },
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map