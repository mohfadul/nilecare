import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { logger } from './logger';

/**
 * Database Connection Manager
 * Manages PostgreSQL (with transaction support) and Redis connections
 */

// PostgreSQL Connection Pool
let pgPool: Pool | null = null;

export function initializePostgreSQL(): Pool {
  if (pgPool) {
    return pgPool;
  }

  pgPool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'nilecare',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pgPool.on('connect', () => {
    logger.info('PostgreSQL client connected');
  });

  pgPool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL error', { error: err.message });
  });

  logger.info('PostgreSQL connection pool initialized');
  return pgPool;
}

export function getPostgreSQLPool(): Pool {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call initializePostgreSQL() first.');
  }
  return pgPool;
}

/**
 * Execute query with transaction support
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
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

// Redis Connection
let redisClient: Redis | null = null;

export function initializeRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  logger.info('Redis connection initialized');
  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis not connected. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Initialize all databases
 */
export async function initializeDatabases(): Promise<void> {
  try {
    logger.info('Initializing databases...');

    // Initialize PostgreSQL
    initializePostgreSQL();

    // Initialize Redis
    initializeRedis();

    logger.info('All databases initialized successfully');
  } catch (error: any) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
}

/**
 * Health check for all databases
 */
export async function checkDatabaseHealth(): Promise<{
  postgresql: boolean;
  redis: boolean;
  allHealthy: boolean;
}> {
  const health = {
    postgresql: false,
    redis: false,
    allHealthy: false,
  };

  // Check PostgreSQL
  try {
    if (pgPool) {
      await pgPool.query('SELECT 1');
      health.postgresql = true;
    }
  } catch (error: any) {
    logger.error('PostgreSQL health check failed', { error: error.message });
  }

  // Check Redis
  try {
    if (redisClient) {
      await redisClient.ping();
      health.redis = true;
    }
  } catch (error: any) {
    logger.error('Redis health check failed', { error: error.message });
  }

  health.allHealthy = health.postgresql && health.redis;

  return health;
}

/**
 * Graceful shutdown of all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  logger.info('Closing database connections...');

  // Close PostgreSQL
  if (pgPool) {
    try {
      await pgPool.end();
      logger.info('PostgreSQL connection pool closed');
    } catch (error: any) {
      logger.error('Error closing PostgreSQL pool', { error: error.message });
    }
    pgPool = null;
  }

  // Close Redis
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error: any) {
      logger.error('Error closing Redis connection', { error: error.message });
    }
    redisClient = null;
  }

  logger.info('All database connections closed');
}

export default {
  initializePostgreSQL,
  getPostgreSQLPool,
  withTransaction,
  initializeRedis,
  getRedisClient,
  initializeDatabases,
  checkDatabaseHealth,
  closeDatabaseConnections,
};

