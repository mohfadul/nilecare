/**
 * Auth Service - Enhanced with @nilecare/response-wrapper
 * 
 * CHANGES FROM ORIGINAL:
 * 1. Added requestIdMiddleware for request tracking
 * 2. Added errorHandlerMiddleware for consistent error responses
 * 3. Request IDs now tracked in all responses
 * 4. Standard error format across all endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import passport from 'passport';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

// ✅ NEW: Import response wrapper middleware
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { setupPassportStrategies } from './config/passport';
import { initializeDatabase } from './config/database';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import sessionRoutes from './routes/sessions';
import mfaRoutes from './routes/mfa';
import oauthRoutes from './routes/oauth';
import integrationRoutes from './routes/integration';

dotenv.config();

// Environment validation (keeping existing logic)
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'MFA_ENCRYPTION_KEY'
];

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredVars = isProduction 
    ? [...REQUIRED_ENV_VARS, 'DB_PASSWORD', 'REDIS_URL'] 
    : REQUIRED_ENV_VARS;
  
  const missing = requiredVars.filter(k => !process.env[k]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
  }

  logger.info('✅ Environment validation passed');
}

validateEnvironment();

let appInitialized = false;
const serviceStartTime = Date.now();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 7020;

// Redis setup
let redisClient: any = null;
let redisConnected = false;

async function initRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false
      }
    });
    await redisClient.connect();
    redisConnected = true;
    logger.info('✅ Redis connected successfully');
  } catch (err: any) {
    logger.warn('⚠️  Redis not available - using in-memory session storage');
    redisClient = null;
    redisConnected = false;
  }
}

initRedis();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Auth Service API',
      version: '1.0.0',
      description: 'Authentication and Authorization service with standardized responses',
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
      schemas: {
        // ✅ NEW: Document standard response format
        StandardResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if request was successful'
            },
            data: {
              type: 'object',
              description: 'Response data (only present on success)'
            },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
                statusCode: { type: 'number' }
              },
              description: 'Error information (only present on failure)'
            },
            metadata: {
              type: 'object',
              properties: {
                timestamp: { type: 'string' },
                requestId: { type: 'string' },
                version: { type: 'string' },
                service: { type: 'string' }
              },
              required: ['timestamp', 'requestId', 'version']
            }
          },
          required: ['success', 'metadata']
        }
      }
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// ✅ NEW: Add request ID middleware FIRST (before any other middleware)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:3000",
    process.env.CLIENT_URL || ""
  ].filter(url => url !== ""),
  credentials: true
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is not set');
  process.exit(1);
}

const sessionConfig: any = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
};

if (redisClient && redisConnected) {
  sessionConfig.store = new RedisStore({ client: redisClient });
  logger.info('Using Redis session store');
}

app.use(session(sessionConfig));

// Passport
app.use(passport.initialize());
app.use(passport.session());
setupPassportStrategies();

app.use(rateLimiter);

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      jwt: true,
      rbac: true,
      mfa: true,
      oauth2: true,
      sessionManagement: true,
      standardizedResponses: true, // ✅ NEW feature
    }
  });
});

app.get('/health/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    overall: false
  };

  try {
    try {
      const { getPool } = await import('./config/database');
      const pool = getPool();
      await pool.query('SELECT 1');
      checks.database = true;
    } catch (dbError) {
      logger.error('Health check - Database failed:', dbError);
    }

    try {
      if (redisClient && redisConnected) {
        await redisClient.ping();
        checks.redis = true;
      } else {
        checks.redis = process.env.NODE_ENV !== 'production';
      }
    } catch (redisError) {
      logger.error('Health check - Redis failed:', redisError);
    }

    checks.overall = checks.database && checks.redis;

    if (checks.overall) {
      res.status(200).json({ 
        status: 'ready', 
        checks,
        timestamp: new Date().toISOString() 
      });
    } else {
      res.status(503).json({ 
        status: 'not_ready', 
        checks,
        timestamp: new Date().toISOString() 
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

app.get('/health/startup', (req, res) => {
  res.status(appInitialized ? 200 : 503).json({
    status: appInitialized ? 'started' : 'starting',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  const uptime = Math.floor((Date.now() - serviceStartTime) / 1000);
  res.setHeader('Content-Type', 'text/plain');
  res.send(`service_uptime_seconds ${uptime}`);
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =============================================================================
// API ROUTES
// =============================================================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/v1/integration', integrationRoutes);
app.use('/auth/oauth2', oauthRoutes);
app.use('/auth/oidc', oauthRoutes);

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  next();
});

io.on('connection', (socket) => {
  logger.info(`Auth client connected: ${socket.id}`);
  
  socket.on('join-user-session', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.info(`Socket ${socket.id} joined user session: ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Auth client disconnected: ${socket.id}`);
  });
});

// =============================================================================
// ERROR HANDLING (MUST BE LAST)
// =============================================================================

// ✅ NEW: Use standardized error handler instead of custom one
app.use(errorHandlerMiddleware({ service: 'auth-service' }));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// =============================================================================
// DATABASE VALIDATION
// =============================================================================

async function validateDatabaseSchema() {
  try {
    const pool = await initializeDatabase();
    
    const requiredTables = [
      'auth_users',
      'auth_refresh_tokens',
      'auth_devices',
      'auth_roles',
      'auth_permissions',
      'auth_audit_logs',
      'auth_login_attempts'
    ];

    logger.info('🔍 Validating database schema...');

    for (const tableName of requiredTables) {
      const [rows]: any = await pool.query(
        `SELECT TABLE_NAME 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ?`,
        [tableName]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(
          `❌ Required table '${tableName}' does not exist.`
        );
      }
    }

    logger.info('✅ Database schema validation passed');
    return pool;
  } catch (error: any) {
    logger.error('❌ Database schema validation failed:', error.message);
    throw error;
  }
}

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function startServer() {
  try {
    await validateDatabaseSchema();
    logger.info('✅ Database ready');
    
    server.listen(PORT, () => {
      appInitialized = true;
      logger.info(`🚀 Auth service running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Features: JWT, RBAC, MFA, OAuth2, Standard Responses`);
      logger.info(`🗄️  Database: MySQL (${process.env.DB_NAME})`);
      logger.info(`📦 Redis: ${redisConnected ? 'Connected' : 'In-memory sessions'}`);
      logger.info(`✨ Response Wrapper: Enabled (Request ID tracking active)`);
    });
  } catch (error: any) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (redisClient && redisConnected) {
    redisClient.quit().catch(() => {});
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (redisClient && redisConnected) {
    redisClient.quit().catch(() => {});
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, server, io };

