"use strict";
/**
 * Main NileCare Service
 * Central integration and orchestration microservice
 * Port: 3006 (default)
 *
 * Responsibilities:
 * - General data management (patients, users, appointments)
 * - Bulk operations
 * - Advanced search
 * - Audit logging
 * - Cross-service orchestration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = require("dotenv");
const winston_1 = __importDefault(require("winston"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Load environment variables
(0, dotenv_1.config)();
// Import routes
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const data_routes_1 = __importDefault(require("./routes/data.routes"));
const bulk_routes_1 = __importDefault(require("./routes/bulk.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const orchestrator_routes_1 = __importDefault(require("./routes/orchestrator.routes"));
const service_discovery_routes_1 = __importDefault(require("./routes/service-discovery.routes"));
const business_routes_1 = __importDefault(require("./routes/business.routes"));
// Import middleware
const error_handler_1 = require("./middleware/error-handler");
const request_logger_1 = require("./middleware/request-logger");
const rate_limiter_1 = require("./middleware/rate-limiter");
const audit_logger_1 = require("./middleware/audit-logger");
// Import authentication middleware (local copy for module resolution)
const auth_1 = require("./middleware/auth");
// Import service registry
const service_registry_1 = require("./services/service-registry");
// Initialize logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, service }) => {
                return `${timestamp} [${level}] ${message} ${service ? JSON.stringify({ service }) : ''}`;
            }))
        }),
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' })
    ],
    defaultMeta: { service: 'main-nilecare' }
});
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3006;
// =================================================================
// MIDDLEWARE
// =================================================================
// Configure Helmet with relaxed settings for development
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));
// Configure CORS
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        ...(process.env.CORS_ORIGIN?.split(',') || [])
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
// Compression
app.use((0, compression_1.default)());
// Body parser
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, _res, buf, _encoding) => {
        req.rawBody = buf;
    }
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb',
    verify: (req, _res, buf, _encoding) => {
        req.rawBody = buf;
    }
}));
// Handle body parser errors
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.name === 'BadRequestError') {
        logger.error('Body parser error:', {
            name: err.name,
            message: err.message,
            path: req.path,
            method: req.method
        });
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_REQUEST',
                message: 'Invalid request body'
            }
        });
    }
    next(err);
});
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Request logging
app.use(request_logger_1.requestLogger);
// Rate limiting
app.use(rate_limiter_1.rateLimiter);
// Audit logging
app.use(audit_logger_1.auditLogger);
// =================================================================
// ROUTES
// =================================================================
// Health check (public)
app.use('/health', health_routes_1.default);
// Service info endpoint
app.get('/', (_req, res) => {
    res.json({
        service: 'NileCare Main Integration Service',
        version: '1.0.0',
        status: 'running',
        port: PORT,
        description: 'Central orchestration and data management',
        routes: {
            health: '/health',
            healthReady: '/health/ready',
            healthStatus: '/health/status',
            data: '/api/v1/data/* (patients, users, dashboard)',
            bulk: '/api/v1/bulk/* (bulk operations)',
            search: '/api/v1/search/* (advanced search)',
            audit: '/api/v1/audit/* (audit logs)',
            business: '/api/business/* (appointments, billing, staff, scheduling)',
            orchestrator: '/api/* (microservice orchestration)'
        },
        integrations: {
            authService: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
            paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007',
            appointmentService: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004',
            businessService: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3005'
        },
        timestamp: new Date().toISOString()
    });
});
// Data routes (general data management)
app.use('/api/v1/data', data_routes_1.default);
app.use('/api/v1', data_routes_1.default); // Also mount at /api/v1 for legacy compatibility
// Bulk operations (require authentication)
app.use('/api/v1/bulk', auth_1.authenticate, bulk_routes_1.default);
// Search routes (require authentication)
app.use('/api/v1/search', auth_1.authenticate, search_routes_1.default);
// Audit routes (require authentication)
app.use('/api/v1/audit', auth_1.authenticate, audit_routes_1.default);
// Business service proxy routes (require authentication)
app.use('/api/business', business_routes_1.default);
// Orchestrator routes (microservice routing and aggregation)
app.use('/api', orchestrator_routes_1.default);
// Service discovery routes (service registry)
app.use('/api/discovery', service_discovery_routes_1.default);
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
            suggestion: 'Check the API documentation at /'
        }
    });
});
// Global error handler
app.use(error_handler_1.errorHandler);
// =================================================================
// START SERVER
// =================================================================
let appInitialized = false;
// Initialize service registry
const serviceRegistry = (0, service_registry_1.createServiceRegistry)(logger);
const server = app.listen(PORT, () => {
    appInitialized = true;
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀  MAIN NILECARE SERVICE STARTED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📡  Service URL:       http://localhost:${PORT}`);
    console.log(`🏥  Health Check:      http://localhost:${PORT}/health`);
    console.log(`📊  Service Info:      http://localhost:${PORT}/`);
    console.log('');
    console.log('📍  Available Endpoints:');
    console.log('   /api/v1/data/*        General data management');
    console.log('   /api/v1/bulk/*        Bulk operations (auth required)');
    console.log('   /api/v1/search/*      Advanced search (auth required)');
    console.log('   /api/v1/audit/*       Audit logs (auth required)');
    console.log('   /api/business/*       Business service (auth required)');
    console.log('');
    console.log('🔗  Downstream Services:');
    console.log(`   Auth Service:         ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
    console.log(`   Payment Service:      ${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007'}`);
    console.log(`   Appointment Service:  ${process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004'}`);
    console.log(`   Business Service:     ${process.env.BUSINESS_SERVICE_URL || 'http://localhost:3005'}`);
    console.log('');
    console.log('⚡  Features:');
    console.log('   ✅ Shared Authentication (JWT)');
    console.log('   ✅ Rate Limiting');
    console.log('   ✅ Audit Logging');
    console.log('   ✅ CORS Protection');
    console.log('   ✅ Security Headers');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    logger.info('Main NileCare service started', { port: PORT });
    // Start periodic health checks
    serviceRegistry.startHealthChecks(30000); // Every 30 seconds
});
// =================================================================
// GRACEFUL SHUTDOWN
// =================================================================
const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    // Stop health checks
    serviceRegistry.stopHealthChecks();
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// =================================================================
// ERROR HANDLERS
// =================================================================
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
});
exports.default = app;
//# sourceMappingURL=index.js.map