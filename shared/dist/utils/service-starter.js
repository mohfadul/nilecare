"use strict";
/**
 * Service Starter Utility
 *
 * Provides standardized service initialization with proper health checks,
 * environment validation, and graceful shutdown
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceStarter = void 0;
exports.startService = startService;
const health_check_utils_1 = require("./health-check.utils");
class ServiceStarter {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.isInitialized = false;
        this.startTime = Date.now();
        this.server = this.app.listen(this.config.port);
    }
    /**
     * Setup health check endpoints
     */
    setupHealthChecks() {
        const { healthChecks, name, version } = this.config;
        // Liveness probe
        if (healthChecks.liveness.enabled) {
            const path = healthChecks.liveness.path || '/health';
            this.app.get(path, (0, health_check_utils_1.createLivenessHandler)(name, version, healthChecks.liveness.features));
            console.log(`✅ Liveness probe: GET ${path}`);
        }
        // Readiness probe
        if (healthChecks.readiness.enabled && healthChecks.readiness.checkFn) {
            const path = healthChecks.readiness.path || '/health/ready';
            this.app.get(path, (0, health_check_utils_1.createReadinessHandler)(healthChecks.readiness.checkFn));
            console.log(`✅ Readiness probe: GET ${path}`);
        }
        // Startup probe
        if (healthChecks.startup.enabled && healthChecks.startup.isInitializedFn) {
            const path = healthChecks.startup.path || '/health/startup';
            this.app.get(path, (0, health_check_utils_1.createStartupHandler)(healthChecks.startup.isInitializedFn));
            console.log(`✅ Startup probe: GET ${path}`);
        }
    }
    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown(cleanupFn) {
        const shutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down gracefully...`);
            // Stop accepting new connections
            this.server.close(async () => {
                console.log('HTTP server closed');
                // Run cleanup function if provided
                if (cleanupFn) {
                    try {
                        await cleanupFn();
                        console.log('Cleanup completed');
                    }
                    catch (error) {
                        console.error('Cleanup error:', error);
                    }
                }
                console.log(`${this.config.name} shut down successfully`);
                process.exit(0);
            });
            // Force shutdown after 30 seconds
            setTimeout(() => {
                console.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    /**
     * Start the service
     */
    start() {
        this.isInitialized = true;
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log(`║   ${this.config.name.toUpperCase().padEnd(45)} ║`);
        console.log('╚═══════════════════════════════════════════════════╝');
        console.log(`✅ Service: ${this.config.name}`);
        console.log(`✅ Version: ${this.config.version}`);
        console.log(`✅ Port: ${this.config.port}`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Started at: ${new Date().toISOString()}`);
        console.log(`✅ Health check: http://localhost:${this.config.port}/health`);
        if (this.config.healthChecks.readiness.enabled) {
            console.log(`✅ Readiness: http://localhost:${this.config.port}/health/ready`);
        }
        console.log(`✅ API Docs: http://localhost:${this.config.port}/api-docs`);
        console.log('═══════════════════════════════════════════════════\n');
    }
    /**
     * Get initialization status
     */
    isServiceInitialized() {
        return this.isInitialized;
    }
    /**
     * Get uptime in seconds
     */
    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}
exports.ServiceStarter = ServiceStarter;
/**
 * Create and start a service with proper configuration
 */
async function startService(app, config, cleanupFn) {
    const starter = new ServiceStarter(app, config);
    // Setup health checks
    starter.setupHealthChecks();
    // Setup graceful shutdown
    starter.setupGracefulShutdown(cleanupFn);
    // Start service
    starter.start();
    return starter;
}
//# sourceMappingURL=service-starter.js.map