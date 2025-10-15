import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { logger } from './logger';

let pgPool: Pool | null = null;
let redisClient: Redis | null = null;

export function getPostgreSQLPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'nilecare',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pgPool.on('error', (err) => {
      logger.error('PostgreSQL pool error', { error: err.message });
    });

    logger.info('PostgreSQL pool initialized');
  }

  return pgPool;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 2, // Different DB for HL7 service
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  return redisClient;
}

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

export async function closeDatabaseConnections(): Promise<void> {
  try {
    if (pgPool) {
      await pgPool.end();
      logger.info('PostgreSQL pool closed');
    }

    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client closed');
    }
  } catch (error: any) {
    logger.error('Error closing connections', { error: error.message });
  }
}

export const cache = {
  async get(key: string): Promise<string | null> {
    return getRedisClient().get(key);
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const redis = getRedisClient();
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await getRedisClient().del(key);
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  },

  async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  },
};

export default {
  getPostgreSQLPool,
  getRedisClient,
  withTransaction,
  closeDatabaseConnections,
  cache,
};

