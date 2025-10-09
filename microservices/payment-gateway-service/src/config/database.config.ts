/**
 * Database Configuration
 * MySQL connection configuration for payment system
 */

import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { config } from 'dotenv';

config();

export class DatabaseConfig {
  private static instance: DatabaseConfig;
  private pool: Pool;

  private constructor() {
    this.pool = createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'nilecare_payment_system',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectionLimit: parseInt(process.env.DB_CONNECTION_POOL_MAX || '100'),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
      timezone: '+02:00', // Africa/Khartoum (UTC+2)
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: false,
      multipleStatements: false, // Security: Prevent SQL injection via multiple statements
      namedPlaceholders: true
    });

    // Test connection on startup
    this.testConnection();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  /**
   * Get database connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Get a connection from the pool
   */
  public async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

  /**
   * Execute query with automatic connection management
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T;
    } finally {
      connection.release();
    }
  }

  /**
   * Execute query within a transaction
   */
  public async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      console.log('✅ Database connection established successfully');
      
      // Test query
      await connection.execute('SELECT 1');
      console.log('✅ Database query test successful');
      
      connection.release();
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connections closed');
  }

  /**
   * Get pool statistics
   */
  public getPoolStats() {
    return {
      totalConnections: this.pool.pool.config.connectionLimit,
      // Additional pool stats would come from pool monitoring
    };
  }
}

// Export singleton instance
export default DatabaseConfig.getInstance();

