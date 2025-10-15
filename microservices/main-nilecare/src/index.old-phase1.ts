/**
 * Main NileCare Service
 * Central integration and orchestration microservice
 * Port: 3006 (default)
 * 
 * Responsibilities:
 * - General data management (patients, users, appointments)
 * - Bulk operations
 * - Advanced search
 * - Audit logging
 * - Cross-service orchestration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import winston from 'winston';
import cookieParser from 'cookie-parser';

// Load environment variables
config();

// Import routes
import healthRoutes from './routes/health.routes';
import dataRoutes from './routes/data.routes';
import bulkRoutes from './routes/bulk.routes';
import searchRoutes from './routes/search.routes';
import auditRoutes from './routes/audit.routes';
import orchestratorRoutes from './routes/orchestrator.routes';
import serviceDiscoveryRoutes from './routes/service-discovery.routes';
import businessRoutes from './routes/business.routes';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';
import { auditLogger } from './middleware/audit-logger';

// Import authentication middleware (local copy for module resolution)
import { authenticate } from './middleware/auth';

// Import service registry
import { createServiceRegistry } from './services/service-registry';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service }) => {
          return `${timestamp} [${level}] ${message} ${service ? JSON.stringify({ service }) : ''}`;
        })
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
  defaultMeta: { service: 'main-nilecare' }
});

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 7000; // ✅ FIXED: Changed from 3006 to match documentation

// =================================================================
// MIDDLEWARE
// =================================================================

// Configure Helmet with relaxed settings for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    ...(process.env.CORS_ORIGIN?.split(',') || [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, _res, buf, _encoding) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req: any, _res, buf, _encoding) => {
    req.rawBody = buf;
  }
}));

// Handle body parser errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === 'entity.parse.failed' || err.name === 'BadRequestError') {
    logger.error('Body parser error:', {
      name: err.name,
      message: err.message,
      path: req.path,
      method: req.method
    });
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid request body'
      }
    });
  }
  next(err);
});

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Audit logging
app.use(auditLogger);

// =================================================================
// ROUTES
// =================================================================

// Health check (public)
app.use('/health', healthRoutes);

// Service info endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'NileCare Main Integration Service',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    description: 'Central orchestration and data management',
    routes: {
      health: '/health',
      healthReady: '/health/ready',
      healthStatus: '/health/status',
      data: '/api/v1/data/* (patients, users, dashboard)',
      bulk: '/api/v1/bulk/* (bulk operations)',
      search: '/api/v1/search/* (advanced search)',
      audit: '/api/v1/audit/* (audit logs)',
      business: '/api/business/* (appointments, billing, staff, scheduling)',
      orchestrator: '/api/* (microservice orchestration)'
    },
    integrations: {
      authService: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007',
      appointmentService: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004',
      businessService: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3005'
    },
    timestamp: new Date().toISOString()
  });
});

// Data routes (general data management)
app.use('/api/v1/data', dataRoutes);
app.use('/api/v1', dataRoutes); // Also mount at /api/v1 for legacy compatibility

// Bulk operations (require authentication)
app.use('/api/v1/bulk', authenticate, bulkRoutes);

// Search routes (require authentication)
app.use('/api/v1/search', authenticate, searchRoutes);

// Audit routes (require authentication)
app.use('/api/v1/audit', authenticate, auditRoutes);

// Business service proxy routes (require authentication)
app.use('/api/business', businessRoutes);

// Orchestrator routes (microservice routing and aggregation)
app.use('/api', orchestratorRoutes);

// Service discovery routes (service registry)
app.use('/api/discovery', serviceDiscoveryRoutes);

// =================================================================
// ERROR HANDLING
// =================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      suggestion: 'Check the API documentation at /'
    }
  });
});

// Global error handler
app.use(errorHandler);

// =================================================================
// START SERVER
// =================================================================

let appInitialized = false;

// Initialize service registry
const serviceRegistry = createServiceRegistry(logger);

const server = app.listen(PORT, () => {
  appInitialized = true;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀  MAIN NILECARE SERVICE STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📡  Service URL:       http://localhost:${PORT}`);
  console.log(`🏥  Health Check:      http://localhost:${PORT}/health`);
  console.log(`📊  Service Info:      http://localhost:${PORT}/`);
  console.log('');
  console.log('📍  Available Endpoints:');
  console.log('   /api/v1/data/*        General data management');
  console.log('   /api/v1/bulk/*        Bulk operations (auth required)');
  console.log('   /api/v1/search/*      Advanced search (auth required)');
  console.log('   /api/v1/audit/*       Audit logs (auth required)');
  console.log('   /api/business/*       Business service (auth required)');
  console.log('');
  console.log('🔗  Downstream Services:');
  console.log(`   Auth Service:         ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
  console.log(`   Payment Service:      ${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007'}`);
  console.log(`   Appointment Service:  ${process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004'}`);
  console.log(`   Business Service:     ${process.env.BUSINESS_SERVICE_URL || 'http://localhost:3005'}`);
  console.log('');
  console.log('⚡  Features:');
  console.log('   ✅ Shared Authentication (JWT)');
  console.log('   ✅ Rate Limiting');
  console.log('   ✅ Audit Logging');
  console.log('   ✅ CORS Protection');
  console.log('   ✅ Security Headers');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  logger.info('Main NileCare service started', { port: PORT });
  
  // Start periodic health checks
  serviceRegistry.startHealthChecks(30000); // Every 30 seconds
});

// =================================================================
// GRACEFUL SHUTDOWN
// =================================================================

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  // Stop health checks
  serviceRegistry.stopHealthChecks();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// =================================================================
// ERROR HANDLERS
// =================================================================

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

export default app;

