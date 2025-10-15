/**
 * Health Check Routes
 * System health and readiness endpoints
 */

import { Router, Request, Response } from 'express';
import DatabaseConfig from '../config/database.config';
import PaymentGatewayClient from '../services/payment-gateway-client.service';

const router = Router();
const serviceStartTime = Date.now();

/**
 * Liveness probe
 * GET /health
 */
router.get('/', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'billing-service',
    port: process.env.PORT || 5003,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe
 * GET /health/ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check database
    const dbHealthy = await DatabaseConfig.query('SELECT 1');
    
    // Check Payment Gateway
    const paymentGatewayHealthy = await PaymentGatewayClient.healthCheck();

    const allHealthy = dbHealthy && paymentGatewayHealthy;

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      service: 'billing-service',
      checks: {
        database: dbHealthy ? 'connected' : 'disconnected',
        paymentGateway: paymentGatewayHealthy ? 'accessible' : 'unreachable',
        overall: allHealthy
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(503).json({
      status: 'not_ready',
      service: 'billing-service',
      checks: {
        database: 'error',
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Startup probe
 * GET /health/startup
 */
router.get('/startup', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  const started = uptime > 5; // Consider started after 5 seconds

  res.status(started ? 200 : 503).json({
    status: started ? 'started' : 'starting',
    uptime,
    timestamp: new Date().toISOString()
  });
});

/**
 * Metrics endpoint (Prometheus compatible)
 * GET /metrics
 */
router.get('/metrics', (_req: Request, res: Response) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# HELP billing_service_uptime_seconds Service uptime in seconds
# TYPE billing_service_uptime_seconds counter
billing_service_uptime_seconds ${uptime}

# HELP billing_service_info Service information
# TYPE billing_service_info gauge
billing_service_info{version="1.0.0",service="billing-service"} 1
  `.trim());
});

export default router;

