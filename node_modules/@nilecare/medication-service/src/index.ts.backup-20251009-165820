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
import marRoutes from './routes/mar';
import barcodeRoutes from './routes/barcode-verification';
import reconciliationRoutes from './routes/reconciliation';
import highAlertRoutes from './routes/high-alert-monitoring';
import medicationRoutes from './routes/medications';
import administrationRoutes from './routes/administration';

// Services
import { MARService } from './services/MARService';
import { BarcodeService } from './services/BarcodeService';
import { ReconciliationService } from './services/ReconciliationService';
import { HighAlertService } from './services/HighAlertService';
import { MedicationService } from './services/MedicationService';
import { AdministrationService } from './services/AdministrationService';

// Event handlers
import { setupEventHandlers } from './events/handlers';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4003;

// Initialize services
const marService = new MARService();
const barcodeService = new BarcodeService();
const reconciliationService = new ReconciliationService();
const highAlertService = new HighAlertService();
const medicationService = new MedicationService();
const administrationService = new AdministrationService();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Medication Service API',
      version: '1.0.0',
      description: 'Medication Service - MAR, Barcode Verification, Medication Reconciliation, High-Alert Monitoring',
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
    service: 'medication-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      medicationAdministrationRecord: true,
      barcodeVerification: true,
      medicationReconciliation: true,
      highAlertMonitoring: true,
      medicationTracking: true,
      dosageValidation: true,
      adverseEventReporting: true,
      inventoryManagement: true
    }
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/mar', authMiddleware, marRoutes);
app.use('/api/v1/barcode-verification', authMiddleware, barcodeRoutes);
app.use('/api/v1/reconciliation', authMiddleware, reconciliationRoutes);
app.use('/api/v1/high-alert-monitoring', authMiddleware, highAlertRoutes);
app.use('/api/v1/medications', authMiddleware, medicationRoutes);
app.use('/api/v1/administration', authMiddleware, administrationRoutes);

// Real-time medication administration endpoint
app.post('/api/v1/medication-administration', authMiddleware, async (req, res) => {
  try {
    const { patientId, medicationId, dosage, route, administeredBy, barcodeData, timestamp } = req.body;
    
    // Verify barcode
    const barcodeVerification = await barcodeService.verifyMedicationBarcode(barcodeData, medicationId);
    
    if (!barcodeVerification.verified) {
      return res.status(400).json({
        success: false,
        error: 'Barcode verification failed',
        details: barcodeVerification.errors
      });
    }
    
    // Check for high-alert medications
    const highAlertCheck = await highAlertService.checkHighAlertMedication(medicationId, dosage);
    
    // Record administration in MAR
    const marEntry = await marService.recordAdministration({
      patientId,
      medicationId,
      dosage,
      route,
      administeredBy,
      timestamp: timestamp || new Date(),
      barcodeVerified: true,
      highAlert: highAlertCheck.isHighAlert,
      verificationData: barcodeVerification
    });
    
    // Emit real-time updates
    io.to(`patient-${patientId}`).emit('medication-administered', {
      patientId,
      medicationId,
      marEntryId: marEntry.id,
      administeredBy,
      timestamp: marEntry.timestamp,
      highAlert: highAlertCheck.isHighAlert
    });
    
    // Emit high-alert notification if needed
    if (highAlertCheck.isHighAlert) {
      io.to('clinical-team').emit('high-alert-medication-administered', {
        patientId,
        medicationId,
        dosage,
        administeredBy,
        timestamp: marEntry.timestamp,
        alertLevel: highAlertCheck.alertLevel
      });
    }
    
    res.json({
      success: true,
      data: {
        marEntry,
        barcodeVerification,
        highAlertCheck
      }
    });
  } catch (error) {
    logger.error('Medication administration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record medication administration'
    });
  }
});

// Socket.IO for real-time medication updates
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`Medication client connected: ${socket.id}`);
  
  socket.on('join-patient-medications', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    logger.info(`Socket ${socket.id} joined patient medications room: ${patientId}`);
  });

  socket.on('join-medication-room', (medicationId: string) => {
    socket.join(`medication-${medicationId}`);
    logger.info(`Socket ${socket.id} joined medication room: ${medicationId}`);
  });

  socket.on('join-clinical-team', () => {
    socket.join('clinical-team');
    logger.info(`Socket ${socket.id} joined clinical team room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Medication client disconnected: ${socket.id}`);
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
setupEventHandlers(io, marService, highAlertService);

// Start server
server.listen(PORT, () => {
  logger.info(`Medication service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Features enabled: MAR, Barcode Verification, Medication Reconciliation, High-Alert Monitoring`);
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
