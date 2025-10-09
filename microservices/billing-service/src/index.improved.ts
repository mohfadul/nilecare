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
import billingRoutes from './routes/billing';
import claimRoutes from './routes/claims';
import paymentRoutes from './routes/payments';
import insuranceRoutes from './routes/insurance';
import reportingRoutes from './routes/reporting';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { BillingService } from './services/BillingService';
import { ClaimService } from './services/ClaimService';
import { PaymentService } from './services/PaymentService';
import { InsuranceService } from './services/InsuranceService';
import { NotificationService } from './services/NotificationService';
import { EventService } from './services/EventService';

// Load environment variables
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
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5003;

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
      title: 'NileCare Billing Service API',
      version: '1.0.0',
      description: 'Billing, insurance claims, and payment processing service',
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
    service: 'billing-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// API routes
app.use('/api/v1/billing', authMiddleware, billingRoutes);
app.use('/api/v1/claims', authMiddleware, claimRoutes);
app.use('/api/v1/payments', authMiddleware, paymentRoutes);
app.use('/api/v1/insurance', authMiddleware, insuranceRoutes);
app.use('/api/v1/reporting', authMiddleware, reportingRoutes);

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

  // Handle claim submission
  socket.on('submit-claim', async (data: any) => {
    try {
      const { patientId, providerId, claimData } = data;
      
      const claimService = new ClaimService();
      const claim = await claimService.submitClaim(claimData);
      
      // Notify relevant parties
      io.to(`user-${patientId}`).emit('claim-submitted', claim);
      io.to(`provider-${providerId}`).emit('claim-submitted', claim);
      
    } catch (error) {
      console.error('Error submitting claim:', error);
      socket.emit('error', { message: 'Failed to submit claim' });
    }
  });

  // Handle payment processing
  socket.on('process-payment', async (data: any) => {
    try {
      const { patientId, paymentData } = data;
      
      const paymentService = new PaymentService();
      const payment = await paymentService.processPayment(paymentData);
      
      // Notify patient
      io.to(`user-${patientId}`).emit('payment-processed', payment);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      socket.emit('error', { message: 'Failed to process payment' });
    }
  });

  // Handle claim status updates
  socket.on('claim-status-update', async (data: any) => {
    try {
      const { claimId, status, details } = data;
      
      const claimService = new ClaimService();
      const claim = await claimService.updateClaimStatus(claimId, status, details);
      
      // Notify relevant parties
      io.to(`user-${claim.patientId}`).emit('claim-status-changed', claim);
      io.to(`provider-${claim.providerId}`).emit('claim-status-changed', claim);
      
    } catch (error) {
      console.error('Error updating claim status:', error);
      socket.emit('error', { message: 'Failed to update claim status' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Scheduled tasks
// Process pending claims every hour
cron.schedule('0 * * * *', async () => {
  console.log('Processing pending claims...');
  try {
    const claimService = new ClaimService();
    await claimService.processPendingClaims();
  } catch (error) {
    console.error('Error processing pending claims:', error);
  }
});

// Send payment reminders daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Sending payment reminders...');
  try {
    const billingService = new BillingService();
    await billingService.sendPaymentReminders();
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
});

// Generate financial reports daily at 11 PM
cron.schedule('0 23 * * *', async () => {
  console.log('Generating financial reports...');
  try {
    const billingService = new BillingService();
    await billingService.generateDailyReports();
  } catch (error) {
    console.error('Error generating financial reports:', error);
  }
});

// Process denial management weekly on Monday at 8 AM
cron.schedule('0 8 * * 1', async () => {
  console.log('Processing denial management...');
  try {
    const claimService = new ClaimService();
    await claimService.processDenialManagement();
  } catch (error) {
    console.error('Error processing denial management:', error);
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
  console.log(`💰 Billing Service running on port ${PORT}`);
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
