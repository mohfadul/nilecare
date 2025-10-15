/**
 * Health Routes
 * Health check, readiness, and metrics endpoints
 */

import express, { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
import { getRedisClient } from '../config/redis';

const router: Router = express.Router();
const serviceStartTime = Date.now();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', (req: Request, res: Response) => {
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
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database
    const pool = getPool();
    await pool.query('SELECT 1');

    // Check Redis
    const redis = getRedisClient();
    await redis.ping();

    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'connected',
        redis: 'connected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
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
router.get('/startup', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'started',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness probe
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Metrics endpoint (Prometheus format)
 * GET /health/metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
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

export default router;

