import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import net from 'net';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';

// Import routes
import adtRoutes from './routes/adt';
import ormRoutes from './routes/orm';
import oruRoutes from './routes/oru';
import messageRoutes from './routes/messages';
import mllpRoutes from './routes/mllp';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { HL7Service } from './services/HL7Service';
import { MLLPService } from './services/MLLPService';
import { ADTService } from './services/ADTService';
import { ORMService } from './services/ORMService';
import { ORUService } from './services/ORUService';
import { MessageProcessorService } from './services/MessageProcessorService';
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

const PORT = process.env.PORT || 6002;
const MLLP_PORT = process.env.MLLP_PORT || 2575;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500,
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
app.use(express.text({ type: 'application/hl7-v2' })); // HL7 message support

// Request logging
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare HL7 v2.x Service API',
      version: '1.0.0',
      description: 'HL7 v2.x message processing and MLLP protocol service',
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
    service: 'hl7-service',
    hl7Version: '2.5.1',
    mllpPort: MLLP_PORT,
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
app.use('/api/v1/hl7/adt', authMiddleware, adtRoutes);
app.use('/api/v1/hl7/orm', authMiddleware, ormRoutes);
app.use('/api/v1/hl7/oru', authMiddleware, oruRoutes);
app.use('/api/v1/hl7/messages', authMiddleware, messageRoutes);
app.use('/api/v1/hl7/mllp', authMiddleware, mllpRoutes);

// MLLP Server for HL7 v2.x messages
const mllpServer = net.createServer((socket) => {
  console.log(`MLLP client connected from ${socket.remoteAddress}:${socket.remotePort}`);

  let buffer = '';

  socket.on('data', async (data) => {
    try {
      buffer += data.toString();

      // MLLP frame markers: VT (0x0B) start, FS (0x1C) end, CR (0x0D) final
      const startByte = String.fromCharCode(0x0B);
      const endByte = String.fromCharCode(0x1C);
      const carriageReturn = String.fromCharCode(0x0D);

      // Check if we have a complete message
      if (buffer.includes(startByte) && buffer.includes(endByte + carriageReturn)) {
        const startIndex = buffer.indexOf(startByte);
        const endIndex = buffer.indexOf(endByte + carriageReturn);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          // Extract the HL7 message
          const hl7Message = buffer.substring(startIndex + 1, endIndex);
          
          // Clear the processed message from buffer
          buffer = buffer.substring(endIndex + 2);

          console.log('Received HL7 message via MLLP');

          // Process the HL7 message
          const mllpService = new MLLPService();
          const result = await mllpService.processMessage(hl7Message);

          // Broadcast to WebSocket clients
          io.emit('hl7-message-received', {
            message: result,
            timestamp: new Date().toISOString()
          });

          // Send ACK response
          const ack = mllpService.generateACK(hl7Message, result.success ? 'AA' : 'AE');
          const mllpResponse = startByte + ack + endByte + carriageReturn;
          socket.write(mllpResponse);

          console.log(`Sent ACK response: ${result.success ? 'AA' : 'AE'}`);
        }
      }
    } catch (error) {
      console.error('Error processing MLLP message:', error);
      
      // Send error ACK
      const mllpService = new MLLPService();
      const errorAck = mllpService.generateACK('', 'AR');
      const startByte = String.fromCharCode(0x0B);
      const endByte = String.fromCharCode(0x1C);
      const carriageReturn = String.fromCharCode(0x0D);
      const mllpResponse = startByte + errorAck + endByte + carriageReturn;
      socket.write(mllpResponse);
    }
  });

  socket.on('error', (error) => {
    console.error('MLLP socket error:', error);
  });

  socket.on('close', () => {
    console.log(`MLLP client disconnected from ${socket.remoteAddress}:${socket.remotePort}`);
  });
});

// Start MLLP server
mllpServer.listen(MLLP_PORT, () => {
  console.log(`🔌 MLLP Server listening on port ${MLLP_PORT}`);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Send HL7 message via MLLP
  socket.on('send-hl7-message', async (data: any) => {
    try {
      const { message, host, port } = data;
      
      const mllpService = new MLLPService();
      const response = await mllpService.sendMessage(message, host, port);
      
      socket.emit('hl7-message-sent', response);
    } catch (error) {
      console.error('Error sending HL7 message:', error);
      socket.emit('error', { message: 'Failed to send HL7 message' });
    }
  });

  // Parse HL7 message
  socket.on('parse-hl7-message', async (data: any) => {
    try {
      const { message } = data;
      
      const hl7Service = new HL7Service();
      const parsed = await hl7Service.parseMessage(message);
      
      socket.emit('hl7-message-parsed', parsed);
    } catch (error) {
      console.error('Error parsing HL7 message:', error);
      socket.emit('error', { message: 'Failed to parse HL7 message' });
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

// Start HTTP server
server.listen(PORT, () => {
  console.log(`🏥 HL7 Service running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`📡 MLLP Server running on port ${MLLP_PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mllpServer.close(() => {
    console.log('MLLP server closed');
  });
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mllpServer.close(() => {
    console.log('MLLP server closed');
  });
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export { app, server, io, mllpServer };
