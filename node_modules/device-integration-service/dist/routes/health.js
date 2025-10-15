"use strict";
/**
 * Health Routes
 * Health check, readiness, and metrics endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const router = express_1.default.Router();
const serviceStartTime = Date.now();
/**
 * Health check endpoint
 * GET /health
 */
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'device-integration-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
/**
 * Readiness probe
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check database
        const pool = (0, database_1.getPool)();
        await pool.query('SELECT 1');
        // Check Redis
        const redis = (0, redis_1.getRedisClient)();
        await redis.ping();
        res.status(200).json({
            status: 'ready',
            checks: {
                database: 'connected',
                redis: 'connected',
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
/**
 * Startup probe
 * GET /health/startup
 */
router.get('/startup', (req, res) => {
    res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
    });
});
/**
 * Liveness probe
 * GET /health/live
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
    });
});
/**
 * Metrics endpoint (Prometheus format)
 * GET /health/metrics
 */
router.get('/metrics', async (req, res) => {
    const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
    res.setHeader('Content-Type', 'text/plain');
    res.send(`# HELP service_uptime_seconds Total uptime of the service in seconds
# TYPE service_uptime_seconds counter
service_uptime_seconds ${uptime}

# HELP service_info Service information
# TYPE service_info gauge
service_info{version="1.0.0",service="device-integration-service"} 1
`);
});
exports.default = router;
//# sourceMappingURL=health.js.map