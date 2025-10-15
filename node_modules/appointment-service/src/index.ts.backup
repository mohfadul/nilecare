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
import cron from 'node-cron';

// Import routes
import appointmentRoutes from './routes/appointments';
import scheduleRoutes from './routes/schedules';
import resourceRoutes from './routes/resources';
import waitlistRoutes from './routes/waitlist';
import reminderRoutes from './routes/reminders';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { AppointmentService } from './services/AppointmentService';
import { ReminderService } from './services/ReminderService';
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

const PORT = process.env.PORT || 5002;

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
      title: 'NileCare Appointment Service API',
      version: '1.0.0',
      description: 'Appointment scheduling and calendar management service',
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
    service: 'appointment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/appointments', authMiddleware, appointmentRoutes);
app.use('/api/v1/schedules', authMiddleware, scheduleRoutes);
app.use('/api/v1/resources', authMiddleware, resourceRoutes);
app.use('/api/v1/waitlist', authMiddleware, waitlistRoutes);
app.use('/api/v1/reminders', authMiddleware, reminderRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join-user', (userId: string) => {
    socket.join(`user-${userId}`);
    console.log(`Client ${socket.id} joined user room ${userId}`);
  });

  // Join provider-specific room
  socket.on('join-provider', (providerId: string) => {
    socket.join(`provider-${providerId}`);
    console.log(`Client ${socket.id} joined provider room ${providerId}`);
  });

  // Handle appointment booking
  socket.on('book-appointment', async (data: any) => {
    try {
      const { patientId, providerId, dateTime, duration, type } = data;
      
      const appointmentService = new AppointmentService();
      const appointment = await appointmentService.bookAppointment({
        patientId,
        providerId,
        dateTime: new Date(dateTime),
        duration,
        type,
        status: 'scheduled'
      });
      
      // Notify patient and provider
      io.to(`user-${patientId}`).emit('appointment-booked', appointment);
      io.to(`provider-${providerId}`).emit('appointment-booked', appointment);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      socket.emit('error', { message: 'Failed to book appointment' });
    }
  });

  // Handle appointment cancellation
  socket.on('cancel-appointment', async (data: any) => {
    try {
      const { appointmentId, reason } = data;
      
      const appointmentService = new AppointmentService();
      const appointment = await appointmentService.cancelAppointment(appointmentId, reason);
      
      // Notify relevant parties
      io.to(`user-${appointment.patientId}`).emit('appointment-cancelled', appointment);
      io.to(`provider-${appointment.providerId}`).emit('appointment-cancelled', appointment);
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      socket.emit('error', { message: 'Failed to cancel appointment' });
    }
  });

  // Handle appointment rescheduling
  socket.on('reschedule-appointment', async (data: any) => {
    try {
      const { appointmentId, newDateTime } = data;
      
      const appointmentService = new AppointmentService();
      const appointment = await appointmentService.rescheduleAppointment(appointmentId, new Date(newDateTime));
      
      // Notify relevant parties
      io.to(`user-${appointment.patientId}`).emit('appointment-rescheduled', appointment);
      io.to(`provider-${appointment.providerId}`).emit('appointment-rescheduled', appointment);
      
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      socket.emit('error', { message: 'Failed to reschedule appointment' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Scheduled tasks
// Run appointment reminders every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running appointment reminders...');
  try {
    const reminderService = new ReminderService();
    await reminderService.sendUpcomingAppointmentReminders();
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
  }
});

// Run waitlist processing every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Processing waitlist...');
  try {
    const appointmentService = new AppointmentService();
    await appointmentService.processWaitlist();
  } catch (error) {
    console.error('Error processing waitlist:', error);
  }
});

// Run cleanup tasks daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily cleanup tasks...');
  try {
    const appointmentService = new AppointmentService();
    await appointmentService.cleanupExpiredAppointments();
  } catch (error) {
    console.error('Error running cleanup tasks:', error);
  }
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
  console.log(`📅 Appointment Service running on port ${PORT}`);
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
