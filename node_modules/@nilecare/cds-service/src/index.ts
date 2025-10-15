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
import { rateLimiter, safetyCheckLimiter } from './middleware/rateLimiter';
import { validateRequest, schemas } from './middleware/validation';
// ✅ MIGRATED: Using shared authentication middleware (centralized auth)
import { authenticate as authMiddleware } from '../../shared/middleware/auth';
import { initializeDatabases, closeDatabases, healthCheck as dbHealthCheck } from './utils/database';

// Routes
import drugInteractionRoutes from './routes/drug-interactions';
import allergyAlertRoutes from './routes/allergy-alerts';
import doseValidationRoutes from './routes/dose-validation';
import clinicalGuidelinesRoutes from './routes/clinical-guidelines';
import contraindicationRoutes from './routes/contraindications';
import alertRoutes from './routes/alerts';

// Services
import DrugInteractionService from './services/DrugInteractionService';
import AllergyService from './services/AllergyService';
import DoseValidationService from './services/DoseValidationService';
import ClinicalGuidelinesService from './services/ClinicalGuidelinesService';
import ContraindicationService from './services/ContraindicationService';
import AlertService from './services/AlertService';

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
app.use('/api/v1/drug-interactions', authMiddleware, drugInteractionRoutes);
app.use('/api/v1/allergy-alerts', authMiddleware, allergyAlertRoutes);
app.use('/api/v1/dose-validation', authMiddleware, doseValidationRoutes);
app.use('/api/v1/clinical-guidelines', authMiddleware, clinicalGuidelinesRoutes);
app.use('/api/v1/contraindications', authMiddleware, contraindicationRoutes);
app.use('/api/v1/alerts', authMiddleware, alertRoutes);

// ==================================================================
// COMPREHENSIVE MEDICATION SAFETY CHECK ENDPOINT
// ==================================================================
/**
 * @swagger
 * /api/v1/check-medication:
 *   post:
 *     summary: Comprehensive medication safety check
 *     description: Performs all safety checks (interactions, allergies, dose, contraindications, guidelines)
 *     tags: [Safety Checks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - medications
 *             properties:
 *               patientId:
 *                 type: string
 *               medications:
 *                 type: array
 *               allergies:
 *                 type: array
 *               conditions:
 *                 type: array
 *               patientAge:
 *                 type: number
 *               patientWeight:
 *                 type: number
 *               renalFunction:
 *                 type: number
 *               hepaticFunction:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complete safety assessment
 */
app.post(
  '/api/v1/check-medication', 
  authMiddleware, 
  safetyCheckLimiter,
  validateRequest({ body: schemas.medicationSafetyCheck }),
  async (req, res) => {
    try {
      const { 
        patientId, 
        medications, 
        allergies = [], 
        conditions = [],
        patientAge,
        patientWeight,
        renalFunction,
        hepaticFunction
      } = req.body;

      const userId = (req as any).user?.userId || 'system';
      const facilityId = (req as any).user?.facilityId;
      const organizationId = (req as any).user?.organizationId;

      logger.info(`Comprehensive safety check for patient ${patientId} with ${medications.length} medications`);

      // Run all safety checks in parallel
      const [
        interactions,
        allergyAlerts,
        contraindications,
        doseValidation,
        guidelines
      ] = await Promise.all([
        drugInteractionService.checkInteractions(medications),
        allergyService.checkAllergies(medications, allergies),
        contraindicationService.checkContraindications(medications, conditions),
        doseValidationService.validateDoses(medications, {
          patientId,
          age: patientAge,
          weight: patientWeight,
          renalFunction,
          hepaticFunction
        }),
        clinicalGuidelinesService.getGuidelines(medications, conditions)
      ]);

      // Calculate overall risk
      const overallRisk = calculateOverallRisk(
        interactions,
        allergyAlerts,
        contraindications,
        doseValidation
      );

      const result = {
        interactions,
        allergyAlerts,
        contraindications,
        doseValidation,
        guidelines,
        overallRisk
      };

      // Create alert if high risk
      if (overallRisk.level === 'high') {
        await alertService.createAlert({
          patientId,
          facilityId,
          organizationId,
          alertType: 'drug-interaction',
          severity: 'critical',
          priority: 'high',
          message: 'High-risk medication combination detected',
          clinicalContext: {
            medications: medications.map((m: any) => m.name),
            allergies,
            conditions: conditions.map((c: any) => c.name),
            findings: result
          },
          riskScore: overallRisk.score,
          riskLevel: overallRisk.level,
          recommendations: [
            ...interactions.interactions.map((i: any) => i.recommendation),
            ...allergyAlerts.alerts.map((a: any) => a.recommendation),
            ...contraindications.contraindications.map((c: any) => c.recommendation)
          ].filter((r, i, arr) => arr.indexOf(r) === i), // Remove duplicates
          triggeredBy: userId
        });
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Medication check error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to complete medication safety check',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        timestamp: new Date().toISOString()
      });
    }
  }
);

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

/**
 * Calculate overall risk score
 * 
 * Risk Scoring Algorithm (per documentation):
 * - Drug Interactions: × 2 per interaction
 * - Allergy Alerts: × 3 per allergy
 * - Contraindications: × 4 per contraindication
 * - Dose Errors: + 2 if errors exist
 * 
 * Risk Levels:
 * - Low: < 5
 * - Medium: 5-9
 * - High: ≥ 10
 */
function calculateOverallRisk(
  interactions: any,
  allergyAlerts: any,
  contraindications: any,
  doseValidation: any
): {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: {
    interactions: number;
    allergies: number;
    contraindications: number;
    doseIssues: number;
  };
  blocksAdministration: boolean;
} {
  let riskScore = 0;
  
  // Calculate risk based on different factors (per documentation)
  const interactionCount = interactions.interactions?.length || 0;
  const allergyCount = allergyAlerts.alerts?.length || 0;
  const contraindicationCount = contraindications.contraindications?.length || 0;
  const doseErrors = doseValidation.hasErrors ? 1 : 0;

  riskScore += interactionCount * 2;
  riskScore += allergyCount * 3;
  riskScore += contraindicationCount * 4;
  riskScore += doseErrors * 2;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore >= 10) {
    riskLevel = 'high';
  } else if (riskScore >= 5) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Check if any check blocks administration
  const blocksAdministration = 
    allergyAlerts.blocksAdministration ||
    contraindications.blocksAdministration ||
    interactions.highestSeverity === 'critical';

  return {
    score: riskScore,
    level: riskLevel,
    factors: {
      interactions: interactionCount,
      allergies: allergyCount,
      contraindications: contraindicationCount,
      doseIssues: doseErrors
    },
    blocksAdministration
  };
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

// Setup event handlers
setupEventHandlers(io, alertService);

// ==================================================================
// SERVICE INITIALIZATION
// ==================================================================

async function initializeService(): Promise<void> {
  try {
    logger.info('🚀 Initializing CDS Service...');
    
    // Test database connections
    logger.info('📊 Connecting to databases...');
    const dbStatus = await initializeDatabases();
    
    if (!dbStatus.postgresql) {
      logger.warn('⚠️  PostgreSQL not connected - some features may not work');
    }
    if (!dbStatus.mongodb) {
      logger.warn('⚠️  MongoDB not connected - guideline features may be limited');
    }
    if (!dbStatus.redis) {
      logger.warn('⚠️  Redis not connected - caching disabled');
    }
    
    // Mark as initialized
    appInitialized = true;
    logger.info('✅ CDS Service initialization complete');
    
  } catch (error: any) {
    logger.error('❌ CDS Service initialization failed:', error.message);
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
      logger.info('║   CLINICAL DECISION SUPPORT SERVICE STARTED       ║');
      logger.info('╚═══════════════════════════════════════════════════╝');
      logger.info(`✅ Service: cds-service`);
      logger.info(`✅ Version: 1.0.0`);
      logger.info(`✅ Port: ${PORT}`);
      logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✅ Started at: ${new Date().toISOString()}`);
      logger.info(`✅ Health: http://localhost:${PORT}/health`);
      logger.info(`✅ API Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`✅ Comprehensive Check: POST /api/v1/check-medication`);
      logger.info('═══════════════════════════════════════════════════');
      logger.info('Features: Drug Interactions | Allergy Alerts | Dose Validation | Contraindications | Guidelines');
    });
  } catch (error: any) {
    logger.error('❌ Failed to start CDS service:', error.message);
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
    
    logger.info('✅ CDS service shut down successfully');
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
