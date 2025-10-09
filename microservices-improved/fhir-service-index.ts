import { Pool } from 'pg';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';

// Import routes
import patientRoutes from './routes/patients';
import observationRoutes from './routes/observations';
import conditionRoutes from './routes/conditions';
import medicationRoutes from './routes/medications';
import encounterRoutes from './routes/encounters';
import bulkDataRoutes from './routes/bulk-data';
import smartRoutes from './routes/smart';
import capabilityRoutes from './routes/capability';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { fhirValidator } from './middleware/fhirValidator';

// Import services
import { FHIRService } from './services/FHIRService';
import { ResourceService } from './services/ResourceService';
import { BulkDataService } from './services/BulkDataService';
import { SMARTService } from './services/SMARTService';
import { EventService } from './services/EventService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 6001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher limit for FHIR API
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Content-Location', 'ETag', 'Last-Modified']
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '50mb' })); // Larger limit for FHIR bundles
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare FHIR Service API',
      version: '1.0.0',
      description: 'HL7 FHIR R4 compliant interoperability service',
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
        smartAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/oauth2/authorize',
              tokenUrl: '/oauth2/token',
              scopes: {
                'patient/*.read': 'Read patient resources',
                'patient/*.write': 'Write patient resources',
                'user/*.read': 'Read user resources',
                'user/*.write': 'Write user resources',
                'system/*.read': 'Read system resources',
                'system/*.write': 'Write system resources'
              }
            }
          }
        }
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// FHIR Capability Statement (Metadata)
app.get('/fhir/metadata', capabilityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'fhir-service',
    fhirVersion: 'R4',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// FHIR R4 API routes
app.use('/fhir/Patient', authMiddleware, fhirValidator, patientRoutes);
app.use('/fhir/Observation', authMiddleware, fhirValidator, observationRoutes);
app.use('/fhir/Condition', authMiddleware, fhirValidator, conditionRoutes);
app.use('/fhir/MedicationRequest', authMiddleware, fhirValidator, medicationRoutes);
app.use('/fhir/Encounter', authMiddleware, fhirValidator, encounterRoutes);

// FHIR Bulk Data Export API ($export)
app.use('/fhir/$export', authMiddleware, bulkDataRoutes);
app.use('/fhir/Group/:id/$export', authMiddleware, bulkDataRoutes);
app.use('/fhir/Patient/$export', authMiddleware, bulkDataRoutes);

// SMART on FHIR endpoints
app.use('/oauth2', smartRoutes);
app.use('/.well-known/smart-configuration', smartRoutes);

// WebSocket connection handling for real-time FHIR updates
io.on('connection', (socket) => {
  console.log(`FHIR Client connected: ${socket.id}`);

  // Subscribe to FHIR resource updates
  socket.on('subscribe', (data: any) => {
    const { resourceType, resourceId } = data;
    const room = resourceId ? `${resourceType}/${resourceId}` : resourceType;
    socket.join(room);
    console.log(`Client ${socket.id} subscribed to ${room}`);
  });

  // Unsubscribe from FHIR resource updates
  socket.on('unsubscribe', (data: any) => {
    const { resourceType, resourceId } = data;
    const room = resourceId ? `${resourceType}/${resourceId}` : resourceType;
    socket.leave(room);
    console.log(`Client ${socket.id} unsubscribed from ${room}`);
  });

  // Handle FHIR resource creation
  socket.on('create-resource', async (data: any) => {
    try {
      const { resourceType, resource } = data;
      
      const fhirService = new FHIRService();
      const created = await fhirService.createResource(resourceType, resource);
      
      // Broadcast to subscribers
      io.to(resourceType).emit('resource-created', {
        resourceType,
        resource: created,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('resource-created', created);
    } catch (error) {
      console.error('Error creating FHIR resource:', error);
      socket.emit('error', { message: 'Failed to create resource' });
    }
  });

  // Handle FHIR resource updates
  socket.on('update-resource', async (data: any) => {
    try {
      const { resourceType, resourceId, resource } = data;
      
      const fhirService = new FHIRService();
      const updated = await fhirService.updateResource(resourceType, resourceId, resource);
      
      // Broadcast to subscribers
      io.to(`${resourceType}/${resourceId}`).emit('resource-updated', {
        resourceType,
        resourceId,
        resource: updated,
        timestamp: new Date().toISOString()
      });
      
      socket.emit('resource-updated', updated);
    } catch (error) {
      console.error('Error updating FHIR resource:', error);
      socket.emit('error', { message: 'Failed to update resource' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`FHIR Client disconnected: ${socket.id}`);
  });
});

// FHIR Bundle endpoint for batch/transaction operations
app.post('/fhir', authMiddleware, async (req, res, next) => {
  try {
    const bundle = req.body;
    
    if (bundle.resourceType !== 'Bundle') {
      return res.status(400).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          diagnostics: 'Resource type must be Bundle'
        }]
      });
    }

    const fhirService = new FHIRService();
    const result = await fhirService.processBundle(bundle);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'error',
      code: 'not-found',
      diagnostics: `Route not found: ${req.originalUrl}`
    }]
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🔗 FHIR Service running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`🏥 FHIR R4 endpoint: http://localhost:${PORT}/fhir`);
  console.log(`📋 Capability Statement: http://localhost:${PORT}/fhir/metadata`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export { app, server, io };
