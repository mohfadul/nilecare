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

import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { validateRequest } from './middleware/validation';
// ✅ MIGRATED: Using shared authentication middleware (centralized auth)
import { authenticate as authMiddleware } from '../../shared/middleware/auth';
import { initializeDatabases, closeDatabases, healthCheck as dbHealthCheck } from './utils/database';

// Routes
import soapNotesRoutes from './routes/soap-notes';
import problemListRoutes from './routes/problem-list';
import progressNotesRoutes from './routes/progress-notes';
import exportRoutes from './routes/export';

// Event handlers
import { setupEventHandlers } from './events/handlers';

dotenv.config();

// Environment validation
const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║   ENVIRONMENT VALIDATION FAILED                   ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    missing.forEach(v => console.error(`❌ Missing: ${v}`));
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
  logger.info('✅ Environment variables validated');
}
validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare EHR Service API',
      version: '1.0.0',
      description: 'Electronic Health Records Service - Clinical Documentation, Problem Lists, SOAP Notes, Progress Notes',
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
    service: 'ehr-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    features: {
      soapNotes: true,
      problemList: true,
      progressNotes: true,
      documentExport: true,
      documentVersioning: true,
      amendmentTracking: true,
      clinicalDocumentation: true,
      fhirSupport: true,
      multiDatabaseSupport: true
    }
  });
});

// Readiness probe
app.get('/health/ready', async (req, res) => {
  try {
    // Check all databases
    const health = await dbHealthCheck();
    
    if (health.healthy) {
      res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        databases: health.databases
      });
    } else {
      res.status(503).json({ 
        status: 'not_ready', 
        timestamp: new Date().toISOString(),
        databases: health.databases
      });
    }
  } catch (error: any) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/soap-notes', soapNotesRoutes);
app.use('/api/v1/problem-list', problemListRoutes);
app.use('/api/v1/progress-notes', progressNotesRoutes);
app.use('/api/v1/export', exportRoutes);

// Socket.IO for real-time EHR updates
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`EHR client connected: ${socket.id}`);
  
  socket.on('join-patient-ehr', (patientId: string) => {
    socket.join(`patient-ehr-${patientId}`);
    logger.info(`Socket ${socket.id} joined patient EHR room: ${patientId}`);
  });

  socket.on('join-encounter-ehr', (encounterId: string) => {
    socket.join(`encounter-ehr-${encounterId}`);
    logger.info(`Socket ${socket.id} joined encounter EHR room: ${encounterId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`EHR client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

// Setup event handlers
setupEventHandlers(io);

// ==================================================================
// SERVICE INITIALIZATION
// ==================================================================

async function initializeService(): Promise<void> {
  try {
    logger.info('🚀 Initializing EHR Service...');
    
    // Test database connections
    logger.info('📊 Connecting to databases...');
    const dbStatus = await initializeDatabases();
    
    if (!dbStatus.postgresql) {
      logger.error('❌ PostgreSQL not connected - EHR service requires PostgreSQL');
      throw new Error('PostgreSQL connection required');
    }
    if (!dbStatus.mongodb) {
      logger.warn('⚠️  MongoDB not connected - document storage features may be limited');
    }
    
    // Mark as initialized
    appInitialized = true;
    logger.info('✅ EHR Service initialization complete');
    
  } catch (error: any) {
    logger.error('❌ EHR Service initialization failed:', error.message);
    throw error;
  }
}

// Start server
(async () => {
  try {
    // Initialize service
    await initializeService();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info('╔═══════════════════════════════════════════════════╗');
      logger.info('║   ELECTRONIC HEALTH RECORD SERVICE STARTED        ║');
      logger.info('╚═══════════════════════════════════════════════════╝');
      logger.info(`✅ Service: ehr-service`);
      logger.info(`✅ Version: 1.0.0`);
      logger.info(`✅ Port: ${PORT}`);
      logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✅ Started at: ${new Date().toISOString()}`);
      logger.info(`✅ Health: http://localhost:${PORT}/health`);
      logger.info(`✅ API Docs: http://localhost:${PORT}/api-docs`);
      logger.info('═══════════════════════════════════════════════════');
      logger.info('Features: SOAP Notes | Problem Lists | Progress Notes | Document Export | Versioning');
    });
  } catch (error: any) {
    logger.error('❌ Failed to start EHR service:', error.message);
    process.exit(1);
  }
})();

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    await closeDatabases();
    
    // Close Socket.IO
    io.close(() => {
      logger.info('✅ Socket.IO closed');
    });
    
    logger.info('✅ EHR service shut down successfully');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server, io };
