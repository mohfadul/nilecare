import { Pool, PoolClient, QueryResult } from 'pg';
import Redis from 'ioredis';
import { logger } from './logger';

/**
 * Database Utility for Facility Service
 * PostgreSQL connection pool + Redis client
 */

// PostgreSQL connection pool
let pgPool: Pool | null = null;

/**
 * Get PostgreSQL connection pool
 */
export function getPostgreSQLPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'nilecare',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      max: parseInt(process.env.PG_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '10000'),
    });

    pgPool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error', { error: err.message, stack: err.stack });
    });

    logger.info('PostgreSQL connection pool initialized');
  }

  return pgPool;
}

// Redis client
let redisClient: Redis | null = null;

/**
 * Get Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });
  }

  return redisClient;
}

/**
 * Execute database query with transaction support
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPostgreSQLPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connections
 */
export async function testDatabaseConnections(): Promise<{
  postgres: boolean;
  redis: boolean;
}> {
  const results = {
    postgres: false,
    redis: false,
  };

  // Test PostgreSQL
  try {
    const pool = getPostgreSQLPool();
    await pool.query('SELECT 1');
    results.postgres = true;
    logger.info('PostgreSQL connection test passed');
  } catch (error: any) {
    logger.error('PostgreSQL connection test failed', { error: error.message });
  }

  // Test Redis
  try {
    const redis = getRedisClient();
    await redis.ping();
    results.redis = true;
    logger.info('Redis connection test passed');
  } catch (error: any) {
    logger.error('Redis connection test failed', { error: error.message });
  }

  return results;
}

/**
 * Close all database connections gracefully
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL connection pool closed');
    }

    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client closed');
    }
  } catch (error: any) {
    logger.error('Error closing database connections', { error: error.message });
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    const redis = getRedisClient();
    return redis.get(key);
  },

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient();
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(key);
  },

  /**
   * Get cached object (JSON)
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Set cached object (JSON)
   */
  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  },

  /**
   * Clear keys by pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export default {
  getPostgreSQLPool,
  getRedisClient,
  withTransaction,
  testDatabaseConnections,
  closeDatabaseConnections,
  cache,
};

