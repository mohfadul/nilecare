"use strict";
/**
 * Health Check Utilities
 *
 * Provides standardized health check implementations for all microservices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPostgreSQLConnection = checkPostgreSQLConnection;
exports.checkMongoDBConnection = checkMongoDBConnection;
exports.checkRedisConnection = checkRedisConnection;
exports.checkKafkaConnection = checkKafkaConnection;
exports.generateHealthStatus = generateHealthStatus;
exports.createLivenessHandler = createLivenessHandler;
exports.createReadinessHandler = createReadinessHandler;
exports.createStartupHandler = createStartupHandler;
/**
 * Check PostgreSQL database connection
 */
async function checkPostgreSQLConnection(pool) {
    const startTime = Date.now();
    try {
        await pool.query('SELECT 1');
        return {
            healthy: true,
            latency: Date.now() - startTime,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Database connection failed';
        return {
            healthy: false,
            message,
            latency: Date.now() - startTime,
        };
    }
}
/**
 * Check MongoDB connection
 */
async function checkMongoDBConnection(connection) {
    const startTime = Date.now();
    try {
        if (connection.readyState === 1) {
            return {
                healthy: true,
                latency: Date.now() - startTime,
            };
        }
        return {
            healthy: false,
            message: 'MongoDB not connected',
            latency: Date.now() - startTime,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'MongoDB connection failed';
        return {
            healthy: false,
            message,
            latency: Date.now() - startTime,
        };
    }
}
/**
 * Check Redis connection
 */
async function checkRedisConnection(redis) {
    const startTime = Date.now();
    try {
        await redis.ping();
        return {
            healthy: true,
            latency: Date.now() - startTime,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Redis connection failed';
        return {
            healthy: false,
            message,
            latency: Date.now() - startTime,
        };
    }
}
/**
 * Check Kafka connection
 */
async function checkKafkaConnection(kafka) {
    const startTime = Date.now();
    try {
        const admin = kafka.admin();
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        return {
            healthy: true,
            latency: Date.now() - startTime,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Kafka connection failed';
        return {
            healthy: false,
            message,
            latency: Date.now() - startTime,
        };
    }
}
/**
 * Generate complete service health status
 */
function generateHealthStatus(checks, startTime) {
    const allChecks = Object.values(checks).filter(c => c !== undefined);
    const healthyCount = allChecks.filter(c => c.healthy).length;
    const totalCount = allChecks.length;
    let status;
    if (healthyCount === totalCount) {
        status = 'healthy';
    }
    else if (healthyCount > 0) {
        status = 'degraded';
    }
    else {
        status = 'unhealthy';
    }
    return {
        status,
        checks,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - startTime,
    };
}
/**
 * Create standard liveness endpoint handler
 */
function createLivenessHandler(serviceName, version = '1.0.0', features) {
    return (req, res) => {
        res.status(200).json({
            status: 'healthy',
            service: serviceName,
            timestamp: new Date().toISOString(),
            version,
            ...(features && { features }),
        });
    };
}
/**
 * Create readiness endpoint handler
 */
function createReadinessHandler(healthCheckFn) {
    return async (req, res) => {
        try {
            const health = await healthCheckFn();
            if (health.status === 'healthy') {
                res.status(200).json(health);
            }
            else {
                res.status(503).json(health);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Health check failed';
            res.status(503).json({
                status: 'unhealthy',
                error: message,
                timestamp: new Date().toISOString(),
            });
        }
    };
}
/**
 * Create startup endpoint handler
 */
function createStartupHandler(isInitializedFn) {
    return (req, res) => {
        if (isInitializedFn()) {
            res.status(200).json({
                status: 'started',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: 'starting',
                timestamp: new Date().toISOString(),
            });
        }
    };
}
//# sourceMappingURL=health-check.utils.js.map