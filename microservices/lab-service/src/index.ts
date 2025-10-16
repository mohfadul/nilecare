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
// ✅ MIGRATED: Using shared authentication middleware (centralized auth)
import { authenticate as authMiddleware } from '../../shared/middleware/auth';
import { validateRequest } from './middleware/validation';

// Routes
import labOrderRoutes from './routes/lab-orders';
import resultProcessingRoutes from './routes/result-processing';
import criticalValueRoutes from './routes/critical-values';
import qualityControlRoutes from './routes/quality-control';
import specimenRoutes from './routes/specimens';
import instrumentRoutes from './routes/instruments';
import statsRoutes from './routes/stats';

// Services
import { LabOrderService } from './services/LabOrderService';
import { ResultProcessingService } from './services/ResultProcessingService';
import { CriticalValueService } from './services/CriticalValueService';
import { QualityControlService } from './services/QualityControlService';
import { SpecimenService } from './services/SpecimenService';
import { InstrumentService } from './services/InstrumentService';

// Event handlers
import { setupEventHandlers } from './events/handlers';

dotenv.config();

// ✅ NEW: Import response wrapper middleware
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

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

const PORT = process.env.PORT || 4004;

// Initialize services
const labOrderService = new LabOrderService();
const resultProcessingService = new ResultProcessingService();
const criticalValueService = new CriticalValueService();
const qualityControlService = new QualityControlService();
const specimenService = new SpecimenService();
const instrumentService = new InstrumentService();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Laboratory Service API',
      version: '1.0.0',
      description: 'Laboratory Service - Lab Order Management, Result Processing, Critical Value Alerting, Quality Control',
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

// ✅ NEW: Add request ID middleware FIRST
app.use(requestIdMiddleware);

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
    service: 'lab-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      labOrderManagement: true,
      resultProcessing: true,
      criticalValueAlerting: true,
      qualityControlTracking: true,
      specimenManagement: true,
      instrumentIntegration: true,
      hl7Integration: true,
      fhirCompliance: true,
      automatedReporting: true
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
app.use('/api/v1/lab-orders', authMiddleware, labOrderRoutes);
app.use('/api/v1/result-processing', authMiddleware, resultProcessingRoutes);
app.use('/api/v1/critical-values', authMiddleware, criticalValueRoutes);
app.use('/api/v1/quality-control', authMiddleware, qualityControlRoutes);
app.use('/api/v1/specimens', authMiddleware, specimenRoutes);
app.use('/api/v1/instruments', authMiddleware, instrumentRoutes);
app.use('/api/v1/stats', authMiddleware, statsRoutes);

// Real-time lab result processing endpoint
app.post('/api/v1/process-lab-result', authMiddleware, async (req, res) => {
  try {
    const { labOrderId, results, instrumentId, technicianId, timestamp } = req.body;
    
    // Process results
    const processedResults = await resultProcessingService.processResults(results, labOrderId);
    
    // Check for critical values
    const criticalValueCheck = await criticalValueService.checkCriticalValues(processedResults);
    
    // Update lab order with results
    const updatedOrder = await labOrderService.updateOrderWithResults(labOrderId, {
      results: processedResults,
      status: 'completed',
      completedAt: timestamp || new Date(),
      instrumentId,
      technicianId
    });
    
    // Emit real-time updates
    io.to(`lab-order-${labOrderId}`).emit('lab-result-available', {
      labOrderId,
      results: processedResults,
      status: 'completed',
      timestamp: updatedOrder.completedAt
    });
    
    // Emit critical value alert if needed
    if (criticalValueCheck.hasCriticalValues) {
      const patientId = updatedOrder.patientId;
      
      io.to(`patient-${patientId}`).emit('critical-lab-value', {
        patientId,
        labOrderId,
        criticalValues: criticalValueCheck.criticalValues,
        severity: criticalValueCheck.severity,
        timestamp: new Date().toISOString()
      });
      
      // Also alert clinical team
      io.to('clinical-team').emit('critical-lab-value-alert', {
        patientId,
        labOrderId,
        criticalValues: criticalValueCheck.criticalValues,
        severity: criticalValueCheck.severity,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        labOrder: updatedOrder,
        results: processedResults,
        criticalValueCheck
      }
    });
  } catch (error) {
    logger.error('Lab result processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process lab results'
    });
  }
});

// HL7 message processing endpoint
app.post('/api/v1/hl7/message', authMiddleware, async (req, res) => {
  try {
    const { message, messageType } = req.body;
    
    let result;
    switch (messageType) {
      case 'ORU^R01': // Observation Result
        result = await resultProcessingService.processHL7ORUMessage(message);
        break;
      case 'ORM^O01': // Order Message
        result = await labOrderService.processHL7ORMMessage(message);
        break;
      default:
        throw new Error(`Unsupported HL7 message type: ${messageType}`);
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('HL7 message processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process HL7 message'
    });
  }
});

// Socket.IO for real-time lab updates
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Lab client connected: ${socket.id}`);
  
  socket.on('join-lab-order', (labOrderId: string) => {
    socket.join(`lab-order-${labOrderId}`);
    logger.info(`Socket ${socket.id} joined lab order room: ${labOrderId}`);
  });

  socket.on('join-patient-lab', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    logger.info(`Socket ${socket.id} joined patient lab room: ${patientId}`);
  });

  socket.on('join-clinical-team', () => {
    socket.join('clinical-team');
    logger.info(`Socket ${socket.id} joined clinical team room`);
  });

  socket.on('join-lab-technician', (technicianId: string) => {
    socket.join(`technician-${technicianId}`);
    logger.info(`Socket ${socket.id} joined technician room: ${technicianId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Lab client disconnected: ${socket.id}`);
  });
});

// ✅ NEW: Use standardized error handler
app.use(errorHandlerMiddleware({ service: 'lab-service' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Setup event handlers
setupEventHandlers(io, labOrderService, criticalValueService);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Laboratory service running on port ${PORT}`);
  logger.info('✨ Response Wrapper: ENABLED (Request ID tracking active)');
  logger.info(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`💚 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔬 Features enabled: Lab Order Management, Result Processing, Critical Value Alerting, Quality Control`);
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
