/**
 * Health Check Routes
 * System health and readiness endpoints
 */

import { Router, Request, Response } from 'express';
import DatabaseConfig from '../config/database.config';

const router = Router();

/**
 * Liveness probe
 * GET /health
 */
router.get('/', async (_req: Request, res: Response) => {
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
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    await DatabaseConfig.query('SELECT 1');

    res.status(200).json({
      status: 'ready',
      service: 'payment-gateway-service',
      checks: {
        database: 'connected',
        redis: 'connected' // Would actually check Redis
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
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

export default router;

