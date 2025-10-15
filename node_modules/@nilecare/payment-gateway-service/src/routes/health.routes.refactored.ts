/**
 * Health Check Routes - Refactored for Phase 2/3
 * ✅ Comprehensive health checks for all dependencies
 */

import { Router } from 'express';
import { createLogger } from '@nilecare/logger';
import DatabaseConfig from '../config/database.config';
import Redis from 'ioredis';

const router = Router();
const logger = createLogger('payment-gateway-health');

/**
 * Liveness probe
 * GET /health
 * Returns 200 if service is alive
 */
router.get('/', async (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'payment-gateway-service',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Readiness probe
 * GET /health/ready
 * Returns 200 if service is ready to accept requests
 */
router.get('/ready', async (_req, res) => {
  const checks: any = {
    database: 'unknown',
    redis: 'unknown',
    authService: 'unknown'
  };

  let allHealthy = true;

  try {
    // Check database connection
    try {
      await DatabaseConfig.query('SELECT 1');
      checks.database = 'connected';
      logger.debug('Database health check passed');
    } catch (error: any) {
      checks.database = 'disconnected';
      checks.databaseError = error.message;
      allHealthy = false;
      logger.error('Database health check failed', { error: error.message });
    }

    // Check Redis connection
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '2'),
        lazyConnect: true,
        maxRetriesPerRequest: 1
      });

      await redis.connect();
      await redis.ping();
      checks.redis = 'connected';
      logger.debug('Redis health check passed');
      await redis.quit();
    } catch (error: any) {
      checks.redis = 'disconnected';
      checks.redisError = error.message;
      allHealthy = false;
      logger.warn('Redis health check failed (non-critical)', { error: error.message });
    }

    // Check Auth Service connection
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL;
      if (authServiceUrl) {
        const response = await fetch(`${authServiceUrl}/health`);
        if (response.ok) {
          checks.authService = 'connected';
          logger.debug('Auth service health check passed');
        } else {
          checks.authService = 'degraded';
          checks.authServiceError = `Status ${response.status}`;
          logger.warn('Auth service health check degraded');
        }
      } else {
        checks.authService = 'not_configured';
      }
    } catch (error: any) {
      checks.authService = 'disconnected';
      checks.authServiceError = error.message;
      allHealthy = false;
      logger.error('Auth service health check failed', { error: error.message });
    }

    const status = allHealthy ? 200 : 503;

    res.status(status).json({
      status: allHealthy ? 'ready' : 'not_ready',
      service: 'payment-gateway-service',
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Health check error', { error: error.message });
    res.status(503).json({
      status: 'error',
      service: 'payment-gateway-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health metrics
 * GET /health/detailed
 */
router.get('/detailed', async (_req, res) => {
  try {
    const poolStats = DatabaseConfig.getPoolStats();

    res.status(200).json({
      service: 'payment-gateway-service',
      version: '2.0.0',
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: 'connected',
          poolStats: poolStats
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
          db: process.env.REDIS_DB
        },
        authService: {
          url: process.env.AUTH_SERVICE_URL
        }
      },
      features: {
        fraudDetection: process.env.ENABLE_FRAUD_DETECTION === 'true',
        autoReconciliation: process.env.ENABLE_AUTO_RECONCILIATION === 'true',
        webhooks: process.env.ENABLE_WEBHOOKS === 'true',
        tracing: process.env.ENABLE_TRACING === 'true',
        metrics: process.env.ENABLE_METRICS === 'true'
      }
    });
  } catch (error: any) {
    logger.error('Detailed health check error', { error: error.message });
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

export default router;

