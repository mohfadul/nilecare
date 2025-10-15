"use strict";
/**
 * @nilecare/service-discovery
 *
 * Service registry with health-based routing for microservices.
 * Eliminates hardcoded URLs and enables automatic failover.
 *
 * Usage:
 * ```typescript
 * import { ServiceRegistry } from '@nilecare/service-discovery';
 *
 * const registry = new ServiceRegistry();
 * registry.register('auth-service', 'http://localhost:7020');
 * registry.register('business-service', 'http://localhost:7010');
 *
 * registry.startHealthChecks(); // Check every 30 seconds
 *
 * // Get service URL (returns null if unhealthy)
 * const authUrl = await registry.getServiceUrl('auth-service');
 * if (authUrl) {
 *   // Make request to auth service
 * }
 * ```
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
exports.createNileCareRegistry = createNileCareRegistry;
const axios_1 = __importDefault(require("axios"));
class ServiceRegistry {
    constructor(healthConfig) {
        this.services = new Map();
        this.healthCheckInterval = null;
        this.healthConfig = {
            path: healthConfig?.path || '/health',
            timeout: healthConfig?.timeout || 3000,
            interval: healthConfig?.interval || 30000,
            maxFailures: healthConfig?.maxFailures || 3
        };
    }
    /**
     * Register a service in the registry
     */
    register(name, url) {
        this.services.set(name, {
            name,
            url,
            healthy: true,
            lastCheck: new Date(),
            failureCount: 0
        });
        console.log(`[ServiceRegistry] Registered: ${name} at ${url}`);
    }
    /**
     * Unregister a service
     */
    unregister(name) {
        const deleted = this.services.delete(name);
        if (deleted) {
            console.log(`[ServiceRegistry] Unregistered: ${name}`);
        }
        return deleted;
    }
    /**
     * Get service URL if healthy, null otherwise
     */
    async getServiceUrl(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }
        // If service is marked unhealthy, try to check health first
        if (!service.healthy) {
            await this.checkHealth(name);
        }
        // Return URL only if healthy
        return service.healthy ? service.url : null;
    }
    /**
     * Get service URL without health check (use cached status)
     */
    getServiceUrlSync(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }
        return service.healthy ? service.url : null;
    }
    /**
     * Check health of a specific service
     */
    async checkHealth(name) {
        const service = this.services.get(name);
        if (!service)
            return false;
        try {
            const response = await axios_1.default.get(`${service.url}${this.healthConfig.path}`, {
                timeout: this.healthConfig.timeout,
                validateStatus: (status) => status >= 200 && status < 300
            });
            // Service is healthy
            if (service.failureCount > 0 || !service.healthy) {
                console.log(`[ServiceRegistry] ✅ ${name} recovered (was unhealthy)`);
            }
            service.healthy = true;
            service.failureCount = 0;
            service.lastCheck = new Date();
            service.lastError = undefined;
            return true;
        }
        catch (error) {
            // Service is unhealthy
            service.failureCount++;
            service.lastCheck = new Date();
            service.lastError = error.message;
            const wasHealthy = service.healthy;
            // Mark unhealthy if max failures reached
            if (service.failureCount >= this.healthConfig.maxFailures) {
                service.healthy = false;
                if (wasHealthy) {
                    console.error(`[ServiceRegistry] ❌ ${name} marked UNHEALTHY (${service.failureCount} failures)`);
                }
            }
            else {
                console.warn(`[ServiceRegistry] ⚠️  ${name} health check failed (${service.failureCount}/${this.healthConfig.maxFailures}): ${error.message}`);
            }
            return false;
        }
    }
    /**
     * Start periodic health checks for all services
     */
    startHealthChecks() {
        if (this.healthCheckInterval) {
            console.warn('[ServiceRegistry] Health checks already running');
            return;
        }
        console.log(`[ServiceRegistry] Starting health checks (every ${this.healthConfig.interval}ms)`);
        // Initial health check
        this.checkAllServices();
        // Periodic health checks
        this.healthCheckInterval = setInterval(() => {
            this.checkAllServices();
        }, this.healthConfig.interval);
    }
    /**
     * Stop periodic health checks
     */
    stopHealthChecks() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('[ServiceRegistry] Health checks stopped');
        }
    }
    /**
     * Check health of all registered services
     */
    async checkAllServices() {
        const checks = Array.from(this.services.keys()).map(serviceName => this.checkHealth(serviceName));
        await Promise.all(checks);
    }
    /**
     * Get status of all services
     */
    getStatus() {
        const status = {};
        this.services.forEach((service, name) => {
            status[name] = {
                url: service.url,
                healthy: service.healthy,
                lastCheck: service.lastCheck,
                failureCount: service.failureCount,
                lastError: service.lastError
            };
        });
        return status;
    }
    /**
     * Get only healthy services
     */
    getHealthyServices() {
        return Array.from(this.services.entries())
            .filter(([_, service]) => service.healthy)
            .map(([name, _]) => name);
    }
    /**
     * Get only unhealthy services
     */
    getUnhealthyServices() {
        return Array.from(this.services.entries())
            .filter(([_, service]) => !service.healthy)
            .map(([name, _]) => name);
    }
    /**
     * Check if a service is healthy (cached status)
     */
    isHealthy(name) {
        const service = this.services.get(name);
        return service ? service.healthy : false;
    }
    /**
     * Get count of registered services
     */
    getServiceCount() {
        return this.services.size;
    }
    /**
     * Clear all services
     */
    clear() {
        this.stopHealthChecks();
        this.services.clear();
        console.log('[ServiceRegistry] All services cleared');
    }
}
exports.ServiceRegistry = ServiceRegistry;
/**
 * Create a pre-configured service registry with common NileCare services
 */
function createNileCareRegistry(options) {
    const registry = new ServiceRegistry(options?.healthConfig);
    // Default NileCare services from environment or defaults
    const defaultServices = {
        'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
        'business-service': process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010',
        'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:7040',
        'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030',
        'billing-service': process.env.BILLING_SERVICE_URL || 'http://localhost:7050',
        'medication-service': process.env.MEDICATION_SERVICE_URL || 'http://localhost:4003',
        'lab-service': process.env.LAB_SERVICE_URL || 'http://localhost:4005',
        'inventory-service': process.env.INVENTORY_SERVICE_URL || 'http://localhost:5004',
        'facility-service': process.env.FACILITY_SERVICE_URL || 'http://localhost:5001',
        'fhir-service': process.env.FHIR_SERVICE_URL || 'http://localhost:6001',
        'hl7-service': process.env.HL7_SERVICE_URL || 'http://localhost:6002'
    };
    const services = options?.services || defaultServices;
    // Register all services
    Object.entries(services).forEach(([name, url]) => {
        registry.register(name, url);
    });
    // Auto-start health checks if requested
    if (options?.autoStart !== false) {
        registry.startHealthChecks();
    }
    return registry;
}
exports.default = ServiceRegistry;
