/**
 * EHR Service - Database Utility
 * 
 * Multi-database support for clinical documentation:
 * - PostgreSQL: Structured EHR data (SOAP notes, problem lists)
 * - MongoDB: Document storage (attachments, images)
 * - S3/MinIO: File storage (PDFs, images, scans)
 * 
 * Reference: Clinical Service database patterns
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import mongoose, { Connection } from 'mongoose';
import { logger } from './logger';

/**
 * PostgreSQL Connection Pool
 * Primary database for structured EHR data
 */
class PostgreSQLDatabase {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ehr_service',
      user: process.env.DB_USER || 'ehr_user',
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

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      connected: this.isConnected
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    logger.info('PostgreSQL connection pool closed');
  }
}

/**
 * MongoDB Connection
 * For document storage and unstructured clinical data
 */
class MongoDatabase {
  private connection: Connection | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ehr_documents';

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
      // Don't throw - MongoDB is optional for core functionality
      this.isConnected = false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.connection) {
        await this.connect();
      }
      if (this.connection) {
        await this.connection.db.admin().ping();
        logger.info('MongoDB connection test successful');
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error('MongoDB connection test failed:', error);
      return false;
    }
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  isHealthy(): boolean {
    return this.isConnected && this.connection !== null;
  }

  async close(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    }
  }
}

// Export singleton instances
export const db = new PostgreSQLDatabase();
export const mongodb = new MongoDatabase();

/**
 * Initialize all databases
 */
export async function initializeDatabases(): Promise<{
  postgresql: boolean;
  mongodb: boolean;
}> {
  logger.info('🔌 Initializing databases...');

  const results = {
    postgresql: await db.testConnection(),
    mongodb: await mongodb.testConnection()
  };

  if (results.postgresql) {
    logger.info('✅ All required databases connected');
  } else {
    logger.error('⚠️  PostgreSQL connection failed - service will not function properly');
  }

  if (!results.mongodb) {
    logger.warn('⚠️  MongoDB not connected - document storage features limited');
  }

  return results;
}

/**
 * Close all database connections
 */
export async function closeDatabases(): Promise<void> {
  logger.info('🧹 Closing database connections...');

  await Promise.all([
    db.close(),
    mongodb.close()
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
  };
}> {
  const pgStats = db.getStats();
  const mongoHealthy = mongodb.isHealthy();

  const allHealthy = pgStats.connected; // PostgreSQL is required

  return {
    healthy: allHealthy,
    databases: {
      postgresql: {
        healthy: pgStats.connected,
        stats: pgStats
      },
      mongodb: {
        healthy: mongoHealthy
      }
    }
  };
}

export default { db, mongodb, initializeDatabases, closeDatabases, healthCheck };

