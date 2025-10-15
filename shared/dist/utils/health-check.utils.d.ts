/**
 * Health Check Utilities
 *
 * Provides standardized health check implementations for all microservices
 */
import { Pool } from 'pg';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { Kafka } from 'kafkajs';
export interface HealthCheckResult {
    healthy: boolean;
    message?: string;
    latency?: number;
}
export interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        database?: HealthCheckResult;
        redis?: HealthCheckResult;
        kafka?: HealthCheckResult;
        external?: HealthCheckResult;
    };
    timestamp: string;
    uptime: number;
}
/**
 * Check PostgreSQL database connection
 */
export declare function checkPostgreSQLConnection(pool: Pool): Promise<HealthCheckResult>;
/**
 * Check MongoDB connection
 */
export declare function checkMongoDBConnection(connection: Connection): Promise<HealthCheckResult>;
/**
 * Check Redis connection
 */
export declare function checkRedisConnection(redis: Redis): Promise<HealthCheckResult>;
/**
 * Check Kafka connection
 */
export declare function checkKafkaConnection(kafka: Kafka): Promise<HealthCheckResult>;
/**
 * Generate complete service health status
 */
export declare function generateHealthStatus(checks: {
    database?: HealthCheckResult;
    redis?: HealthCheckResult;
    kafka?: HealthCheckResult;
    external?: HealthCheckResult;
}, startTime: number): ServiceHealth;
/**
 * Create standard liveness endpoint handler
 */
export declare function createLivenessHandler(serviceName: string, version?: string, features?: Record<string, boolean>): (req: any, res: any) => void;
/**
 * Create readiness endpoint handler
 */
export declare function createReadinessHandler(healthCheckFn: () => Promise<ServiceHealth>): (req: any, res: any) => Promise<void>;
/**
 * Create startup endpoint handler
 */
export declare function createStartupHandler(isInitializedFn: () => boolean): (req: any, res: any) => void;
//# sourceMappingURL=health-check.utils.d.ts.map