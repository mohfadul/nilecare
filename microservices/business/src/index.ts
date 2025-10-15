import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import mysql from 'mysql2/promise';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
// Using local authentication middleware (copied from shared)
import { authenticate as authMiddleware } from './middleware/auth';
// PRIORITY 1.1: Comprehensive audit logging
import { createAuditMiddleware } from './middleware/auditMiddleware';

// Controllers (imported first to avoid circular dependency)
import { BillingController } from './controllers/BillingController';
import { SchedulingController } from './controllers/SchedulingController';
import { StaffController } from './controllers/StaffController';
import { AppointmentController } from './controllers/AppointmentController';

// Event handlers
import { 
  setupEventHandlers,
  AppointmentEventEmitter,
  BillingEventEmitter,
  ScheduleEventEmitter,
  StaffEventEmitter
} from './events/handlers';

dotenv.config();

// ✅ NEW: Import response wrapper middleware
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER'];

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // DB_PASSWORD is optional (can be empty for local development with XAMPP)
  if (process.env.DB_PASSWORD === undefined) {
    process.env.DB_PASSWORD = '';
  }
  
  logger.info('✅ Environment variables validated');
}

validateEnvironment();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.PORT || '7010');
let appInitialized = false;
const serviceStartTime = Date.now();

// ============================================================================
// DATABASE CONNECTION POOL (MySQL via XAMPP)
// ============================================================================

const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create controller instances
const appointmentController = new AppointmentController();
const billingController = new BillingController(dbPool);
const schedulingController = new SchedulingController(dbPool);
const staffController = new StaffController(dbPool);

// Inject database pool into appointment controller
appointmentController.setDatabase(dbPool);

// Dynamically require routes and pass controllers (avoiding circular dependency)
const { createAppointmentRoutes } = require('./routes/appointments');
const { createBillingRoutes } = require('./routes/billing');
const { createSchedulingRoutes } = require('./routes/scheduling');
const { createStaffRoutes } = require('./routes/staff');
const { createAuditRoutes } = require('./routes/audit');

const appointmentRoutes = createAppointmentRoutes(appointmentController);
const billingRoutes = createBillingRoutes(billingController);
const schedulingRoutes = createSchedulingRoutes(schedulingController);
const staffRoutes = createStaffRoutes(staffController);
const auditRoutes = createAuditRoutes(dbPool);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Business API',
      version: '1.0.0',
      description: 'Business domain microservices for healthcare management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ============================================================================
// MIDDLEWARE (Order matters!)
// ============================================================================

// ✅ NEW: Add request ID middleware FIRST
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// ============================================================================
// PRIORITY 1.1: AUDIT LOGGING MIDDLEWARE
// ============================================================================
// Tracks ALL business operations: WHO, WHAT, WHEN, WHERE
// Compliance requirement for healthcare data access tracking
app.use(createAuditMiddleware(dbPool));

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// Liveness probe
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'business-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    features: {
      appointments: true,
      billing: true,
      scheduling: true,
      staff: true,
    },
  });
});

// Readiness probe
app.get('/health/ready', async (_req, res) => {
  try {
    const dbStart = Date.now();
    
    // Check basic connectivity
    await dbPool.query('SELECT 1 as health_check');
    const dbLatency = Date.now() - dbStart;
    
    // Verify critical tables exist
    const tableCheckStart = Date.now();
    const [tables] = await dbPool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('appointments', 'billings', 'schedules', 'staff')
    `, [process.env.DB_NAME || 'nilecare_business']) as any;
    
    const tableCheckLatency = Date.now() - tableCheckStart;
    const requiredTables = ['appointments', 'billings', 'schedules', 'staff'];
    const existingTables = tables.map((row: any) => row.TABLE_NAME);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    const allTablesExist = missingTables.length === 0;
    
    res.status(allTablesExist ? 200 : 503).json({
      status: allTablesExist ? 'ready' : 'degraded',
      checks: {
        database: {
          healthy: true,
          latency: dbLatency,
          type: 'MySQL',
          connection: 'ok'
        },
        tables: {
          healthy: allTablesExist,
          latency: tableCheckLatency,
          required: requiredTables,
          existing: existingTables,
          missing: missingTables,
          message: allTablesExist 
            ? 'All required tables exist' 
            : `Missing tables: ${missingTables.join(', ')}`
        }
      },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: {
          healthy: false,
          error: error.message,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe
app.get('/health/startup', (_req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  // MySQL pool stats (different from pg Pool)
  const poolConfig = dbPool.pool.config;
  const poolStats = {
    connectionLimit: poolConfig.connectionLimit || 20,
    queueLimit: poolConfig.queueLimit || 0,
  };
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
business_service_uptime_seconds ${Math.floor((Date.now() - serviceStartTime) / 1000)}
db_pool_connection_limit ${poolStats.connectionLimit}
db_pool_queue_limit ${poolStats.queueLimit}
db_type mysql
  `.trim());
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/appointments', authMiddleware, appointmentRoutes);
app.use('/api/v1/billing', authMiddleware, billingRoutes);
app.use('/api/v1/scheduling', authMiddleware, schedulingRoutes);
app.use('/api/v1/staff', authMiddleware, staffRoutes);
// PRIORITY 1.1: Audit log access endpoints (admin/compliance officer only)
app.use('/api/v1/audit', authMiddleware, auditRoutes);

// Socket.IO for real-time updates
io.use((_socket, next) => {
  // TODO: Implement token validation
  // const token = _socket.handshake.auth.token;
  // Validate token here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-organization-room', (organizationId: string) => {
    socket.join(`organization-${organizationId}`);
    logger.info(`Socket ${socket.id} joined organization room: ${organizationId}`);
  });

  socket.on('join-staff-room', (staffId: string) => {
    socket.join(`staff-${staffId}`);
    logger.info(`Socket ${socket.id} joined staff room: ${staffId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ============================================================================
// ERROR HANDLING (MUST BE LAST)
// ============================================================================

// ✅ NEW: Use standardized error handler
app.use(errorHandlerMiddleware({ service: 'business-service' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Setup event handlers
setupEventHandlers(io);

// Initialize event emitters for real-time updates
const appointmentEmitter = new AppointmentEventEmitter(io);
const billingEmitter = new BillingEventEmitter(io);
const scheduleEmitter = new ScheduleEventEmitter(io);
const staffEmitter = new StaffEventEmitter(io);

// Export event emitters for use in controllers/services
export { appointmentEmitter, billingEmitter, scheduleEmitter, staffEmitter };

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

async function initializeService(): Promise<void> {
  try {
    logger.info('🚀 Initializing business service...');
    
    // Test database connection (MySQL)
    await dbPool.query('SELECT 1 as value');
    logger.info('✅ MySQL database connected');
    
    appInitialized = true;
    logger.info('✅ Service initialization complete');
    
  } catch (error: any) {
    logger.error('❌ Service initialization failed:', error.message);
    throw error;
  }
}

async function cleanup(): Promise<void> {
  logger.info('🧹 Cleaning up resources...');
  
  try {
    await dbPool.end();
    logger.info('✅ MySQL database pool closed');
    
    io.close(() => {
      logger.info('✅ Socket.IO closed');
    });
  } catch (error: any) {
    logger.error('⚠️  Cleanup error:', error.message);
  }
}

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await cleanup();
    logger.info('Business service shut down successfully');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start service
(async () => {
  try {
    await initializeService();
    
    server.listen(PORT, () => {
      logger.info('╔═══════════════════════════════════════════════════╗');
      logger.info('║   BUSINESS SERVICE STARTED                        ║');
      logger.info('╚═══════════════════════════════════════════════════╝');
      logger.info(`✅ Service: business-service`);
      logger.info('✨ Response Wrapper: ENABLED (Request ID tracking active)');
      logger.info(`✅ Port: ${PORT}`);
      logger.info(`✅ Health: http://localhost:${PORT}/health`);
      logger.info(`✅ Ready: http://localhost:${PORT}/health/ready`);
      logger.info(`✅ Metrics: http://localhost:${PORT}/metrics`);
      logger.info('═══════════════════════════════════════════════════');
    });
  } catch (error: any) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
})();

export { app, server, io };

