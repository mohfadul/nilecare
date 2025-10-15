"use strict";
/**
 * Service Template Example
 *
 * Shows how to implement a microservice with:
 * - Environment validation
 * - Health checks (liveness, readiness, startup)
 * - Graceful shutdown
 * - Connection pooling
 * - Proper error handling
 *
 * Copy this template when creating new services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const kafkajs_1 = require("kafkajs");
// Import shared utilities
const environment_validator_1 = require("./environment-validator");
const health_check_utils_1 = require("./health-check.utils");
const service_starter_1 = require("./service-starter");
// Load environment variables
dotenv_1.default.config();
// ============================================================================
// 1. ENVIRONMENT VALIDATION (Fail fast if misconfigured)
// ============================================================================
(0, environment_validator_1.validateServiceEnvironment)('example-service', environment_validator_1.environmentPresets.common(), environment_validator_1.environmentPresets.database(), environment_validator_1.environmentPresets.redis(), environment_validator_1.environmentPresets.kafka(), environment_validator_1.environmentPresets.authentication());
// ============================================================================
// 2. INITIALIZE EXPRESS APP
// ============================================================================
const app = (0, express_1.default)();
exports.app = app;
const PORT = parseInt(process.env.PORT || '3001');
let appInitialized = false;
const serviceStartTime = Date.now();
// ============================================================================
// 3. INITIALIZE CONNECTIONS (with pooling)
// ============================================================================
const postgresPool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Max connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Timeout if no connection available
});
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    enableOfflineQueue: false, // Fail fast if Redis is down
});
const kafka = new kafkajs_1.Kafka({
    clientId: 'example-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});
// ============================================================================
// 4. MIDDLEWARE SETUP
// ============================================================================
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================================================
// 5. HEALTH CHECK ENDPOINTS
// ============================================================================
// Liveness probe - Is the service running?
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'example-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
        features: {
            database: true,
            cache: true,
            events: true,
            auth: true,
        },
    });
});
// Readiness probe - Is the service ready to accept traffic?
app.get('/health/ready', async (req, res) => {
    try {
        // Check all dependencies in parallel
        const [dbCheck, redisCheck, kafkaCheck] = await Promise.allSettled([
            (0, health_check_utils_1.checkPostgreSQLConnection)(postgresPool),
            (0, health_check_utils_1.checkRedisConnection)(redis),
            (0, health_check_utils_1.checkKafkaConnection)(kafka),
        ]);
        const health = (0, health_check_utils_1.generateHealthStatus)({
            database: dbCheck.status === 'fulfilled' ? dbCheck.value : { healthy: false, message: 'Check failed' },
            redis: redisCheck.status === 'fulfilled' ? redisCheck.value : { healthy: false, message: 'Check failed' },
            kafka: kafkaCheck.status === 'fulfilled' ? kafkaCheck.value : { healthy: false, message: 'Check failed' },
        }, serviceStartTime);
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Health check failed';
        res.status(503).json({
            status: 'unhealthy',
            error: message,
            timestamp: new Date().toISOString(),
        });
    }
});
// Startup probe - Has the service finished initialization?
app.get('/health/startup', (req, res) => {
    if (appInitialized) {
        res.status(200).json({
            status: 'started',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - serviceStartTime) / 1000),
        });
    }
    else {
        res.status(503).json({
            status: 'starting',
            timestamp: new Date().toISOString(),
        });
    }
});
// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
    const poolStats = {
        totalCount: postgresPool.totalCount || 0,
        idleCount: postgresPool.idleCount || 0,
        waitingCount: postgresPool.waitingCount || 0,
    };
    res.setHeader('Content-Type', 'text/plain');
    res.send(`
# Database connection pool metrics
db_pool_total_connections ${poolStats.totalCount}
db_pool_idle_connections ${poolStats.idleCount}
db_pool_waiting_requests ${poolStats.waitingCount}
db_pool_utilization ${poolStats.totalCount > 0 ? (poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount : 0}

# Service uptime
service_uptime_seconds ${Math.floor((Date.now() - serviceStartTime) / 1000)}
  `.trim());
});
// ============================================================================
// 6. API ROUTES
// ============================================================================
app.get('/api/v1/example', async (req, res) => {
    try {
        const result = await postgresPool.query('SELECT NOW() as current_time');
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to query database',
                details: process.env.NODE_ENV === 'development' ? message : undefined,
            },
        });
    }
});
// ============================================================================
// 7. ERROR HANDLING
// ============================================================================
app.use((err, req, res, next) => {
    console.error('[Error]', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : err.message;
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
            path: req.originalUrl,
        },
    });
});
// ============================================================================
// 8. START SERVICE WITH PROPER INITIALIZATION
// ============================================================================
async function initializeService() {
    try {
        console.log('🚀 Initializing service...\n');
        // Test database connection
        console.log('📊 Testing database connection...');
        const dbCheck = await (0, health_check_utils_1.checkPostgreSQLConnection)(postgresPool);
        if (!dbCheck.healthy) {
            throw new Error(`Database check failed: ${dbCheck.message}`);
        }
        console.log(`✅ Database connected (${dbCheck.latency}ms)\n`);
        // Test Redis connection
        console.log('💾 Testing Redis connection...');
        const redisCheck = await (0, health_check_utils_1.checkRedisConnection)(redis);
        if (!redisCheck.healthy) {
            console.warn(`⚠️  Redis check failed: ${redisCheck.message}`);
        }
        else {
            console.log(`✅ Redis connected (${redisCheck.latency}ms)\n`);
        }
        // Test Kafka connection
        console.log('📨 Testing Kafka connection...');
        const kafkaCheck = await (0, health_check_utils_1.checkKafkaConnection)(kafka);
        if (!kafkaCheck.healthy) {
            console.warn(`⚠️  Kafka check failed: ${kafkaCheck.message}`);
        }
        else {
            console.log(`✅ Kafka connected (${kafkaCheck.latency}ms)\n`);
        }
        // Mark as initialized
        appInitialized = true;
        console.log('✅ Service initialization complete\n');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Initialization failed';
        console.error('❌ Service initialization failed:', message);
        throw error;
    }
}
// Cleanup function for graceful shutdown
async function cleanup() {
    console.log('🧹 Cleaning up resources...');
    // Close database pool
    await postgresPool.end();
    console.log('✅ Database pool closed');
    // Close Redis connection
    await redis.quit();
    console.log('✅ Redis connection closed');
    // Disconnect Kafka
    // kafka disconnect logic if needed
    console.log('✅ Kafka disconnected');
}
// Start the service
(async () => {
    try {
        // Initialize connections and dependencies
        await initializeService();
        // Start service with health checks and graceful shutdown
        await (0, service_starter_1.startService)(app, {
            name: 'example-service',
            version: '1.0.0',
            port: PORT,
            healthChecks: {
                liveness: {
                    enabled: true,
                    features: {
                        database: true,
                        cache: true,
                        events: true,
                    },
                },
                readiness: {
                    enabled: true,
                    checkFn: async () => {
                        const [dbCheck, redisCheck, kafkaCheck] = await Promise.all([
                            (0, health_check_utils_1.checkPostgreSQLConnection)(postgresPool),
                            (0, health_check_utils_1.checkRedisConnection)(redis),
                            (0, health_check_utils_1.checkKafkaConnection)(kafka),
                        ]);
                        return (0, health_check_utils_1.generateHealthStatus)({ database: dbCheck, redis: redisCheck, kafka: kafkaCheck }, serviceStartTime);
                    },
                },
                startup: {
                    enabled: true,
                    isInitializedFn: () => appInitialized,
                },
            },
        }, cleanup);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Startup failed';
        console.error('❌ Failed to start service:', message);
        process.exit(1);
    }
})();
//# sourceMappingURL=service-template.example.js.map