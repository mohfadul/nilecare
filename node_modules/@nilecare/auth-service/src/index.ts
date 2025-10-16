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
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
// OAuth2Strategy temporarily removed - not needed for basic JWT authentication
// import OAuth2Strategy = require('passport-oauth2');
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
import { validateRequest } from './middleware/validation';
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
import statsRoutes from './routes/stats';
import emailVerificationRoutes from './routes/email-verification';

// Services
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { RoleService } from './services/RoleService';
import { MFAService } from './services/MFAService';
import { SessionService } from './services/SessionService';
import { OAuthService } from './services/OAuthService';

dotenv.config();

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
  'MFA_ENCRYPTION_KEY'
];

const PRODUCTION_REQUIRED_ENV_VARS = [
  ...REQUIRED_ENV_VARS,
  'DB_PASSWORD',
  'REDIS_URL'
];

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredVars = isProduction ? PRODUCTION_REQUIRED_ENV_VARS : REQUIRED_ENV_VARS;
  
  const missing = requiredVars.filter(k => !process.env[k]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('💡 Copy .env.example to .env and update all values');
    throw new Error(`Missing critical env vars: ${missing.join(', ')}`);
  }

  // Validate secret lengths
  const secrets = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
    { name: 'JWT_REFRESH_SECRET', value: process.env.JWT_REFRESH_SECRET },
    { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
    { name: 'MFA_ENCRYPTION_KEY', value: process.env.MFA_ENCRYPTION_KEY }
  ];

  for (const secret of secrets) {
    if (secret.value && secret.value.length < 32) {
      throw new Error(`${secret.name} must be at least 32 characters long`);
    }
    // Check for default/example values
    if (secret.value && (
      secret.value.includes('CHANGE_THIS') || 
      secret.value.includes('change-this') ||
      secret.value === 'nilecare-jwt-secret' ||
      secret.value === 'default-mfa-key-change-in-production'
    )) {
      throw new Error(`${secret.name} contains default value. Generate a secure random string!`);
    }
  }

  // DB_PASSWORD is optional for local MySQL (XAMPP default has no password)
  if (process.env.DB_PASSWORD === undefined) {
    process.env.DB_PASSWORD = '';
    if (isProduction) {
      console.warn('⚠️  WARNING: DB_PASSWORD is empty in production!');
    }
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
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 7020;

// Redis client for session storage (optional)
let redisClient: any = null;
let redisConnected = false;

// Try to initialize Redis connection (non-blocking)
async function initRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false // Don't retry on failure
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

// Initialize Redis in the background (don't wait for it)
initRedis();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Auth Service API',
      version: '1.0.0',
      description: 'Authentication and Authorization service with JWT, RBAC, MFA, OAuth2/OpenID Connect',
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
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// =============================================================================
// MIDDLEWARE (Order matters!)
// =============================================================================

// ✅ NEW: Add request ID middleware FIRST (for request tracking)
app.use(requestIdMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
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
// Validate session secret on startup
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET environment variable is not set');
  process.exit(1);
}

// Session configuration with optional Redis store
const sessionConfig: any = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
};

// Use Redis store if available, otherwise use default in-memory store
if (redisClient && redisConnected) {
  sessionConfig.store = new RedisStore({ client: redisClient });
  logger.info('Using Redis session store');
} else {
  logger.info('Using in-memory session store (not recommended for production)');
}

app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup Passport strategies
setupPassportStrategies();

app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      jwt: true,
      rbac: true,
      mfa: true,
      oauth2: true,
      openidConnect: true,
      sessionManagement: true
    }
  });
});

// Readiness probe
app.get('/health/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    overall: false
  };

  try {
    // Check database connection
    try {
      const { getPool } = await import('./config/database');
      const pool = getPool();
      await pool.query('SELECT 1');
      checks.database = true;
    } catch (dbError) {
      logger.error('Health check - Database failed:', dbError);
    }

    // Check Redis connection
    try {
      if (redisClient && redisConnected) {
        await redisClient.ping();
        checks.redis = true;
      } else {
        checks.redis = process.env.NODE_ENV !== 'production'; // OK in dev without Redis
      }
    } catch (redisError) {
      logger.error('Health check - Redis failed:', redisError);
    }

    // Overall readiness
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/oauth', oauthRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/email-verification', emailVerificationRoutes);

// Integration Routes (for service-to-service communication)
app.use('/api/v1/integration', integrationRoutes);

// OAuth2/OIDC callback routes
app.use('/auth/oauth2', oauthRoutes);
app.use('/auth/oidc', oauthRoutes);

// Socket.IO for real-time authentication events
io.use((socket, next) => {
  // Authenticate socket connections
  const token = socket.handshake.auth.token;
  // Implement JWT verification here
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
// ERROR HANDLING (MUST BE LAST - after all routes)
// =============================================================================

// ✅ NEW: Use standardized error handler
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
// DATABASE SCHEMA VALIDATION
// =============================================================================
async function validateDatabaseSchema() {
  try {
    const pool = await initializeDatabase();
    
    // Check if required tables exist
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
          `❌ Required table '${tableName}' does not exist. ` +
          `Run: mysql -u root -p ${process.env.DB_NAME} < create-mysql-tables.sql`
        );
      }
    }

    // Validate critical indexes exist
    const criticalIndexes = [
      { table: 'auth_users', index: 'idx_auth_users_email' },
      { table: 'auth_refresh_tokens', index: 'idx_refresh_tokens_user' }
    ];

    for (const { table, index } of criticalIndexes) {
      const [rows]: any = await pool.query(
        `SELECT INDEX_NAME 
         FROM information_schema.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ? 
         AND INDEX_NAME = ?`,
        [table, index]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        logger.warn(`⚠️  Index '${index}' missing on table '${table}'`);
      }
    }

    // Check if default roles exist
    const [roleRows]: any = await pool.query(
      'SELECT COUNT(*) as count FROM auth_roles WHERE is_system = TRUE'
    );

    if (roleRows[0].count === 0) {
      logger.warn('⚠️  No default roles found. Default roles should be seeded.');
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
    // Validate and initialize database
    await validateDatabaseSchema();
    logger.info('✅ Database ready');
    
    // Start server
    server.listen(PORT, () => {
      appInitialized = true;
      logger.info(`🚀 Auth service running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Features: JWT, RBAC, MFA, OAuth2, OpenID Connect, Session Management`);
      logger.info(`✨ Response Wrapper: Enabled (Request ID tracking active)`);
      logger.info(`🗄️  Database: MySQL (${process.env.DB_NAME})`);
      logger.info(`📦 Redis: ${redisConnected ? 'Connected' : 'In-memory sessions'}`);
    });
  } catch (error: any) {
    logger.error('❌ Failed to start server:', error);
    logger.error('💡 Check database connection and run migrations');
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
