/**
 * Service Registry
 * Centralized registry for all microservices
 */
import winston from 'winston';
export interface ServiceDefinition {
    name: string;
    url: string;
    port: number;
    healthEndpoint: string;
    version: string;
    description: string;
    dependencies?: string[];
}
export interface ServiceHealthStatus {
    name: string;
    url: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTime?: number;
    lastCheck: Date;
    uptime?: number;
    version?: string;
    error?: string;
}
export declare class ServiceRegistry {
    private services;
    private healthCache;
    private logger;
    private checkInterval;
    constructor(logger: winston.Logger);
    /**
     * Initialize service definitions
     */
    private initializeServices;
    /**
     * Register a new service
     */
    register(service: ServiceDefinition): void;
    /**
     * Unregister a service
     */
    unregister(serviceName: string): void;
    /**
     * Get service by name
     */
    getService(name: string): ServiceDefinition | undefined;
    /**
     * Get all registered services
     */
    getAllServices(): ServiceDefinition[];
    /**
     * Check health of a single service
     */
    checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus>;
    /**
     * Check health of all services
     */
    checkAllServicesHealth(): Promise<ServiceHealthStatus[]>;
    /**
     * Get cached health status
     */
    getCachedHealth(serviceName: string): ServiceHealthStatus | undefined;
    /**
     * Get all cached health statuses
     */
    getAllCachedHealth(): ServiceHealthStatus[];
    /**
     * Start periodic health checks
     */
    startHealthChecks(intervalMs?: number): void;
    /**
     * Stop periodic health checks
     */
    stopHealthChecks(): void;
    /**
     * Get service discovery information
     */
    getServiceDiscovery(): {
        totalServices: number;
        healthyServices: number;
        unhealthyServices: number;
        unknownServices: number;
        services: ServiceHealthStatus[];
    };
    /**
     * Get service URL by name
     */
    getServiceUrl(serviceName: string): string | null;
    /**
     * Check if service is available
     */
    isServiceAvailable(serviceName: string): boolean;
    /**
     * Get service dependencies
     */
    getServiceDependencies(serviceName: string): string[];
    /**
     * Validate service dependencies
     */
    validateDependencies(serviceName: string): Promise<{
        valid: boolean;
        missingDependencies: string[];
    }>;
}
export declare function createServiceRegistry(logger: winston.Logger): ServiceRegistry;
export declare function getServiceRegistry(): ServiceRegistry;
//# sourceMappingURL=service-registry.d.ts.map