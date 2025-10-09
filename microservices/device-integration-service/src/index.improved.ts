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
import mqtt from 'mqtt';

// Import routes
import deviceRoutes from './routes/devices';
import vitalSignsRoutes from './routes/vital-signs';
import monitorRoutes from './routes/monitors';
import alertRoutes from './routes/alerts';
import calibrationRoutes from './routes/calibration';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { DeviceService } from './services/DeviceService';
import { VitalSignsService } from './services/VitalSignsService';
import { MonitorService } from './services/MonitorService';
import { AlertService } from './services/AlertService';
import { SerialPortService } from './services/SerialPortService';
import { ModbusService } from './services/ModbusService';
import { MQTTService } from './services/MQTTService';
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
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 6003;

// MQTT Client for device communication
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', {
  clientId: `device-integration-service-${Math.random().toString(16).slice(3)}`,
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  
  // Subscribe to device topics
  mqttClient.subscribe('devices/+/vitals', (err) => {
    if (!err) {
      console.log('📡 Subscribed to device vital signs topic');
    }
  });
  
  mqttClient.subscribe('devices/+/status', (err) => {
    if (!err) {
      console.log('📡 Subscribed to device status topic');
    }
  });

  mqttClient.subscribe('devices/+/alerts', (err) => {
    if (!err) {
      console.log('📡 Subscribed to device alerts topic');
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    const dataType = topicParts[2];

    console.log(`Received ${dataType} from device ${deviceId}`);

    // Broadcast to WebSocket clients
    io.emit(`device-${dataType}`, {
      deviceId,
      data,
      timestamp: new Date().toISOString()
    });

    // Process based on data type
    switch (dataType) {
      case 'vitals':
        const vitalSignsService = new VitalSignsService();
        await vitalSignsService.processVitalSigns(deviceId, data);
        break;
      
      case 'status':
        const deviceService = new DeviceService();
        await deviceService.updateDeviceStatus(deviceId, data);
        break;
      
      case 'alerts':
        const alertService = new AlertService();
        await alertService.processDeviceAlert(deviceId, data);
        break;
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Higher limit for real-time device data
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
      title: 'NileCare Device Integration Service API',
      version: '1.0.0',
      description: 'Medical device connectivity and vital signs monitoring service',
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
    service: 'device-integration-service',
    mqttConnected: mqttClient.connected,
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
app.use('/api/v1/devices', authMiddleware, deviceRoutes);
app.use('/api/v1/vital-signs', authMiddleware, vitalSignsRoutes);
app.use('/api/v1/monitors', authMiddleware, monitorRoutes);
app.use('/api/v1/alerts', authMiddleware, alertRoutes);
app.use('/api/v1/calibration', authMiddleware, calibrationRoutes);

// WebSocket connection handling for real-time device data
io.on('connection', (socket) => {
  console.log(`Device client connected: ${socket.id}`);

  // Subscribe to specific device
  socket.on('subscribe-device', (deviceId: string) => {
    socket.join(`device-${deviceId}`);
    console.log(`Client ${socket.id} subscribed to device ${deviceId}`);
  });

  // Subscribe to patient's devices
  socket.on('subscribe-patient', (patientId: string) => {
    socket.join(`patient-${patientId}`);
    console.log(`Client ${socket.id} subscribed to patient ${patientId} devices`);
  });

  // Unsubscribe from device
  socket.on('unsubscribe-device', (deviceId: string) => {
    socket.leave(`device-${deviceId}`);
    console.log(`Client ${socket.id} unsubscribed from device ${deviceId}`);
  });

  // Send command to device
  socket.on('device-command', async (data: any) => {
    try {
      const { deviceId, command, parameters } = data;
      
      // Publish command to MQTT
      mqttClient.publish(
        `devices/${deviceId}/commands`,
        JSON.stringify({ command, parameters, timestamp: new Date().toISOString() }),
        { qos: 1 }
      );
      
      socket.emit('command-sent', { deviceId, command, status: 'success' });
    } catch (error) {
      console.error('Error sending device command:', error);
      socket.emit('error', { message: 'Failed to send command to device' });
    }
  });

  // Start vital signs streaming
  socket.on('start-streaming', async (data: any) => {
    try {
      const { deviceId, parameters } = data;
      
      const monitorService = new MonitorService();
      await monitorService.startStreaming(deviceId, parameters);
      
      socket.emit('streaming-started', { deviceId });
    } catch (error) {
      console.error('Error starting streaming:', error);
      socket.emit('error', { message: 'Failed to start streaming' });
    }
  });

  // Stop vital signs streaming
  socket.on('stop-streaming', async (data: any) => {
    try {
      const { deviceId } = data;
      
      const monitorService = new MonitorService();
      await monitorService.stopStreaming(deviceId);
      
      socket.emit('streaming-stopped', { deviceId });
    } catch (error) {
      console.error('Error stopping streaming:', error);
      socket.emit('error', { message: 'Failed to stop streaming' });
    }
  });

  // Request device status
  socket.on('request-device-status', async (deviceId: string) => {
    try {
      const deviceService = new DeviceService();
      const status = await deviceService.getDeviceStatus(deviceId);
      
      socket.emit('device-status', { deviceId, status });
    } catch (error) {
      console.error('Error getting device status:', error);
      socket.emit('error', { message: 'Failed to get device status' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Device client disconnected: ${socket.id}`);
  });
});

// Simulated vital signs data stream for testing (remove in production)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const mockVitalSigns = {
      heartRate: Math.floor(Math.random() * (100 - 60) + 60),
      bloodPressureSystolic: Math.floor(Math.random() * (140 - 90) + 90),
      bloodPressureDiastolic: Math.floor(Math.random() * (90 - 60) + 60),
      oxygenSaturation: Math.floor(Math.random() * (100 - 95) + 95),
      temperature: (Math.random() * (37.5 - 36.0) + 36.0).toFixed(1),
      respiratoryRate: Math.floor(Math.random() * (20 - 12) + 12),
      timestamp: new Date().toISOString()
    };

    io.emit('vital-signs-update', {
      deviceId: 'MOCK-DEVICE-001',
      patientId: 'MOCK-PATIENT-001',
      data: mockVitalSigns
    });
  }, 5000); // Every 5 seconds
}

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
  console.log(`🏥 Device Integration Service running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
  console.log(`📡 MQTT client connected: ${mqttClient.connected}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mqttClient.end(() => {
    console.log('MQTT client disconnected');
  });
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  mqttClient.end(() => {
    console.log('MQTT client disconnected');
  });
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export { app, server, io, mqttClient };
