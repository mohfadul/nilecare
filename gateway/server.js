/**
 * NileCare API Gateway
 * Central routing for all microservices
 * Port: 7001
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();

// =================================================================
// CONFIGURATION
// =================================================================

const PORT = process.env.PORT || 7001;

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  mainNilecare: process.env.MAIN_NILECARE_URL || 'http://localhost:7000',
  paymentGateway: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:7030',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040',
  business: process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
};

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ]
});

// =================================================================
// INITIALIZE EXPRESS APP
// =================================================================

const app = express();

// =================================================================
// MIDDLEWARE
// =================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
}));

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use(morgan('dev'));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =================================================================
// RATE LIMITING
// =================================================================

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: { 
    success: false, 
    error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { 
    success: false, 
    error: { code: 'RATE_LIMIT', message: 'Too many authentication attempts' }
  }
});

// Appointment rate limiter
const appointmentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: { 
    success: false, 
    error: { code: 'RATE_LIMIT', message: 'Too many appointment requests' }
  }
});

// Bulk operations rate limiter (very strict)
const bulkLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { 
    success: false, 
    error: { code: 'RATE_LIMIT', message: 'Too many bulk operations' }
  }
});

// Apply global rate limiting
app.use(globalLimiter);

// =================================================================
// REQUEST LOGGING & MONITORING
// =================================================================

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`;
    
    if (res.statusCode >= 500) {
      logger.error(logMessage);
    } else if (res.statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });
  
  next();
});

// =================================================================
// HEALTH CHECK
// =================================================================

app.get('/health', async (req, res) => {
  const services = {};
  
  // Check auth-service
  try {
    const response = await fetch(`${SERVICES.auth}/health`);
    services.authService = { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      port: 3001,
      url: SERVICES.auth
    };
  } catch (error) {
    services.authService = { 
      status: 'unreachable', 
      port: 3001,
      error: error.message
    };
  }
  
  // Check main-nilecare
  try {
    const response = await fetch(`${SERVICES.mainNilecare}/health`);
    services.mainNilecare = { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      port: 3006,
      url: SERVICES.mainNilecare
    };
  } catch (error) {
    services.mainNilecare = { 
      status: 'unreachable', 
      port: 3006,
      error: error.message
    };
  }
  
  // Check payment-gateway
  try {
    const response = await fetch(`${SERVICES.paymentGateway}/health`);
    services.paymentGateway = { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      port: 3007,
      url: SERVICES.paymentGateway
    };
  } catch (error) {
    services.paymentGateway = { 
      status: 'unreachable', 
      port: 3007,
      error: error.message
    };
  }
  
  // Check appointment-service
  try {
    const response = await fetch(`${SERVICES.appointment}/health`);
    services.appointmentService = { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      port: 5002,
      url: SERVICES.appointment
    };
  } catch (error) {
    services.appointmentService = { 
      status: 'unreachable', 
      port: 5002,
      error: error.message
    };
  }
  
  // Check business-service
  try {
    const response = await fetch(`${SERVICES.business}/health`);
    services.businessService = { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      port: 3005,
      url: SERVICES.business
    };
  } catch (error) {
    services.businessService = { 
      status: 'unreachable', 
      port: 3005,
      error: error.message
    };
  }
  
  const allHealthy = Object.values(services).every(s => s.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    gateway: {
      status: 'healthy',
      port: PORT,
      version: '3.0.0',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    },
    services
  });
});

// =================================================================
// SERVICE INFO ENDPOINT
// =================================================================

app.get('/', (req, res) => {
  res.json({
    service: 'NileCare API Gateway',
    version: '3.0.0',
    status: 'running',
    port: PORT,
    architecture: 'Microservices with Service Mesh',
    routes: {
      health: '/health',
      // Auth Service (Port 3001)
      authentication: '/api/v1/auth/* → auth-service:3001',
      users: '/api/v1/users/* → auth-service:3001',
      roles: '/api/v1/roles/* → auth-service:3001',
      sessions: '/api/v1/sessions/* → auth-service:3001',
      mfa: '/api/v1/mfa/* → auth-service:3001',
      
      // Main NileCare Service (Port 3006) - NEW!
      data: '/api/v1/data/* → main-nilecare:3006',
      patients: '/api/v1/patients/* → main-nilecare:3006',
      bulk: '/api/v1/bulk/* → main-nilecare:3006',
      search: '/api/v1/search/* → main-nilecare:3006',
      audit: '/api/v1/audit/* → main-nilecare:3006',
      
      // Appointment Service (Port 5002)
      appointments: '/api/v1/appointments/* → appointment-service:5002',
      schedules: '/api/v1/schedules/* → appointment-service:5002',
      resources: '/api/v1/resources/* → appointment-service:5002',
      waitlist: '/api/v1/waitlist/* → appointment-service:5002',
      reminders: '/api/v1/reminders/* → appointment-service:5002',
      
      // Payment Gateway Service (Port 3007) - UPDATED!
      payments: '/api/v1/payments/* → payment-gateway:3007',
      reconciliation: '/api/v1/reconciliation/* → payment-gateway:3007',
      refunds: '/api/v1/refunds/* → payment-gateway:3007',
      
      // Fallback
      default: '/api/v1/* → main-nilecare:3006 (fallback)'
    },
    downstream: {
      authService: SERVICES.auth,
      mainNilecare: SERVICES.mainNilecare,
      paymentGateway: SERVICES.paymentGateway,
      appointmentService: SERVICES.appointment,
      businessService: SERVICES.business
    },
    changes: {
      version: '3.0.0',
      date: '2025-10-12',
      summary: 'Introduced main-nilecare service for central orchestration',
      updates: [
        'NEW: main-nilecare service (port 3006) - handles data, bulk, search, audit',
        'UPDATED: payment-gateway port changed from 3006 → 3007',
        'MOVED: General operations from payment-gateway to main-nilecare',
        'IMPROVED: Clear separation of concerns'
      ]
    }
  });
});

// =================================================================
// PROXY CONFIGURATION
// =================================================================

const proxyOptions = (targetService, serviceName) => ({
  target: targetService,
  changeOrigin: true,
  logLevel: 'debug',
  timeout: 30000, // 30 second timeout
  proxyTimeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    // Add gateway headers
    proxyReq.setHeader('X-Gateway', 'nilecare-gateway');
    proxyReq.setHeader('X-Gateway-Version', '1.0.0');
    proxyReq.setHeader('X-Forwarded-Host', req.hostname);
    
    logger.info(`[PROXY] ${req.method} ${req.path} → ${serviceName}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`[PROXY] ${serviceName} responded with ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    logger.error(`[PROXY ERROR] ${serviceName}: ${err.message}`);
    res.status(502).json({
      success: false,
      error: {
        code: 'GATEWAY_ERROR',
        message: `${serviceName} is unavailable`,
        details: err.message
      }
    });
  }
});

// =================================================================
// AUTHENTICATION ROUTES
// =================================================================

// Auth routes with strict rate limiting → Routes to Auth Service
app.use(
  '/api/v1/auth',
  authLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.auth, 'auth-service'))
);

// User management routes → Routes to Auth Service
app.use(
  '/api/v1/users',
  createProxyMiddleware(proxyOptions(SERVICES.auth, 'auth-service [USERS]'))
);

// Role management routes → Routes to Auth Service
app.use(
  '/api/v1/roles',
  createProxyMiddleware(proxyOptions(SERVICES.auth, 'auth-service [ROLES]'))
);

// Session management routes → Routes to Auth Service
app.use(
  '/api/v1/sessions',
  createProxyMiddleware(proxyOptions(SERVICES.auth, 'auth-service [SESSIONS]'))
);

// MFA routes → Routes to Auth Service
app.use(
  '/api/v1/mfa',
  authLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.auth, 'auth-service [MFA]'))
);

// =================================================================
// APPOINTMENT SERVICE ROUTES
// =================================================================

// Appointments - with fallback to payment-gateway
app.use(
  '/api/v1/appointments',
  appointmentLimiter,
  createProxyMiddleware({
    ...proxyOptions(SERVICES.appointment, 'appointment-service'),
    onError: (err, req, res) => {
      logger.warn(`[FALLBACK] appointment-service unavailable, trying payment-gateway`);
      // Fallback to payment-gateway
      const fallbackProxy = createProxyMiddleware(
        proxyOptions(SERVICES.paymentGateway, 'payment-gateway [FALLBACK]')
      );
      fallbackProxy(req, res);
    }
  })
);

// Schedules - appointment-service only (unique feature)
app.use(
  '/api/v1/schedules',
  appointmentLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.appointment, 'appointment-service [SCHEDULES]'))
);

// Resources - appointment-service only (unique feature)
app.use(
  '/api/v1/resources',
  appointmentLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.appointment, 'appointment-service [RESOURCES]'))
);

// Waitlist - appointment-service only (unique feature)
app.use(
  '/api/v1/waitlist',
  appointmentLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.appointment, 'appointment-service [WAITLIST]'))
);

// Reminders - appointment-service only (unique feature)
app.use(
  '/api/v1/reminders',
  appointmentLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.appointment, 'appointment-service [REMINDERS]'))
);

// =================================================================
// MAIN NILECARE SERVICE ROUTES (Data, Bulk, Search, Audit)
// =================================================================

// Data management routes → Main NileCare
app.use(
  '/api/v1/data',
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [DATA]'))
);

// Patients routes → Main NileCare
app.use(
  '/api/v1/patients',
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [PATIENTS]'))
);

// Bulk operations (Strict Rate Limit) → Main NileCare
app.use(
  '/api/v1/bulk',
  bulkLimiter,
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [BULK]'))
);

// Search routes → Main NileCare
app.use(
  '/api/v1/search',
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [SEARCH]'))
);

// Audit routes → Main NileCare
app.use(
  '/api/v1/audit',
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [AUDIT]'))
);

// =================================================================
// PAYMENT GATEWAY ROUTES (Payments Only)
// =================================================================

// Payment routes → Payment Gateway
app.use(
  '/api/v1/payments',
  createProxyMiddleware(proxyOptions(SERVICES.paymentGateway, 'payment-gateway [PAYMENTS]'))
);

// Reconciliation routes → Payment Gateway
app.use(
  '/api/v1/reconciliation',
  createProxyMiddleware(proxyOptions(SERVICES.paymentGateway, 'payment-gateway [RECONCILIATION]'))
);

// Refund routes → Payment Gateway
app.use(
  '/api/v1/refunds',
  createProxyMiddleware(proxyOptions(SERVICES.paymentGateway, 'payment-gateway [REFUNDS]'))
);

// =================================================================
// DEFAULT/FALLBACK ROUTE
// =================================================================

// Any unmatched /api/v1/* routes go to main-nilecare (default fallback)
app.use(
  '/api/v1',
  createProxyMiddleware(proxyOptions(SERVICES.mainNilecare, 'main-nilecare [FALLBACK]'))
);

// =================================================================
// ERROR HANDLING
// =================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

// =================================================================
// START GATEWAY
// =================================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌐  API GATEWAY STARTED v3.0.0');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📡  Gateway URL:      http://localhost:${PORT}`);
  console.log(`🏥  Health Check:     http://localhost:${PORT}/health`);
  console.log(`📚  Service Info:     http://localhost:${PORT}/`);
  console.log('');
  console.log('📍  Routing Configuration:');
  console.log('');
  console.log('   🔐 AUTH SERVICE (Port 3001):');
  console.log(`      /api/v1/auth/*          → ${SERVICES.auth}`);
  console.log(`      /api/v1/users/*         → ${SERVICES.auth}`);
  console.log(`      /api/v1/roles/*         → ${SERVICES.auth}`);
  console.log(`      /api/v1/sessions/*      → ${SERVICES.auth}`);
  console.log(`      /api/v1/mfa/*           → ${SERVICES.auth}`);
  console.log('');
  console.log('   🏥 MAIN NILECARE (Port 3006) - NEW!:');
  console.log(`      /api/v1/data/*          → ${SERVICES.mainNilecare}`);
  console.log(`      /api/v1/patients/*      → ${SERVICES.mainNilecare}`);
  console.log(`      /api/v1/bulk/*          → ${SERVICES.mainNilecare}`);
  console.log(`      /api/v1/search/*        → ${SERVICES.mainNilecare}`);
  console.log(`      /api/v1/audit/*         → ${SERVICES.mainNilecare}`);
  console.log('');
  console.log('   📅 APPOINTMENT SERVICE (Port 5002):');
  console.log(`      /api/v1/appointments/*  → ${SERVICES.appointment}`);
  console.log(`      /api/v1/schedules/*     → ${SERVICES.appointment}`);
  console.log(`      /api/v1/resources/*     → ${SERVICES.appointment}`);
  console.log(`      /api/v1/waitlist/*      → ${SERVICES.appointment}`);
  console.log(`      /api/v1/reminders/*     → ${SERVICES.appointment}`);
  console.log('');
  console.log('   💳 PAYMENT GATEWAY (Port 3007) - UPDATED!:');
  console.log(`      /api/v1/payments/*      → ${SERVICES.paymentGateway}`);
  console.log(`      /api/v1/reconciliation/* → ${SERVICES.paymentGateway}`);
  console.log(`      /api/v1/refunds/*       → ${SERVICES.paymentGateway}`);
  console.log('');
  console.log('   💼 BUSINESS SERVICE (Port 3005):');
  console.log(`      → ${SERVICES.business}`);
  console.log('');
  console.log('⚡  Features:');
  console.log('   ✅ Rate Limiting (1000/min global, 10/min auth)');
  console.log('   ✅ CORS Protection');
  console.log('   ✅ Security Headers (Helmet)');
  console.log('   ✅ Request Logging (Winston)');
  console.log('   ✅ Health Monitoring (All Services)');
  console.log('   ✅ Automatic Fallback (appointment → main-nilecare)');
  console.log('   ✅ Service Mesh Architecture');
  console.log('');
  console.log('🎯 Architecture Changes (v3.0.0):');
  console.log('   ✨ NEW: main-nilecare service for orchestration');
  console.log('   🔄 CHANGED: payment-gateway port 3006 → 3007');
  console.log('   📦 SEPARATED: General ops from payment processing');
  console.log('');
  console.log('✅ Gateway Ready to Accept Requests!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Gateway closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Gateway closed');
    process.exit(0);
  });
});

module.exports = app;

