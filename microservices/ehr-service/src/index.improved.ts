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
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Routes
import ehrRoutes from './routes/ehr';
import problemListRoutes from './routes/problem-lists';
import soapNotesRoutes from './routes/soap-notes';
import progressNotesRoutes from './routes/progress-notes';
import clinicalDocumentRoutes from './routes/clinical-documents';
import medicalHistoryRoutes from './routes/medical-history';

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
    features: {
      electronicHealthRecords: true,
      clinicalDocumentation: true,
      problemLists: true,
      soapNotes: true,
      progressNotes: true,
      medicalHistory: true,
      fhirCompliance: true,
      hl7Integration: true
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
app.use('/api/v1/ehr', authMiddleware, ehrRoutes);
app.use('/api/v1/problem-lists', authMiddleware, problemListRoutes);
app.use('/api/v1/soap-notes', authMiddleware, soapNotesRoutes);
app.use('/api/v1/progress-notes', authMiddleware, progressNotesRoutes);
app.use('/api/v1/clinical-documents', authMiddleware, clinicalDocumentRoutes);
app.use('/api/v1/medical-history', authMiddleware, medicalHistoryRoutes);

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
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Setup event handlers
setupEventHandlers(io);

// Start server
server.listen(PORT, () => {
  logger.info(`EHR service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Features enabled: Electronic Health Records, Clinical Documentation, Problem Lists, SOAP Notes, Progress Notes`);
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

export { app, server, io };
