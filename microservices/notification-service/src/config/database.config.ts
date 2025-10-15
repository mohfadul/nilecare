/**
 * Database Configuration
 * PostgreSQL/MySQL connection pool management
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger';
import SecretsConfig from './secrets.config';

let pool: Pool | null = null;

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const config = SecretsConfig.getDatabaseConfig();
    
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.min,
      max: config.max,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message, stack: err.stack });
    });

    pool.on('connect', () => {
      logger.debug('New database connection established');
    });

    logger.info('✅ Database pool initialized', {
      host: config.host,
      database: config.database,
      port: config.port,
    });
  }

  return pool;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const dbPool = getPool();
    const result = await dbPool.query('SELECT NOW()');
    logger.info('✅ Database connection test successful', { 
      timestamp: result.rows[0].now 
    });
    return true;
  } catch (error: any) {
    logger.error('❌ Database connection test failed', { 
      error: error.message,
      stack: error.stack 
    });
    return false;
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

/**
 * Get database pool instance (singleton)
 */
export const dbPool = getPool();

export default {
  getPool,
  testConnection,
  closePool,
  dbPool,
};

