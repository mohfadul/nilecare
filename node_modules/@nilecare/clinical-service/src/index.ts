import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { requestIdMiddleware, errorHandlerMiddleware } from '@nilecare/response-wrapper';
import { logger } from './utils/logger';
import { connectDatabase } from '../../shared/database/connection';
import { authenticate } from '../../shared/middleware/auth';

// Import routes
import patientsRoutes from './routes/patients';
import encountersRoutes from './routes/encounters';
import medicationsRoutes from './routes/medications';
import diagnosticsRoutes from './routes/diagnostics';
import fhirRoutes from './routes/fhir';
import statsRoutes from './routes/stats';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 7001;
const SERVICE_NAME = 'clinical-service';

// ============================================
// MIDDLEWARE SETUP
// ============================================

// ✅ Request ID Middleware (FIRST - for tracing)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Clinical Service API',
      version: '1.0.0',
      description: 'Clinical domain microservice for patient and encounter management',
      contact: {
        name: 'NileCare Team',
        email: 'dev@nilecare.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: process.env.API_BASE_URL || 'http://localhost:7000',
        description: 'Production server',
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
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connectivity
    // await db.query('SELECT 1');
    
    res.status(200).json({
      success: true,
      service: SERVICE_NAME,
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      service: SERVICE_NAME,
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// API ROUTES
// ============================================

// Public routes
app.use('/api/v1/fhir', fhirRoutes);

// Protected routes (require authentication)
app.use('/api/v1/patients', authenticate, patientsRoutes);
app.use('/api/v1/encounters', authenticate, encountersRoutes);
app.use('/api/v1/medications', authenticate, medicationsRoutes);
app.use('/api/v1/diagnostics', authenticate, diagnosticsRoutes);
app.use('/api/v1/stats', authenticate, statsRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ============================================
// ERROR HANDLER (MUST BE LAST)
// ============================================

app.use(errorHandlerMiddleware({ service: SERVICE_NAME }));

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         🏥  NILECARE CLINICAL SERVICE                      ║
║                                                            ║
║  Status:           RUNNING                                 ║
║  Port:             ${PORT.toString().padEnd(42)}║
║  Environment:      ${(process.env.NODE_ENV || 'development').padEnd(42)}║
║  Documentation:    http://localhost:${PORT}/api/docs${(' '.repeat(Math.max(0, 18 - PORT.toString().length)))}║
║                                                            ║
║  ✨ Response Wrapper:  ENABLED (Request ID tracking)      ║
║  🔐 Authentication:    Auth Service (Port 7020)           ║
║  📊 Stats Endpoints:   /api/v1/stats                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      // Add cleanup logic here
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      // Add cleanup logic here
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;

