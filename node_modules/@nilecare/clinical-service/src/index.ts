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
import { Pool } from 'pg';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Routes
import patientRoutes from './routes/patients';
import encounterRoutes from './routes/encounters';
import medicationRoutes from './routes/medications';
import diagnosticRoutes from './routes/diagnostics';
import fhirRoutes from './routes/fhir';

// Event handlers
import { setupEventHandlers } from './events/handlers';

// Load environment variables first
dotenv.config();

// ============================================================================
// ENVIRONMENT VALIDATION (Fail fast if misconfigured)
// ============================================================================

const REQUIRED_ENV_VARS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('❌ Missing required environment variables:', missing);
    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║   ENVIRONMENT VALIDATION FAILED                   ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    missing.forEach(v => console.error(`❌ Missing: ${v}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  logger.info('✅ Environment variables validated');
}

// Validate before proceeding
validateEnvironment();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.PORT || '3004');
let appInitialized = false;
const serviceStartTime = Date.now();

// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

dbPool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Clinical API',
      version: '1.0.0',
      description: 'Clinical domain microservices for healthcare management',
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
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

// Liveness probe - Is the service running?
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'clinical-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    features: {
      patients: true,
      encounters: true,
      medications: true,
      diagnostics: true,
      fhir: true,
      realtime: true,
    },
  });
});

// Readiness probe - Is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    const dbStart = Date.now();
    await dbPool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    const health = {
      status: 'ready',
      checks: {
        database: {
          healthy: true,
          latency: dbLatency,
        },
      },
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    };
    
    res.status(200).json(health);
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: {
          healthy: false,
          error: error.message,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe - Has the service finished initialization?
app.get('/health/startup', (req, res) => {
  if (appInitialized) {
    res.status(200).json({
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
    });
  } else {
    res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  const poolStats = {
    totalCount: dbPool.totalCount || 0,
    idleCount: dbPool.idleCount || 0,
    waitingCount: dbPool.waitingCount || 0,
  };
  
  const utilization = poolStats.totalCount > 0
    ? ((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100
    : 0;
  
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# Clinical Service Metrics
clinical_service_uptime_seconds ${Math.floor((Date.now() - serviceStartTime) / 1000)}

# Database Connection Pool
db_pool_total_connections ${poolStats.totalCount}
db_pool_idle_connections ${poolStats.idleCount}
db_pool_waiting_requests ${poolStats.waitingCount}
db_pool_utilization_percent ${utilization.toFixed(2)}
  `.trim());
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/patients', authMiddleware, patientRoutes);
app.use('/api/v1/encounters', authMiddleware, encounterRoutes);
app.use('/api/v1/medications', authMiddleware, medicationRoutes);
app.use('/api/v1/diagnostics', authMiddleware, diagnosticRoutes);
app.use('/api/v1/fhir', authMiddleware, fhirRoutes);

// Socket.IO for real-time updates
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-patient-room', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    logger.info(`Socket ${socket.id} joined patient room: ${patientId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
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
setupEventHandlers(io);

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

async function initializeService(): Promise<void> {
  try {
    logger.info('🚀 Initializing clinical service...');
    
    // Test database connection
    logger.info('📊 Testing database connection...');
    await dbPool.query('SELECT 1');
    logger.info('✅ Database connected');
    
    // Mark as initialized
    appInitialized = true;
    logger.info('✅ Service initialization complete');
    
  } catch (error: any) {
    logger.error('❌ Service initialization failed:', error.message);
    throw error;
  }
}

// Cleanup function for graceful shutdown
async function cleanup(): Promise<void> {
  logger.info('🧹 Cleaning up resources...');
  
  try {
    // Close database pool
    await dbPool.end();
    logger.info('✅ Database pool closed');
    
    // Close Socket.IO
    io.close(() => {
      logger.info('✅ Socket.IO closed');
    });
  } catch (error: any) {
    logger.error('⚠️  Cleanup error:', error.message);
  }
}

// Graceful shutdown handlers
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await cleanup();
    logger.info('Clinical service shut down successfully');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================================================
// START SERVICE
// ============================================================================

(async () => {
  try {
    // Initialize service with dependency checks
    await initializeService();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info('╔═══════════════════════════════════════════════════╗');
      logger.info('║   CLINICAL SERVICE STARTED                        ║');
      logger.info('╚═══════════════════════════════════════════════════╝');
      logger.info(`✅ Service: clinical-service`);
      logger.info(`✅ Version: 1.0.0`);
      logger.info(`✅ Port: ${PORT}`);
      logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✅ Started at: ${new Date().toISOString()}`);
      logger.info(`✅ Health (liveness): http://localhost:${PORT}/health`);
      logger.info(`✅ Health (readiness): http://localhost:${PORT}/health/ready`);
      logger.info(`✅ Health (startup): http://localhost:${PORT}/health/startup`);
      logger.info(`✅ Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`✅ API Docs: http://localhost:${PORT}/api-docs`);
      logger.info('═══════════════════════════════════════════════════');
    });
  } catch (error: any) {
    logger.error('❌ Failed to start clinical service:', error.message);
    process.exit(1);
  }
})();

export { app, server, io };
