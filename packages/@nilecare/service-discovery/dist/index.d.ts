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
export interface ServiceConfig {
    name: string;
    url: string;
    healthy: boolean;
    lastCheck: Date;
    failureCount: number;
    lastError?: string;
}
export interface HealthCheckConfig {
    path?: string;
    timeout?: number;
    interval?: number;
    maxFailures?: number;
}
export declare class ServiceRegistry {
    private services;
    private healthCheckInterval;
    private healthConfig;
    constructor(healthConfig?: HealthCheckConfig);
    /**
     * Register a service in the registry
     */
    register(name: string, url: string): void;
    /**
     * Unregister a service
     */
    unregister(name: string): boolean;
    /**
     * Get service URL if healthy, null otherwise
     */
    getServiceUrl(name: string): Promise<string | null>;
    /**
     * Get service URL without health check (use cached status)
     */
    getServiceUrlSync(name: string): string | null;
    /**
     * Check health of a specific service
     */
    checkHealth(name: string): Promise<boolean>;
    /**
     * Start periodic health checks for all services
     */
    startHealthChecks(): void;
    /**
     * Stop periodic health checks
     */
    stopHealthChecks(): void;
    /**
     * Check health of all registered services
     */
    private checkAllServices;
    /**
     * Get status of all services
     */
    getStatus(): Record<string, Omit<ServiceConfig, 'name'>>;
    /**
     * Get only healthy services
     */
    getHealthyServices(): string[];
    /**
     * Get only unhealthy services
     */
    getUnhealthyServices(): string[];
    /**
     * Check if a service is healthy (cached status)
     */
    isHealthy(name: string): boolean;
    /**
     * Get count of registered services
     */
    getServiceCount(): number;
    /**
     * Clear all services
     */
    clear(): void;
}
/**
 * Create a pre-configured service registry with common NileCare services
 */
export declare function createNileCareRegistry(options?: {
    services?: Record<string, string>;
    autoStart?: boolean;
    healthConfig?: HealthCheckConfig;
}): ServiceRegistry;
export default ServiceRegistry;
