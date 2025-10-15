import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'nilecare_business',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Create connection pool
export const createDbPool = () => {
  const pool = mysql.createPool(dbConfig);

  // Test connection
  pool.getConnection()
    .then(connection => {
      logger.info('✅ MySQL database connected successfully');
      connection.release();
    })
    .catch(err => {
      logger.error('❌ MySQL connection failed:', err.message);
    });

  return pool;
};

// Pool instance (will be initialized in index.ts)
let dbPool: mysql.Pool;

export const getDbPool = () => {
  if (!dbPool) {
    dbPool = createDbPool();
  }
  return dbPool;
};

export const closeDbPool = async () => {
  if (dbPool) {
    await dbPool.end();
    logger.info('✅ Database pool closed');
  }
};

