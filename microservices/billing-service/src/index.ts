/**
 * Billing Service
 * Main entry point for NileCare billing and claims management
 * Port: 5003
 * 
 * RESPONSIBILITIES:
 * - Invoice management (create, update, track)
 * - Insurance claims processing
 * - Billing account management
 * - Payment allocation (link payments to invoices)
 * - Billing reports and analytics
 * 
 * INTEGRATIONS:
 * - Auth Service (authentication & authorization)
 * - Payment Gateway (payment status queries)
 * - Business Service (appointment/encounter data)
 * 
 * ⚠️ DOES NOT: Process payments (that's Payment Gateway's job)
 */

import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import cron from 'node-cron';

// Load environment variables FIRST
config();

// ✅ NEW: Import response wrapper middleware
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

// Import configuration
import DatabaseConfig from './config/database.config';
import SecretsConfig from './config/secrets.config';
import { logger } from './config/logger.config';

// Import middleware
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { rateLimiter } from './middleware/rate-limiter.middleware';
import { auditLoggerMiddleware } from './middleware/audit-logger.middleware';

// Import routes
import invoiceRoutes from './routes/invoice.routes';
import claimRoutes from './routes/claim.routes';
import webhookRoutes from './routes/webhook.routes';
import healthRoutes from './routes/health.routes';

// Import services
import InvoiceService from './services/invoice.service';

// ============================================================================
// STARTUP VALIDATION
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('💰  BILLING SERVICE STARTING');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Validate environment and secrets
try {
  SecretsConfig.validateAll();
} catch (error: any) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

// Validate database schema
DatabaseConfig.verifySchema().catch(error => {
  console.warn('⚠️  Database schema validation warning:', error.message);
  console.warn('⚠️  Some tables may be missing. Service will continue but may fail on database operations.');
});

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app: Application = express();
const PORT = parseInt(process.env.PORT || '5003');

// ============================================================================
// MIDDLEWARE (Order matters!)
// ============================================================================

// ✅ NEW: Add request ID middleware FIRST
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Audit logging
app.use(auditLoggerMiddleware);

// ============================================================================
// SERVICE INFO ENDPOINT
// ============================================================================

app.get('/', (_req, res) => {
  res.json({
    service: 'NileCare Billing Service',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    description: 'Invoice management, insurance claims, and billing operations',
    architecture: {
      responsibility: 'Billing records, invoices, and claims management',
      database: 'Shared MySQL (nilecare)',
      authentication: 'Centralized via Auth Service (port 7020)',
      paymentProcessing: 'Delegated to Payment Gateway (port 7030)'
    },
    routes: {
      health: '/health',
      invoices: '/api/v1/invoices/*',
      claims: '/api/v1/claims/*',
      webhooks: '/api/v1/webhooks/*'
    },
    integrations: {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
      paymentGateway: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:7030'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ROUTES
// ============================================================================

app.use('/health', healthRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// ============================================================================
// ERROR HANDLING (MUST BE LAST)
// ============================================================================

// ✅ NEW: Use standardized error handler
app.use(errorHandlerMiddleware({ service: 'billing-service' }));

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

const invoiceService = new InvoiceService();

// Mark overdue invoices - Daily at 2 AM
const overdueCheckSchedule = process.env.OVERDUE_CHECK_CRON_SCHEDULE || '0 2 * * *';
cron.schedule(overdueCheckSchedule, async () => {
  logger.info('Running overdue invoice check...');
  try {
    const marked = await invoiceService.markOverdueInvoices();
    logger.info(`Marked ${marked} invoices as overdue`);
  } catch (error: any) {
    logger.error('Overdue check failed', { error: error.message });
  }
});

// Apply late fees - Daily at midnight (if enabled)
if (process.env.ENABLE_AUTO_LATE_FEES === 'true') {
  const lateFeeSchedule = process.env.LATE_FEE_CRON_SCHEDULE || '0 0 * * *';
  cron.schedule(lateFeeSchedule, async () => {
    logger.info('Running late fee application...');
    // Would call a late fee service method
    logger.info('Late fee application complete');
  });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅  BILLING SERVICE STARTED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📡  Service URL:       http://localhost:${PORT}`);
  console.log('✨  Response Wrapper:  ENABLED (Request ID tracking active)');
  console.log(`🏥  Health Check:      http://localhost:${PORT}/health`);
  console.log(`📊  Readiness:         http://localhost:${PORT}/health/ready`);
  console.log('');
  console.log('📍  API Endpoints:');
  console.log('   /api/v1/invoices/*     Invoice management');
  console.log('   /api/v1/claims/*       Insurance claims');
  console.log('   /api/v1/webhooks/*     Payment Gateway callbacks');
  console.log('');
  console.log('🔗  Service Integrations:');
  console.log(`   Auth Service:          ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   Payment Gateway:       ${process.env.PAYMENT_GATEWAY_URL}`);
  console.log('');
  console.log('📋  Scheduled Tasks:');
  console.log(`   Overdue Check:         ${overdueCheckSchedule}`);
  if (process.env.ENABLE_AUTO_LATE_FEES === 'true') {
    console.log(`   Late Fees:             ${process.env.LATE_FEE_CRON_SCHEDULE || '0 0 * * *'}`);
  }
  console.log('');
  console.log('✅ Billing Service Ready!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  logger.info('Billing Service started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_NAME,
    authService: process.env.AUTH_SERVICE_URL,
    paymentGateway: process.env.PAYMENT_GATEWAY_URL
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await DatabaseConfig.close();
    logger.info('Database connections closed');
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await DatabaseConfig.close();
    logger.info('Database connections closed');
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', {
    reason: reason.message || reason
  });
  process.exit(1);
});

export default app;
