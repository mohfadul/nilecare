import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { merge } from 'swagger-merge';
import requestId from 'express-request-id';
import cacheResponseDirective from 'express-cache-response-directive';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';
import { responseTransformer } from './middleware/responseTransformer';
import { corsMiddleware } from './middleware/cors';

// Services
import { GatewayService } from './services/GatewayService';
import { SwaggerService } from './services/SwaggerService';
import { ProxyService } from './services/ProxyService';

dotenv.config();

// Environment validation
const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();


const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Initialize services
const gatewayService = new GatewayService();
const swaggerService = new SwaggerService();
const proxyService = new ProxyService();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));
app.use(requestId());
app.use(cacheResponseDirective());
app.use(corsMiddleware);
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'gateway-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      apiRouting: true,
      requestComposition: true,
      responseTransformation: true,
      cors: true,
      securityHeaders: true,
      swaggerDocumentation: true,
      rateLimiting: true,
      caching: true
    }
  });

// Readiness probe
app.get('/health/ready', async (req, res) => {
  try {
    // Check database if available
    if (typeof dbPool !== 'undefined' && dbPool) {
      await dbPool.query('SELECT 1');
    }
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

// Startup probe
app.get('/health/startup', (req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`service_uptime_seconds ${uptime}`);
});

});

// API Documentation (Swagger)
app.get('/api-docs/swagger.json', async (req, res) => {
  try {
    const swaggerSpec = await swaggerService.getMergedSwaggerSpec();
    res.json(swaggerSpec);
  } catch (error) {
    logger.error('Error generating Swagger spec:', error);
    res.status(500).json({ error: 'Failed to generate API documentation' });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: {
    url: '/api-docs/swagger.json'
  }
}));

// API Routes with Authentication
app.use('/api/v1/auth', authMiddleware, proxyService.createProxy('/api/v1/auth', {
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/api/v1/auth' }
}));

app.use('/api/v1/patients', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/patients', {
  target: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/patients': '/api/v1/patients' }
}));

app.use('/api/v1/encounters', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/encounters', {
  target: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/encounters': '/api/v1/encounters' }
}));

app.use('/api/v1/medications', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/medications', {
  target: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/medications': '/api/v1/medications' }
}));

app.use('/api/v1/diagnostics', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/diagnostics', {
  target: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/diagnostics': '/api/v1/diagnostics' }
}));

app.use('/api/v1/fhir', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/fhir', {
  target: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/fhir': '/api/v1/fhir' }
}));

app.use('/api/v1/appointments', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/appointments', {
  target: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/appointments': '/api/v1/appointments' }
}));

app.use('/api/v1/billing', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/billing', {
  target: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/billing': '/api/v1/billing' }
}));

app.use('/api/v1/scheduling', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/scheduling', {
  target: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/scheduling': '/api/v1/scheduling' }
}));

app.use('/api/v1/staff', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/staff', {
  target: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/staff': '/api/v1/staff' }
}));

app.use('/api/v1/analytics', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/analytics', {
  target: process.env.DATA_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/analytics': '/api/v1/analytics' }
}));

app.use('/api/v1/reports', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/reports', {
  target: process.env.DATA_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/reports': '/api/v1/reports' }
}));

app.use('/api/v1/dashboard', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/dashboard', {
  target: process.env.DATA_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/dashboard': '/api/v1/dashboard' }
}));

app.use('/api/v1/insights', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/insights', {
  target: process.env.DATA_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/insights': '/api/v1/insights' }
}));

// Notification routes
app.use('/api/v1/notifications', authMiddleware, responseTransformer, proxyService.createProxy('/api/v1/notifications', {
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/v1/notifications': '/api/v1/notifications' }
}));

// WebSocket proxy for real-time notifications
app.use('/ws/notifications', proxyService.createWebSocketProxy({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002',
  ws: true,
  changeOrigin: true
}));

// Rate limiting (applied after auth middleware)
app.use('/api', rateLimiter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Gateway service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Features enabled: API Routing, Composition, Transformation, CORS, Swagger Documentation`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, server };
