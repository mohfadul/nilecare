/**
 * Payment Gateway Service
 * Main entry point for NileCare payment processing
 * Port: 7001
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
const PORT = process.env.PORT || 7001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger); // Request logging
app.use(rateLimiter); // Rate limiting

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);
app.use('/api/v1/refunds', refundRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
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

