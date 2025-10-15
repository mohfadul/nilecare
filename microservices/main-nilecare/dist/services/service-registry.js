"use strict";
/**
 * Service Registry
 * Centralized registry for all microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
exports.createServiceRegistry = createServiceRegistry;
exports.getServiceRegistry = getServiceRegistry;
const axios_1 = __importDefault(require("axios"));
class ServiceRegistry {
    constructor(logger) {
        this.services = new Map();
        this.healthCache = new Map();
        this.checkInterval = null;
        this.logger = logger;
        this.initializeServices();
    }
    /**
     * Initialize service definitions
     */
    initializeServices() {
        const services = [
            {
                name: 'business-service',
                url: process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
                port: 7010,
                healthEndpoint: '/health',
                version: '1.0.0',
                description: 'Business domain operations (appointments, billing, staff, scheduling)',
            },
            {
                name: 'auth-service',
                url: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
                port: 7020,
                healthEndpoint: '/health',
                version: '1.0.0',
                description: 'Authentication and authorization service',
            },
            {
                name: 'payment-service',
                url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030',
                port: 7030,
                healthEndpoint: '/health',
                version: '1.0.0',
                description: 'Payment processing and gateway service',
            },
            {
                name: 'appointment-service',
                url: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040',
                port: 7040,
                healthEndpoint: '/health',
                version: '1.0.0',
                description: 'Appointment management service',
            },
        ];
        services.forEach(service => {
            this.services.set(service.name, service);
        });
        this.logger.info(`Service registry initialized with ${services.length} services`);
    }
    /**
     * Register a new service
     */
    register(service) {
        this.services.set(service.name, service);
        this.logger.info(`Service registered: ${service.name} at ${service.url}`);
    }
    /**
     * Unregister a service
     */
    unregister(serviceName) {
        this.services.delete(serviceName);
        this.healthCache.delete(serviceName);
        this.logger.info(`Service unregistered: ${serviceName}`);
    }
    /**
     * Get service by name
     */
    getService(name) {
        return this.services.get(name);
    }
    /**
     * Get all registered services
     */
    getAllServices() {
        return Array.from(this.services.values());
    }
    /**
     * Check health of a single service
     */
    async checkServiceHealth(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            return {
                name: serviceName,
                url: 'unknown',
                status: 'unknown',
                lastCheck: new Date(),
                error: 'Service not found in registry',
            };
        }
        const startTime = Date.now();
        try {
            const response = await axios_1.default.get(`${service.url}${service.healthEndpoint}`, {
                timeout: 5000,
            });
            const responseTime = Date.now() - startTime;
            const healthStatus = {
                name: serviceName,
                url: service.url,
                status: 'healthy',
                responseTime,
                lastCheck: new Date(),
                uptime: response.data.uptime,
                version: response.data.version || service.version,
            };
            this.healthCache.set(serviceName, healthStatus);
            return healthStatus;
        }
        catch (error) {
            const healthStatus = {
                name: serviceName,
                url: service.url,
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                lastCheck: new Date(),
                error: error.message || 'Service unreachable',
            };
            this.healthCache.set(serviceName, healthStatus);
            this.logger.warn(`Service health check failed: ${serviceName} - ${error.message}`);
            return healthStatus;
        }
    }
    /**
     * Check health of all services
     */
    async checkAllServicesHealth() {
        const serviceNames = Array.from(this.services.keys());
        const healthChecks = await Promise.all(serviceNames.map(name => this.checkServiceHealth(name)));
        return healthChecks;
    }
    /**
     * Get cached health status
     */
    getCachedHealth(serviceName) {
        return this.healthCache.get(serviceName);
    }
    /**
     * Get all cached health statuses
     */
    getAllCachedHealth() {
        return Array.from(this.healthCache.values());
    }
    /**
     * Start periodic health checks
     */
    startHealthChecks(intervalMs = 30000) {
        if (this.checkInterval) {
            this.logger.warn('Health checks already running');
            return;
        }
        this.logger.info(`Starting periodic health checks every ${intervalMs}ms`);
        // Run initial check
        this.checkAllServicesHealth();
        // Schedule periodic checks
        this.checkInterval = setInterval(() => {
            this.checkAllServicesHealth();
        }, intervalMs);
    }
    /**
     * Stop periodic health checks
     */
    stopHealthChecks() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.logger.info('Stopped periodic health checks');
        }
    }
    /**
     * Get service discovery information
     */
    getServiceDiscovery() {
        const services = this.getAllCachedHealth();
        return {
            totalServices: this.services.size,
            healthyServices: services.filter(s => s.status === 'healthy').length,
            unhealthyServices: services.filter(s => s.status === 'unhealthy').length,
            unknownServices: this.services.size - services.length,
            services,
        };
    }
    /**
     * Get service URL by name
     */
    getServiceUrl(serviceName) {
        const service = this.services.get(serviceName);
        return service ? service.url : null;
    }
    /**
     * Check if service is available
     */
    isServiceAvailable(serviceName) {
        const health = this.healthCache.get(serviceName);
        return health?.status === 'healthy';
    }
    /**
     * Get service dependencies
     */
    getServiceDependencies(serviceName) {
        const service = this.services.get(serviceName);
        return service?.dependencies || [];
    }
    /**
     * Validate service dependencies
     */
    async validateDependencies(serviceName) {
        const dependencies = this.getServiceDependencies(serviceName);
        const missingDependencies = [];
        for (const dep of dependencies) {
            const isAvailable = this.isServiceAvailable(dep);
            if (!isAvailable) {
                missingDependencies.push(dep);
            }
        }
        return {
            valid: missingDependencies.length === 0,
            missingDependencies,
        };
    }
}
exports.ServiceRegistry = ServiceRegistry;
// Export singleton instance
let registryInstance = null;
function createServiceRegistry(logger) {
    if (!registryInstance) {
        registryInstance = new ServiceRegistry(logger);
    }
    return registryInstance;
}
function getServiceRegistry() {
    if (!registryInstance) {
        throw new Error('Service registry not initialized');
    }
    return registryInstance;
}
//# sourceMappingURL=service-registry.js.map