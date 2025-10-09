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
import { OAuth2Strategy } from 'passport-oauth2';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { validateRequest } from './middleware/validation';
import { setupPassportStrategies } from './config/passport';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import sessionRoutes from './routes/sessions';
import mfaRoutes from './routes/mfa';
import oauthRoutes from './routes/oauth';

// Services
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { RoleService } from './services/RoleService';
import { MFAService } from './services/MFAService';
import { SessionService } from './services/SessionService';
import { OAuthService } from './services/OAuthService';

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
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Redis client for session storage
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

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

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
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

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/oauth', oauthRoutes);

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

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Features enabled: JWT, RBAC, MFA, OAuth2, OpenID Connect, Session Management`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  redisClient.quit();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  redisClient.quit();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { app, server, io };
