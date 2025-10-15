/**
 * Service Starter Utility
 *
 * Provides standardized service initialization with proper health checks,
 * environment validation, and graceful shutdown
 */
import { Express } from 'express';
export interface ServiceConfig {
    name: string;
    version: string;
    port: number;
    healthChecks: {
        liveness: {
            enabled: boolean;
            path?: string;
            features?: Record<string, boolean>;
        };
        readiness: {
            enabled: boolean;
            path?: string;
            checkFn?: () => Promise<any>;
        };
        startup: {
            enabled: boolean;
            path?: string;
            isInitializedFn?: () => boolean;
        };
    };
}
export declare class ServiceStarter {
    private app;
    private config;
    private server;
    private isInitialized;
    private startTime;
    constructor(app: Express, config: ServiceConfig);
    /**
     * Setup health check endpoints
     */
    setupHealthChecks(): void;
    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown(cleanupFn?: () => Promise<void>): void;
    /**
     * Start the service
     */
    start(): void;
    /**
     * Get initialization status
     */
    isServiceInitialized(): boolean;
    /**
     * Get uptime in seconds
     */
    getUptime(): number;
}
/**
 * Create and start a service with proper configuration
 */
export declare function startService(app: Express, config: ServiceConfig, cleanupFn?: () => Promise<void>): Promise<ServiceStarter>;
//# sourceMappingURL=service-starter.d.ts.map