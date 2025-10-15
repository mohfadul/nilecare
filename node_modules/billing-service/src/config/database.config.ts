/**
 * Database Configuration
 * MySQL connection configuration for billing service
 * 
 * IMPORTANT: Uses SHARED 'nilecare' database with other services
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
      database: process.env.DB_NAME || 'nilecare', // SHARED DATABASE
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectionLimit: parseInt(process.env.DB_CONNECTION_POOL_MAX || '20'),
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
      timezone: '+02:00', // Africa/Khartoum (UTC+2)
      supportBigNumbers: true,
      bigNumberStrings: false,
      dateStrings: false,
      multipleStatements: false, // Security: Prevent SQL injection
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
      
      // Verify billing tables exist
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME IN (
            'invoices', 'invoice_line_items', 'billing_accounts',
            'insurance_claims', 'billing_audit_log'
          )
      `, [process.env.DB_NAME || 'nilecare']);
      
      const tableNames = (tables as any[]).map(t => t.TABLE_NAME);
      console.log(`✅ Found ${tableNames.length} billing tables:`, tableNames.join(', '));
      
      connection.release();
    } catch (error: any) {
      console.error('❌ Database connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Verify schema (check if all required tables exist)
   */
  public async verifySchema(): Promise<boolean> {
    try {
      const requiredTables = [
        'invoices',
        'invoice_line_items',
        'invoice_payment_allocations',
        'billing_accounts',
        'insurance_claims',
        'claim_line_items',
        'billing_adjustments',
        'billing_audit_log',
        'charge_master'
      ];

      const connection = await this.getConnection();
      
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [process.env.DB_NAME || 'nilecare']);
      
      connection.release();

      const existingTables = (tables as any[]).map(t => t.TABLE_NAME);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        console.warn('⚠️  Missing billing tables:', missingTables.join(', '));
        console.warn('⚠️  Run: mysql -u root -p nilecare < database/schema.sql');
        return false;
      }

      console.log('✅ All required billing tables exist');
      return true;

    } catch (error: any) {
      console.error('❌ Schema verification failed:', error.message);
      return false;
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
      connectionLimit: this.pool.pool.config.connectionLimit,
      // Additional pool stats from monitoring
    };
  }
}

// Export singleton instance
export default DatabaseConfig.getInstance();

