import { Pool } from 'pg';

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
import drugInteractionRoutes from './routes/drug-interactions';
import allergyAlertRoutes from './routes/allergy-alerts';
import doseValidationRoutes from './routes/dose-validation';
import clinicalGuidelinesRoutes from './routes/clinical-guidelines';
import contraindicationRoutes from './routes/contraindications';
import alertRoutes from './routes/alerts';

// Services
import { DrugInteractionService } from './services/DrugInteractionService';
import { AllergyService } from './services/AllergyService';
import { DoseValidationService } from './services/DoseValidationService';
import { ClinicalGuidelinesService } from './services/ClinicalGuidelinesService';
import { ContraindicationService } from './services/ContraindicationService';
import { AlertService } from './services/AlertService';

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

const PORT = process.env.PORT || 4002;

// Initialize services
const drugInteractionService = new DrugInteractionService();
const allergyService = new AllergyService();
const doseValidationService = new DoseValidationService();
const clinicalGuidelinesService = new ClinicalGuidelinesService();
const contraindicationService = new ContraindicationService();
const alertService = new AlertService();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Clinical Decision Support API',
      version: '1.0.0',
      description: 'Clinical Decision Support Service - Drug Interactions, Allergy Alerts, Dose Validation, Clinical Guidelines',
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
    service: 'cds-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      drugInteractionChecking: true,
      allergyAlerts: true,
      contraindicationAlerts: true,
      doseRangeValidation: true,
      clinicalGuidelineEngine: true,
      realTimeAlerts: true,
      machineLearning: true,
      nlpProcessing: true
    }
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/drug-interactions', authMiddleware, drugInteractionRoutes);
app.use('/api/v1/allergy-alerts', authMiddleware, allergyAlertRoutes);
app.use('/api/v1/dose-validation', authMiddleware, doseValidationRoutes);
app.use('/api/v1/clinical-guidelines', authMiddleware, clinicalGuidelinesRoutes);
app.use('/api/v1/contraindications', authMiddleware, contraindicationRoutes);
app.use('/api/v1/alerts', authMiddleware, alertRoutes);

// Real-time alert endpoints
app.post('/api/v1/check-medication', authMiddleware, async (req, res) => {
  try {
    const { patientId, medications, allergies, conditions } = req.body;
    
    // Check drug interactions
    const interactions = await drugInteractionService.checkInteractions(medications);
    
    // Check allergy alerts
    const allergyAlerts = await allergyService.checkAllergies(medications, allergies);
    
    // Check contraindications
    const contraindications = await contraindicationService.checkContraindications(medications, conditions);
    
    // Check dose validation
    const doseValidation = await doseValidationService.validateDoses(medications, patientId);
    
    // Get clinical guidelines
    const guidelines = await clinicalGuidelinesService.getGuidelines(medications, conditions);
    
    const result = {
      interactions,
      allergyAlerts,
      contraindications,
      doseValidation,
      guidelines,
      overallRisk: calculateOverallRisk(interactions, allergyAlerts, contraindications, doseValidation)
    };
    
    // Emit real-time alert if high risk
    if (result.overallRisk.level === 'high') {
      io.to(`patient-${patientId}`).emit('clinical-alert', {
        type: 'high-risk-medication',
        severity: 'critical',
        message: 'High-risk medication combination detected',
        details: result,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Medication check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check medication'
    });
  }
});

// Socket.IO for real-time clinical alerts
io.use((socket, next) => {
  // Add authentication for socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
  next();
});

io.on('connection', (socket) => {
  logger.info(`CDS client connected: ${socket.id}`);
  
  socket.on('join-patient-alerts', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    logger.info(`Socket ${socket.id} joined patient alerts room: ${patientId}`);
  });

  socket.on('join-clinical-team', (teamId: string) => {
    socket.join(`clinical-team-${teamId}`);
    logger.info(`Socket ${socket.id} joined clinical team room: ${teamId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`CDS client disconnected: ${socket.id}`);
  });
});

// Helper function to calculate overall risk
function calculateOverallRisk(interactions: any, allergyAlerts: any, contraindications: any, doseValidation: any): any {
  let riskScore = 0;
  let riskLevel = 'low';
  
  // Calculate risk based on different factors
  if (interactions.length > 0) riskScore += interactions.length * 2;
  if (allergyAlerts.length > 0) riskScore += allergyAlerts.length * 3;
  if (contraindications.length > 0) riskScore += contraindications.length * 4;
  if (doseValidation.hasErrors) riskScore += 2;
  
  if (riskScore >= 10) riskLevel = 'high';
  else if (riskScore >= 5) riskLevel = 'medium';
  
  return {
    score: riskScore,
    level: riskLevel,
    factors: {
      interactions: interactions.length,
      allergies: allergyAlerts.length,
      contraindications: contraindications.length,
      doseIssues: doseValidation.hasErrors ? 1 : 0
    }
  };
}

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
setupEventHandlers(io, alertService);

// Start server
server.listen(PORT, () => {
  logger.info(`Clinical Decision Support service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Features enabled: Drug Interactions, Allergy Alerts, Dose Validation, Clinical Guidelines`);
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
