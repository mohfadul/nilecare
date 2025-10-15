/**
 * Health Check Routes
 * System health and readiness endpoints
 */

import { Router, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';

const router = Router();

/**
 * Get database connection
 */
const getConnection = async () => {
  return await mysql.createConnection({
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
router.get('/', async (_req: Request, res: Response) => {
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
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: any = {
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
  } catch (error: any) {
    checks.database = 'disconnected';
    checks.databaseError = error.message;
  }

  // Check auth-service
  try {
    const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    await axios.get(`${authUrl}/health`, { timeout: 3000 });
    checks.authService = 'healthy';
  } catch (error: any) {
    checks.authService = 'unreachable';
  }

  // Check payment-service
  try {
    const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007';
    await axios.get(`${paymentUrl}/health`, { timeout: 3000 });
    checks.paymentService = 'healthy';
  } catch (error: any) {
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
router.get('/status', async (_req: Request, res: Response) => {
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
        totalPatients: (patientsCount as any)[0].count,
        totalUsers: (usersCount as any)[0].count,
        totalAppointments: (appointmentsCount as any)[0].count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_CHECK_FAILED', message: error.message }
    });
  } finally {
    await connection.end();
  }
});

export default router;

