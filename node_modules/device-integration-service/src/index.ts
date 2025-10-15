/**
 * Device Integration Service - Main Entry Point
 * NileCare Healthcare Platform
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Configuration
import { config, validateConfig } from './config/env';
import { initializeDatabase, closeDatabase } from './config/database';
import { initializeRedis, closeRedis } from './config/redis';

// Routes
import { initializeDeviceRoutes } from './routes/devices';
import { initializeVitalSignsRoutes } from './routes/vital-signs';
import healthRoutes from './routes/health';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { standardLimiter } from './middleware/rateLimiter';

// Logger
import logger from './utils/logger';

// Initialize Express app
const app: Express = express();
const server = createServer(app);

// Socket.IO for real-time device data
const io = new SocketIOServer(server, {
  cors: {
    origin: config.ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
  transports: ['websocket', 'polling'],
});

// Middleware Configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(cors({
  origin: config.ALLOWED_ORIGINS.split(','),
  credentials: true,
}));

app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.use(standardLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Device Integration Service API',
      version: '1.0.0',
      description: 'Medical device connectivity and vital signs monitoring service for NileCare Healthcare Platform',
      contact: {
        name: 'NileCare Development Team',
        email: 'dev@nilecare.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'Device Integration API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Health Routes (no authentication required)
app.use('/health', healthRoutes);

// API Routes (will be initialized after database connection)
let deviceRoutes: any;
let vitalSignsRoutes: any;

// WebSocket Connection Handling
io.on('connection', (socket) => {
  logger.info(`Device client connected: ${socket.id}`);

  // Subscribe to specific device updates
  socket.on('subscribe-device', (deviceId: string) => {
    socket.join(`device-${deviceId}`);
    logger.info(`Client ${socket.id} subscribed to device ${deviceId}`);
  });

  // Subscribe to patient's devices
  socket.on('subscribe-patient', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    logger.info(`Client ${socket.id} subscribed to patient ${patientId} devices`);
  });

  // Unsubscribe from device
  socket.on('unsubscribe-device', (deviceId: string) => {
    socket.leave(`device-${deviceId}`);
    logger.info(`Client ${socket.id} unsubscribed from device ${deviceId}`);
  });

  // Handle device heartbeat
  socket.on('device-heartbeat', (data: any) => {
    const { deviceId } = data;
    io.to(`device-${deviceId}`).emit('heartbeat-received', {
      deviceId,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Device client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error: ${socket.id}`, { error: error.message });
  });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Server Initialization Function
async function startServer(): Promise<void> {
  try {
    logger.info('🚀 Starting Device Integration Service...');

    // Step 1: Validate environment configuration
    logger.info('Validating environment configuration...');
    validateConfig();

    // Step 2: Initialize database
    logger.info('Connecting to database...');
    await initializeDatabase();

    // Step 3: Initialize Redis
    logger.info('Connecting to Redis...');
    await initializeRedis();

    // Step 4: Initialize routes (after database is ready)
    logger.info('Initializing API routes...');
    deviceRoutes = initializeDeviceRoutes();
    vitalSignsRoutes = initializeVitalSignsRoutes();

    app.use('/api/v1/devices', deviceRoutes);
    app.use('/api/v1/vital-signs', vitalSignsRoutes);

    // Step 5: Start HTTP server
    server.listen(config.PORT, () => {
      logger.info('='.repeat(60));
      logger.info(`✅ Device Integration Service is running`);
      logger.info(`📍 Port: ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📚 API Documentation: http://localhost:${config.PORT}/api-docs`);
      logger.info(`🔌 WebSocket Server: ws://localhost:${config.PORT}`);
      logger.info(`❤️  Health Check: http://localhost:${config.PORT}/health`);
      logger.info('='.repeat(60));
    });

  } catch (error: any) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Graceful Shutdown Handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await closeDatabase();
      await closeRedis();
      logger.info('All connections closed');
      process.exit(0);
    } catch (error: any) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Signal Handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Uncaught Exception Handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start the server
startServer();

export { app, server, io };

