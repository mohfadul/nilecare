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
import facilityRoutes from './routes/facilities';
import departmentRoutes from './routes/departments';
import wardRoutes from './routes/wards';
import bedRoutes from './routes/beds';
import settingsRoutes from './routes/settings';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { FacilityService } from './services/FacilityService';
import { NotificationService } from './services/NotificationService';
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

const PORT = process.env.PORT || 5001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Facility Service API',
      version: '1.0.0',
      description: 'Multi-tenant facility management service for healthcare organizations',
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
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'facility-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/facilities', authMiddleware, facilityRoutes);
app.use('/api/v1/departments', authMiddleware, departmentRoutes);
app.use('/api/v1/wards', authMiddleware, wardRoutes);
app.use('/api/v1/beds', authMiddleware, bedRoutes);
app.use('/api/v1/settings', authMiddleware, settingsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join facility-specific room
  socket.on('join-facility', (facilityId: string) => {
    socket.join(`facility-${facilityId}`);
    console.log(`Client ${socket.id} joined facility ${facilityId}`);
  });

  // Handle bed status updates
  socket.on('bed-status-update', async (data: any) => {
    try {
      const { facilityId, bedId, status } = data;
      
      // Update bed status in database
      const facilityService = new FacilityService();
      await facilityService.updateBedStatus(bedId, status);
      
      // Broadcast update to facility room
      io.to(`facility-${facilityId}`).emit('bed-status-changed', {
        bedId,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating bed status:', error);
      socket.emit('error', { message: 'Failed to update bed status' });
    }
  });

  // Handle department updates
  socket.on('department-update', async (data: any) => {
    try {
      const { facilityId, departmentId, updates } = data;
      
      // Update department in database
      const facilityService = new FacilityService();
      await facilityService.updateDepartment(departmentId, updates);
      
      // Broadcast update to facility room
      io.to(`facility-${facilityId}`).emit('department-updated', {
        departmentId,
        updates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating department:', error);
      socket.emit('error', { message: 'Failed to update department' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🏥 Facility Service running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
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
