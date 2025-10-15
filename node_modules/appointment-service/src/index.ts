import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// ✅ NEW: Import response wrapper middleware
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

// Import database
import { testConnection, pool } from './config/database';

// Import routes
import appointmentRoutes from './routes/appointments';
import scheduleRoutes from './routes/schedules';
import resourceRoutes from './routes/resources';
import waitlistRoutes from './routes/waitlist';
import reminderRoutes from './routes/reminders';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Import services
import NotificationService from './services/NotificationService';
import ReminderService from './services/ReminderService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:7001',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 7040;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// ✅ NEW: Add request ID middleware FIRST
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:7001',
    ],
    credentials: true,
  })
);
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Initialize Socket.IO with notification service
NotificationService.initialize(io);

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.execute('SELECT 1');
    
    res.json({
      success: true,
      service: 'appointment-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      service: 'appointment-service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness probe
app.get('/health/ready', async (req, res) => {
  try {
    // Check database connection
    await pool.execute('SELECT 1');
    
    res.json({
      success: true,
      ready: true,
      checks: {
        database: 'connected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      ready: false,
      checks: {
        database: 'disconnected',
      },
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe
app.get('/health/startup', async (req, res) => {
  try {
    // Check if service is fully initialized
    await pool.execute('SELECT 1');
    
    res.json({
      success: true,
      started: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      started: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  res.type('text/plain');
  res.send(`
# HELP appointment_service_uptime_seconds Service uptime in seconds
# TYPE appointment_service_uptime_seconds gauge
appointment_service_uptime_seconds ${process.uptime()}

# HELP appointment_service_memory_usage_bytes Memory usage in bytes
# TYPE appointment_service_memory_usage_bytes gauge
appointment_service_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
appointment_service_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
appointment_service_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
appointment_service_memory_usage_bytes{type="external"} ${process.memoryUsage().external}
  `.trim());
});

// Routes
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/waitlist', waitlistRoutes);
app.use('/api/v1/reminders', reminderRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'NileCare Appointment Service',
    version: '1.0.0',
    endpoints: {
      appointments: '/api/v1/appointments',
      schedules: '/api/v1/schedules',
      resources: '/api/v1/resources',
      waitlist: '/api/v1/waitlist',
      reminders: '/api/v1/reminders',
      health: '/health',
    },
  });
});

// ============================================================================
// ERROR HANDLING (MUST BE LAST)
// ============================================================================

// ✅ NEW: Use standardized error handler
app.use(errorHandlerMiddleware({ service: 'appointment-service' }));

// Cron job: Process pending reminders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('⏰ Running scheduled reminder processing...');
    await ReminderService.processPendingReminders();
  } catch (error: any) {
    console.error('Failed to process reminders:', error.message);
  }
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Start listening
    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅  APPOINTMENT SERVICE STARTED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🚀  Server:          http://localhost:${PORT}`);
      console.log('✨  Response Wrapper: ENABLED (Request ID tracking active)');
      console.log(`🏥  Service:         NileCare Appointment Service`);
      console.log(`📡  Socket.IO:       Enabled`);
      console.log(`🗄️   Database:        MySQL (${process.env.DB_NAME})`);
      console.log(`⏰  Cron Jobs:       Enabled (reminder processing)`);
      console.log('');
      console.log('📚  API Endpoints:');
      console.log(`    - GET/POST    /api/v1/appointments`);
      console.log(`    - GET         /api/v1/schedules`);
      console.log(`    - GET         /api/v1/resources`);
      console.log(`    - GET/POST    /api/v1/waitlist`);
      console.log(`    - GET/POST    /api/v1/reminders`);
      console.log(`    - GET         /health`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;

