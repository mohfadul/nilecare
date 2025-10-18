/**
 * Shared Database Connection Utility
 * Provides standardized MySQL connection pooling for all microservices
 */

import mysql from 'mysql2/promise';

/**
 * Database connection configuration from environment
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'nilecare',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
}

/**
 * Create MySQL connection pool
 */
export function createConnectionPool(config?: Partial<DatabaseConfig>) {
  const dbConfig = { ...getDatabaseConfig(), ...config };

  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  return pool;
}

/**
 * Test database connection
 * @param pool - MySQL connection pool
 * @returns Promise<boolean> - true if connection successful
 */
export async function testConnection(pool: mysql.Pool): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Connect to database with retry logic
 * @param retries - Number of retry attempts (default: 5)
 * @param delay - Delay between retries in ms (default: 5000)
 */
export async function connectDatabase(retries: number = 5, delay: number = 5000) {
  const pool = createConnectionPool();

  for (let attempt = 1; attempt <= retries; attempt++) {
    const success = await testConnection(pool);
    
    if (success) {
      console.log(`✅ Connected to database on attempt ${attempt}`);
      return pool;
    }

    if (attempt < retries) {
      console.log(`⚠️  Connection attempt ${attempt} failed. Retrying in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to connect to database after ${retries} attempts`);
}

/**
 * Execute a query with error handling
 */
export async function query<T = any>(
  pool: mysql.Pool,
  sql: string,
  params?: any[]
): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Close database connection pool
 */
export async function closeConnection(pool: mysql.Pool): Promise<void> {
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error: any) {
    console.error('❌ Error closing database connection:', error.message);
  }
}

// Export default connection pool factory
export default {
  createConnectionPool,
  connectDatabase,
  testConnection,
  query,
  closeConnection
};

