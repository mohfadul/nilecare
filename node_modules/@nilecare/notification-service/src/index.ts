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
import Queue from 'bull';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
// ✅ MIGRATED: Using shared authentication middleware (centralized auth)
import { authenticate as authMiddleware } from './middleware/auth.middleware';
import { testConnection } from './config/database.config';
import SecretsConfig from './config/secrets.config';

// Routes
import notificationRoutes from './routes/notifications';
import templateRoutes from './routes/templates';
import deliveryRoutes from './routes/delivery';
import subscriptionRoutes from './routes/subscriptions';
import webhookRoutes from './webhooks/deliveryStatus';

// Services
import { NotificationService } from './services/NotificationService';
import { WebSocketService } from './services/WebSocketService';

// Event handlers
import { setupEventHandlers } from './events/handlers';

// Queue processors
import * as queueProcessors from './queues/processors';

// Scheduled jobs
import { setupCronJobs } from './jobs/scheduledNotifications';

dotenv.config();

// Environment validation
try {
  SecretsConfig.validateAll();
  logger.info('✅ Environment configuration validated');
} catch (error: any) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

let appInitialized = false;
const serviceStartTime = Date.now();


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3002;

// Initialize services
const notificationService = new NotificationService();
const webSocketService = new WebSocketService(io);

// Initialize queues
const notificationQueue = new Queue('notification processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

const emailQueue = new Queue('email sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

const smsQueue = new Queue('sms sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

const pushQueue = new Queue('push sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Notification Service API',
      version: '1.0.0',
      description: 'Real-time WebSocket, Email/SMS/Push Notifications, Templates, Delivery Tracking',
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

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      websocket: true,
      email: true,
      sms: true,
      push: true,
      templates: true,
      deliveryTracking: true,
      realTime: true
    },
    queues: {
      notification: notificationQueue.name,
      email: emailQueue.name,
      sms: smsQueue.name,
      push: pushQueue.name
    }
  });
});

// Readiness probe
app.get('/health/ready', async (_req, res) => {
  try {
    // Check database connection
    const dbReady = await testConnection();
    
    if (!dbReady) {
      res.status(503).json({ 
        status: 'not_ready', 
        reason: 'Database connection failed',
        timestamp: new Date().toISOString() 
      });
      return;
    }
    
    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Startup probe
app.get('/health/startup', (_req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (_req, res) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`service_uptime_seconds ${uptime}`);
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
app.use('/api/v1/templates', authMiddleware, templateRoutes);
app.use('/api/v1/delivery', authMiddleware, deliveryRoutes);
app.use('/api/v1/subscriptions', authMiddleware, subscriptionRoutes);

// Webhook Routes (no auth - verified by provider signatures)
app.use('/webhooks', webhookRoutes);

// WebSocket connection handling
io.use((_socket, next) => {
  // Authenticate socket connections
  // TODO: Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Notification client connected: ${socket.id}`);
  
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`Socket ${socket.id} joined user room: ${userId}`);
  });

  socket.on('join-organization-room', (organizationId: string) => {
    socket.join(`organization-${organizationId}`);
    logger.info(`Socket ${socket.id} joined organization room: ${organizationId}`);
  });

  socket.on('subscribe-notifications', (subscription: any) => {
    // Handle notification subscriptions
    webSocketService.handleSubscription(socket, subscription);
  });

  socket.on('disconnect', () => {
    logger.info(`Notification client disconnected: ${socket.id}`);
  });
});

// Queue processing with enhanced processors
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5');

notificationQueue.process('send-notification', concurrency, queueProcessors.processNotificationJob);
emailQueue.process('send-email', concurrency, queueProcessors.processEmailJob);
smsQueue.process('send-sms', concurrency, queueProcessors.processSMSJob);
pushQueue.process('send-push', concurrency, queueProcessors.processPushJob);

// Queue event listeners
notificationQueue.on('completed', queueProcessors.onJobComplete);
notificationQueue.on('failed', queueProcessors.onJobFailed);
notificationQueue.on('stalled', queueProcessors.onJobStalled);

emailQueue.on('completed', queueProcessors.onJobComplete);
emailQueue.on('failed', queueProcessors.onJobFailed);
emailQueue.on('stalled', queueProcessors.onJobStalled);

smsQueue.on('completed', queueProcessors.onJobComplete);
smsQueue.on('failed', queueProcessors.onJobFailed);
smsQueue.on('stalled', queueProcessors.onJobStalled);

pushQueue.on('completed', queueProcessors.onJobComplete);
pushQueue.on('failed', queueProcessors.onJobFailed);
pushQueue.on('stalled', queueProcessors.onJobStalled);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Setup event handlers
setupEventHandlers(io, notificationService, webSocketService);

// Setup cron jobs for scheduled notifications
if (process.env.ENABLE_SCHEDULED_NOTIFICATIONS !== 'false') {
  setupCronJobs();
}

// Start server
server.listen(PORT, async () => {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('📢  NOTIFICATION SERVICE STARTING');
  logger.info('═══════════════════════════════════════════════════════════');
  
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('❌ Database connection failed - service may not function correctly');
  }
  
  appInitialized = true;
  
  logger.info('');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('✅  NOTIFICATION SERVICE STARTED SUCCESSFULLY');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info(`📡  Service URL:       http://localhost:${PORT}`);
  logger.info(`🏥  Health Check:      http://localhost:${PORT}/health`);
  logger.info(`📊  Readiness:         http://localhost:${PORT}/health/ready`);
  logger.info(`📚  API Docs:          http://localhost:${PORT}/api-docs`);
  logger.info(`🔌  WebSocket:         ws://localhost:${PORT}`);
  logger.info('');
  logger.info('📍  Features:');
  logger.info('   WebSocket ✅  Email ✅  SMS ✅  Push ✅');
  logger.info('   Templates ✅  Delivery Tracking ✅');
  logger.info('');
  logger.info('✅ Notification Service Ready!');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    // Close queues
    await Promise.all([
      notificationQueue.close(),
      emailQueue.close(),
      smsQueue.close(),
      pushQueue.close()
    ]);
    logger.info('Queues closed');
    
    // Close database
    const { closePool } = await import('./config/database.config');
    await closePool();
    logger.info('Database closed');
    
    // Close HTTP server
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    // Close queues
    await Promise.all([
      notificationQueue.close(),
      emailQueue.close(),
      smsQueue.close(),
      pushQueue.close()
    ]);
    logger.info('Queues closed');
    
    // Close database
    const { closePool } = await import('./config/database.config');
    await closePool();
    logger.info('Database closed');
    
    // Close HTTP server
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

export { app, server, io };
