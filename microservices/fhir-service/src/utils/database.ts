import { Pool, PoolClient } from 'pg';
import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis';
import { logger } from './logger';

/**
 * Database Utility for FHIR Service
 * PostgreSQL (FHIR resources) + MongoDB (documents) + Redis (cache)
 */

let pgPool: Pool | null = null;
let mongoClient: MongoClient | null = null;
let mongoDB: Db | null = null;
let redisClient: Redis | null = null;

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
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pgPool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error', { error: err.message });
    });

    logger.info('PostgreSQL connection pool initialized');
  }

  return pgPool;
}

/**
 * Get MongoDB database
 */
export async function getMongoDatabase(): Promise<Db> {
  if (!mongoDB) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nilecare';
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDB = mongoClient.db();
    logger.info('MongoDB connected');
  }

  return mongoDB;
}

/**
 * Get Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '1'),
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
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
  mongodb: boolean;
  redis: boolean;
}> {
  const results = { postgres: false, mongodb: false, redis: false };

  try {
    const pool = getPostgreSQLPool();
    await pool.query('SELECT 1');
    results.postgres = true;
    logger.info('PostgreSQL connection test passed');
  } catch (error: any) {
    logger.error('PostgreSQL connection test failed', { error: error.message });
  }

  try {
    const db = await getMongoDatabase();
    await db.admin().ping();
    results.mongodb = true;
    logger.info('MongoDB connection test passed');
  } catch (error: any) {
    logger.error('MongoDB connection test failed', { error: error.message });
  }

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

    if (mongoClient) {
      await mongoClient.close();
      logger.info('MongoDB client closed');
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
  async get(key: string): Promise<string | null> {
    const redis = getRedisClient();
    return redis.get(key);
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const redis = getRedisClient();
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, value);
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(key);
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  },

  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  },

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
  getMongoDatabase,
  getRedisClient,
  withTransaction,
  testDatabaseConnections,
  closeDatabaseConnections,
  cache,
};

