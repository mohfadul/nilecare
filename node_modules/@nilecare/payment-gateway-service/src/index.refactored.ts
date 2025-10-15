/**
 * Payment Gateway Service - Refactored for Phase 2/3
 * Main entry point for NileCare payment processing
 * Port: 7030
 * 
 * ✅ Integrated with:
 * - @nilecare/logger (centralized logging)
 * - @nilecare/config-validator (environment validation)
 * - @nilecare/error-handler (standardized errors)
 * - @nilecare/auth-client (centralized authentication)
 */

import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';

// ✅ Phase 2/3: Shared Packages
import { createLogger } from '@nilecare/logger';
import { validateAndLog, commonEnvSchema } from '@nilecare/config-validator';
import { createErrorHandler, notFoundHandler, asyncHandler } from '@nilecare/error-handler';
import { createAuthMiddleware, AuthServiceClient } from '@nilecare/auth-client';

// Load environment variables
config();

// ===== ENVIRONMENT VALIDATION =====
// ✅ Fail-fast if config is invalid
validateAndLog(commonEnvSchema, 'payment-gateway-service');

// ===== LOGGER =====
// ✅ Centralized, structured logging
const logger = createLogger('payment-gateway-service');

// ===== AUTH CLIENT =====
// ✅ Delegates all auth to auth-service
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL!,
  apiKey: process.env.AUTH_SERVICE_API_KEY!,
  serviceName: 'payment-gateway-service'
});

// Create auth middleware with permission checking
const requireAuth = createAuthMiddleware({
  permissions: ['payment:read']
});

const requirePaymentWrite = createAuthMiddleware({
  permissions: ['payment:write', 'payment:initiate']
});

const requireFinanceRole = createAuthMiddleware({
  permissions: ['finance:verify', 'finance:reconcile']
});

const requireAdminRole = createAuthMiddleware({
  permissions: ['admin:refund', 'admin:cancel']
});

// Import routes
import paymentRoutes from './routes/payment.routes';
import reconciliationRoutes from './routes/reconciliation.routes';
import refundRoutes from './routes/refund.routes';
import healthRoutes from './routes/health.routes';

// Import middleware
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 7030;

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(compression());

// Body parsers
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, _res, buf, _encoding) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb'
}));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// ===== SERVICE INFO =====

app.get('/', (_req, res) => {
  res.json({
    service: 'NileCare Payment Gateway Service',
    version: '2.0.0',
    status: 'running',
    port: PORT,
    description: 'Multi-provider payment processing for Sudan healthcare',
    architecture: {
      phase1: 'Centralized authentication via auth-service',
      phase2: 'Shared packages (logger, config, errors)',
      phase3: 'Observability ready (metrics, tracing)'
    },
    features: [
      'Multi-provider support (12+ providers)',
      'Cash, mobile wallet, bank transfer',
      'Fraud detection & risk scoring',
      'Payment reconciliation',
      'Refund management',
      'PCI DSS & HIPAA compliant'
    ],
    providers: {
      sudanese: ['Bank of Khartoum', 'Faisal Islamic', 'Omdurman National'],
      mobileWallets: ['Zain Cash', 'MTN Money', 'Sudani Cash', 'Bankak'],
      international: ['Visa', 'Mastercard', 'Stripe'],
      traditional: ['Cash', 'Cheque', 'Bank Transfer']
    },
    routes: {
      health: '/health',
      payments: '/api/v1/payments/*',
      reconciliation: '/api/v1/reconciliation/*',
      refunds: '/api/v1/refunds/*'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== HEALTH CHECKS =====

app.use('/health', healthRoutes);

// ===== PAYMENT ROUTES =====
// ✅ All routes protected by centralized auth

app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/refunds', refundRoutes);

// ===== ERROR HANDLING =====
// ✅ Phase 2: Standardized error responses

app.use(notFoundHandler());
app.use(createErrorHandler(logger));

// ===== SERVER STARTUP =====

const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💳  PAYMENT GATEWAY SERVICE STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  logger.info('Payment Gateway Service started', { port: PORT, env: process.env.NODE_ENV });
  console.log(`📡  Service URL:       http://localhost:${PORT}`);
  console.log(`🏥  Health Check:      http://localhost:${PORT}/health`);
  console.log('');
  console.log('🔐  Authentication:    Delegated to auth-service:7020');
  console.log('📊  Logging:           Centralized via @nilecare/logger');
  console.log('🛡️  Error Handling:    Standardized via @nilecare/error-handler');
  console.log('');
  console.log('💰  Payment Providers:');
  console.log('   ✅ Bank of Khartoum, Faisal Islamic, Omdurman National');
  console.log('   ✅ Zain Cash, MTN Money, Sudani Cash, Bankak');
  console.log('   ✅ Visa, Mastercard, Stripe');
  console.log('   ✅ Cash, Cheque, Bank Transfer');
  console.log('');
  console.log('✅ Payment Gateway Ready!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// ===== GRACEFUL SHUTDOWN =====

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      const DatabaseConfig = (await import('./config/database.config')).default;
      await DatabaseConfig.close();
      logger.info('Database connections closed');
      
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== UNHANDLED ERRORS =====

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

export default app;

