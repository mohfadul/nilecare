"use strict";
/**
 * Device Integration Service - Main Entry Point
 * NileCare Healthcare Platform
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Configuration
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
// Routes
const devices_1 = require("./routes/devices");
const vital_signs_1 = require("./routes/vital-signs");
const health_1 = __importDefault(require("./routes/health"));
// Middleware
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
// Logger
const logger_1 = __importDefault(require("./utils/logger"));
// Initialize Express app
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
// Socket.IO for real-time device data
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.config.ALLOWED_ORIGINS.split(','),
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
    transports: ['websocket', 'polling'],
});
exports.io = io;
// Middleware Configuration
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: env_1.config.ALLOWED_ORIGINS.split(','),
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.default.info(message.trim()),
    },
}));
app.use(rateLimiter_1.standardLimiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NileCare Device Integration Service API',
            version: '1.0.0',
            description: 'Medical device connectivity and vital signs monitoring service for NileCare Healthcare Platform',
            contact: {
                name: 'NileCare Development Team',
                email: 'dev@nilecare.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${env_1.config.PORT}`,
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, {
    customSiteTitle: 'Device Integration API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
}));
// Health Routes (no authentication required)
app.use('/health', health_1.default);
// API Routes (will be initialized after database connection)
let deviceRoutes;
let vitalSignsRoutes;
// WebSocket Connection Handling
io.on('connection', (socket) => {
    logger_1.default.info(`Device client connected: ${socket.id}`);
    // Subscribe to specific device updates
    socket.on('subscribe-device', (deviceId) => {
        socket.join(`device-${deviceId}`);
        logger_1.default.info(`Client ${socket.id} subscribed to device ${deviceId}`);
    });
    // Subscribe to patient's devices
    socket.on('subscribe-patient', (patientId) => {
        socket.join(`patient-${patientId}`);
        logger_1.default.info(`Client ${socket.id} subscribed to patient ${patientId} devices`);
    });
    // Unsubscribe from device
    socket.on('unsubscribe-device', (deviceId) => {
        socket.leave(`device-${deviceId}`);
        logger_1.default.info(`Client ${socket.id} unsubscribed from device ${deviceId}`);
    });
    // Handle device heartbeat
    socket.on('device-heartbeat', (data) => {
        const { deviceId } = data;
        io.to(`device-${deviceId}`).emit('heartbeat-received', {
            deviceId,
            timestamp: new Date().toISOString(),
        });
    });
    socket.on('disconnect', () => {
        logger_1.default.info(`Device client disconnected: ${socket.id}`);
    });
    socket.on('error', (error) => {
        logger_1.default.error(`Socket error: ${socket.id}`, { error: error.message });
    });
});
// 404 Handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });
});
// Error Handler (must be last)
app.use(errorHandler_1.errorHandler);
// Server Initialization Function
async function startServer() {
    try {
        logger_1.default.info('🚀 Starting Device Integration Service...');
        // Step 1: Validate environment configuration
        logger_1.default.info('Validating environment configuration...');
        (0, env_1.validateConfig)();
        // Step 2: Initialize database
        logger_1.default.info('Connecting to database...');
        await (0, database_1.initializeDatabase)();
        // Step 3: Initialize Redis
        logger_1.default.info('Connecting to Redis...');
        await (0, redis_1.initializeRedis)();
        // Step 4: Initialize routes (after database is ready)
        logger_1.default.info('Initializing API routes...');
        deviceRoutes = (0, devices_1.initializeDeviceRoutes)();
        vitalSignsRoutes = (0, vital_signs_1.initializeVitalSignsRoutes)();
        app.use('/api/v1/devices', deviceRoutes);
        app.use('/api/v1/vital-signs', vitalSignsRoutes);
        // Step 5: Start HTTP server
        server.listen(env_1.config.PORT, () => {
            logger_1.default.info('='.repeat(60));
            logger_1.default.info(`✅ Device Integration Service is running`);
            logger_1.default.info(`📍 Port: ${env_1.config.PORT}`);
            logger_1.default.info(`🌍 Environment: ${env_1.config.NODE_ENV}`);
            logger_1.default.info(`📚 API Documentation: http://localhost:${env_1.config.PORT}/api-docs`);
            logger_1.default.info(`🔌 WebSocket Server: ws://localhost:${env_1.config.PORT}`);
            logger_1.default.info(`❤️  Health Check: http://localhost:${env_1.config.PORT}/health`);
            logger_1.default.info('='.repeat(60));
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
}
// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
    logger_1.default.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
        logger_1.default.info('HTTP server closed');
        try {
            await (0, database_1.closeDatabase)();
            await (0, redis_1.closeRedis)();
            logger_1.default.info('All connections closed');
            process.exit(0);
        }
        catch (error) {
            logger_1.default.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger_1.default.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}
// Signal Handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', { promise, reason });
});
// Uncaught Exception Handler
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});
// Start the server
startServer();
//# sourceMappingURL=index.js.map