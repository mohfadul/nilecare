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
export async function checkPostgreSQLConnection(pool: Pool): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    await pool.query('SELECT 1');
    return {
      healthy: true,
      latency: Date.now() - startTime,
    };
  } catch (error: unknown) {
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
export async function checkMongoDBConnection(connection: Connection): Promise<HealthCheckResult> {
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
  } catch (error: unknown) {
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
export async function checkRedisConnection(redis: Redis): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    await redis.ping();
    return {
      healthy: true,
      latency: Date.now() - startTime,
    };
  } catch (error: unknown) {
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
export async function checkKafkaConnection(kafka: Kafka): Promise<HealthCheckResult> {
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
  } catch (error: unknown) {
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
export function generateHealthStatus(
  checks: {
    database?: HealthCheckResult;
    redis?: HealthCheckResult;
    kafka?: HealthCheckResult;
    external?: HealthCheckResult;
  },
  startTime: number
): ServiceHealth {
  const allChecks = Object.values(checks).filter(c => c !== undefined);
  const healthyCount = allChecks.filter(c => c.healthy).length;
  const totalCount = allChecks.length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  
  if (healthyCount === totalCount) {
    status = 'healthy';
  } else if (healthyCount > 0) {
    status = 'degraded';
  } else {
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
export function createLivenessHandler(
  serviceName: string,
  version: string = '1.0.0',
  features?: Record<string, boolean>
) {
  return (req: any, res: any) => {
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
export function createReadinessHandler(
  healthCheckFn: () => Promise<ServiceHealth>
) {
  return async (req: any, res: any) => {
    try {
      const health = await healthCheckFn();
      
      if (health.status === 'healthy') {
        res.status(200).json(health);
      } else {
        res.status(503).json(health);
      }
    } catch (error: unknown) {
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
export function createStartupHandler(isInitializedFn: () => boolean) {
  return (req: any, res: any) => {
    if (isInitializedFn()) {
      res.status(200).json({
        status: 'started',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'starting',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

