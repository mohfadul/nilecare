/**
 * Payment Gateway Service
 * Main entry point for NileCare payment processing
 * Port: 3007 (UPDATED - was 7001, now focused on payments only)
 * 
 * NOTE: General data operations moved to main-nilecare service (port 3006)
 */

import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from 'dotenv';
import winston from 'winston';

// Load environment variables
config();

// Import routes
import paymentRoutes from './routes/payment.routes';
import reconciliationRoutes from './routes/reconciliation.routes';
import refundRoutes from './routes/refund.routes';
import healthRoutes from './routes/health.routes';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 7030; // Payment Gateway Service port as per NileCare documentation

// Middleware
// Configure Helmet with relaxed settings for development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Configure CORS to allow frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(compression()); // Compress responses

// Body parser with better error handling and timeout
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, _res, buf, _encoding) => {
    // Store raw body for verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req: any, _res, buf, _encoding) => {
    // Store raw body for verification if needed
    req.rawBody = buf;
  }
}));

// Handle body parser errors gracefully
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

app.use(require('cookie-parser')()); // Parse cookies for refresh tokens
app.use(requestLogger); // Request logging
app.use(rateLimiter); // Rate limiting

// =================================================================
// SERVICE INFO
// =================================================================

app.get('/', (_req, res) => {
  res.json({
    service: 'NileCare Payment Gateway Service',
    version: '2.0.0',
    status: 'running',
    port: PORT,
    description: 'Payment processing, reconciliation, and refunds',
    notice: {
      message: 'This service now focuses ONLY on payment operations',
      movedTo: 'General data/bulk/search/audit operations moved to main-nilecare (port 3006)'
    },
    routes: {
      health: '/health',
      payments: '/api/v1/payments/*',
      reconciliation: '/api/v1/reconciliation/*',
      refunds: '/api/v1/refunds/*'
    },
    redirections: {
      auth: 'http://localhost:3001/api/v1/auth (Auth Service)',
      data: 'http://localhost:3006/api/v1/data (Main NileCare)',
      bulk: 'http://localhost:3006/api/v1/bulk (Main NileCare)',
      search: 'http://localhost:3006/api/v1/search (Main NileCare)',
      audit: 'http://localhost:3006/api/v1/audit (Main NileCare)'
    },
    timestamp: new Date().toISOString()
  });
});

// =================================================================
// ROUTES
// =================================================================

app.use('/health', healthRoutes);

// Redirect deprecated endpoints to correct services
app.use('/api/v1/auth', (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'ENDPOINT_MOVED',
      message: 'Authentication endpoints have moved to Auth Service',
      correctEndpoint: 'http://localhost:3001/api/v1/auth',
      viaGateway: 'http://localhost:7001/api/v1/auth'
    }
  });
});

app.use('/api/v1/data', (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'ENDPOINT_MOVED',
      message: 'Data endpoints have moved to Main NileCare Service',
      correctEndpoint: 'http://localhost:3006/api/v1/data',
      viaGateway: 'http://localhost:7001/api/v1/data'
    }
  });
});

app.use('/api/v1/bulk', (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'ENDPOINT_MOVED',
      message: 'Bulk operations have moved to Main NileCare Service',
      correctEndpoint: 'http://localhost:3006/api/v1/bulk',
      viaGateway: 'http://localhost:7001/api/v1/bulk'
    }
  });
});

app.use('/api/v1/search', (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'ENDPOINT_MOVED',
      message: 'Search endpoints have moved to Main NileCare Service',
      correctEndpoint: 'http://localhost:3006/api/v1/search',
      viaGateway: 'http://localhost:7001/api/v1/search'
    }
  });
});

app.use('/api/v1/audit', (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: 'ENDPOINT_MOVED',
      message: 'Audit endpoints have moved to Main NileCare Service',
      correctEndpoint: 'http://localhost:3006/api/v1/audit',
      viaGateway: 'http://localhost:7001/api/v1/audit'
    }
  });
});

// Payment-specific routes (core functionality)
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/refunds', refundRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💳  PAYMENT GATEWAY SERVICE STARTED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📡  Service URL:       http://localhost:${PORT}`);
  console.log(`🏥  Health Check:      http://localhost:${PORT}/health`);
  console.log('');
  console.log('📍  Payment Operations:');
  console.log('   /api/v1/payments/*         Payment processing');
  console.log('   /api/v1/reconciliation/*   Payment reconciliation');
  console.log('   /api/v1/refunds/*          Refund processing');
  console.log('');
  console.log('⚠️  Moved Endpoints:');
  console.log('   /api/v1/data/*       → main-nilecare:3006');
  console.log('   /api/v1/bulk/*       → main-nilecare:3006');
  console.log('   /api/v1/search/*     → main-nilecare:3006');
  console.log('   /api/v1/audit/*      → main-nilecare:3006');
  console.log('   /api/v1/auth/*       → auth-service:3001');
  console.log('');
  console.log('✅ Payment Gateway Ready!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  logger.info(`Payment Gateway Service listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

