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
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Routes
import notificationRoutes from './routes/notifications';
import templateRoutes from './routes/templates';
import deliveryRoutes from './routes/delivery';
import subscriptionRoutes from './routes/subscriptions';

// Services
import { NotificationService } from './services/NotificationService';
import { TemplateService } from './services/TemplateService';
import { DeliveryService } from './services/DeliveryService';
import { WebSocketService } from './services/WebSocketService';
import { EmailService } from './services/EmailService';
import { SMSService } from './services/SMSService';
import { PushService } from './services/PushService';

// Event handlers
import { setupEventHandlers } from './events/handlers';

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
const templateService = new TemplateService();
const deliveryService = new DeliveryService();
const webSocketService = new WebSocketService(io);
const emailService = new EmailService();
const smsService = new SMSService();
const pushService = new PushService();

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
app.get('/health', (req, res) => {
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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
app.use('/api/v1/templates', authMiddleware, templateRoutes);
app.use('/api/v1/delivery', authMiddleware, deliveryRoutes);
app.use('/api/v1/subscriptions', authMiddleware, subscriptionRoutes);

// WebSocket connection handling
io.use((socket, next) => {
  // Authenticate socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
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

// Queue processing
notificationQueue.process('send-notification', async (job) => {
  const { notification } = job.data;
  return await notificationService.processNotification(notification);
});

emailQueue.process('send-email', async (job) => {
  const { emailData } = job.data;
  return await emailService.sendEmail(emailData);
});

smsQueue.process('send-sms', async (job) => {
  const { smsData } = job.data;
  return await smsService.sendSMS(smsData);
});

pushQueue.process('send-push', async (job) => {
  const { pushData } = job.data;
  return await pushService.sendPush(pushData);
});

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

// Start server
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`WebSocket server available at ws://localhost:${PORT}`);
  logger.info(`Features enabled: WebSocket, Email, SMS, Push, Templates, Delivery Tracking`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close queues
  Promise.all([
    notificationQueue.close(),
    emailQueue.close(),
    smsQueue.close(),
    pushQueue.close()
  ]).then(() => {
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close queues
  Promise.all([
    notificationQueue.close(),
    emailQueue.close(),
    smsQueue.close(),
    pushQueue.close()
  ]).then(() => {
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
});

export { app, server, io };
