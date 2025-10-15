/**
 * Clinical Decision Support Service - Database Utility
 * 
 * Multi-database support:
 * - PostgreSQL: Structured data (drug interactions, dosing guidelines)
 * - MongoDB: Unstructured data (clinical guidelines, ML models)
 * - Redis: Caching for frequently accessed data
 * 
 * Reference: OpenEMR database patterns
 * @see https://github.com/mohfadul/openemr-nilecare
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import mongoose, { Connection } from 'mongoose';
import Redis from 'ioredis';
import { logger } from './logger';

/**
 * PostgreSQL Connection Pool
 * Used for structured clinical data: drug interactions, therapeutic ranges, etc.
 */
class PostgreSQLDatabase {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cds_service',
      user: process.env.DB_USER || 'cds_user',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error:', err);
      this.isConnected = false;
    });

    this.pool.on('connect', () => {
      if (!this.isConnected) {
        logger.info('✅ PostgreSQL connection pool established');
        this.isConnected = true;
      }
    });
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time');
      logger.info('PostgreSQL connection test successful', { 
        currentTime: result.rows[0].current_time 
      });
      this.isConnected = true;
      return true;
    } catch (error: any) {
      logger.error('PostgreSQL connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute query
   */
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn('Slow query detected', { 
          query: text.substring(0, 100), 
          duration,
          rows: result.rowCount 
        });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Database query error:', { 
        error: error.message,
        query: text.substring(0, 100)
      });
      throw error;
    }
  }

  /**
   * Get a client from the pool (for transactions)
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Get pool stats
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      connected: this.isConnected
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    logger.info('PostgreSQL connection pool closed');
  }
}

/**
 * MongoDB Connection
 * Used for unstructured clinical data: guidelines, knowledge base, ML models
 */
class MongoDatabase {
  private connection: Connection | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cds_service';
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000
      });

      this.connection = mongoose.connection;
      this.isConnected = true;

      this.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      this.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      logger.info('✅ MongoDB connected successfully');
    } catch (error: any) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Test MongoDB connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        await this.connect();
      }
      await this.connection!.db.admin().ping();
      logger.info('MongoDB connection test successful');
      return true;
    } catch (error: any) {
      logger.error('MongoDB connection test failed:', error);
      return false;
    }
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection | null {
    return this.connection;
  }

  /**
   * Check if connected
   */
  isHealthy(): boolean {
    return this.isConnected && this.connection !== null;
  }

  /**
   * Close MongoDB connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    }
  }
}

/**
 * Redis Cache
 * Used for caching frequently accessed data (drug interactions, guidelines)
 */
class RedisCache {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 3
    });

    this.client.on('connect', () => {
      if (!this.isConnected) {
        logger.info('✅ Redis connected');
        this.isConnected = true;
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Test Redis connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.ping();
      logger.info('Redis connection test successful');
      return true;
    } catch (error: any) {
      logger.error('Redis connection test failed:', error);
      return false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: any) {
      logger.error('Redis GET error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error: any) {
      logger.error('Redis SET error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error: any) {
      logger.error('Redis DEL error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Cache drug interaction check result
   */
  async cacheInteractionCheck(
    medicationIds: string[], 
    result: any, 
    ttl: number = 3600
  ): Promise<void> {
    const key = `interaction:${medicationIds.sort().join('-')}`;
    await this.set(key, JSON.stringify(result), ttl);
  }

  /**
   * Get cached interaction check
   */
  async getCachedInteractionCheck(medicationIds: string[]): Promise<any | null> {
    const key = `interaction:${medicationIds.sort().join('-')}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Check if Redis is healthy
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
    logger.info('Redis connection closed');
  }
}

// Export singleton instances
export const db = new PostgreSQLDatabase();
export const mongodb = new MongoDatabase();
export const cache = new RedisCache();

/**
 * Initialize all database connections
 */
export async function initializeDatabases(): Promise<{
  postgresql: boolean;
  mongodb: boolean;
  redis: boolean;
}> {
  logger.info('🔌 Initializing database connections...');

  const results = {
    postgresql: await db.testConnection(),
    mongodb: await mongodb.testConnection(),
    redis: await cache.testConnection()
  };

  const allConnected = results.postgresql && results.mongodb && results.redis;
  
  if (allConnected) {
    logger.info('✅ All databases connected successfully');
  } else {
    logger.error('⚠️ Some database connections failed:', results);
  }

  return results;
}

/**
 * Close all database connections gracefully
 */
export async function closeDatabases(): Promise<void> {
  logger.info('🧹 Closing database connections...');
  
  await Promise.all([
    db.close(),
    mongodb.close(),
    cache.close()
  ]);

  logger.info('✅ All database connections closed');
}

/**
 * Health check for all databases
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  databases: {
    postgresql: { healthy: boolean; stats?: any };
    mongodb: { healthy: boolean };
    redis: { healthy: boolean };
  };
}> {
  const pgStats = db.getStats();
  const mongoHealthy = mongodb.isHealthy();
  const redisHealthy = cache.isHealthy();

  const allHealthy = pgStats.connected && mongoHealthy && redisHealthy;

  return {
    healthy: allHealthy,
    databases: {
      postgresql: {
        healthy: pgStats.connected,
        stats: pgStats
      },
      mongodb: {
        healthy: mongoHealthy
      },
      redis: {
        healthy: redisHealthy
      }
    }
  };
}

export default { db, mongodb, cache, initializeDatabases, closeDatabases, healthCheck };

