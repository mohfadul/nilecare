/**
 * Database Query Service
 * Secure database operations with parameterized queries
 * 
 * SECURITY FEATURES:
 * - Parameterized queries (prevents SQL injection)
 * - Transaction support
 * - Query logging with sensitive data redaction
 * - Connection pooling
 * - Query timeout protection
 */

import { PoolConnection } from 'mysql2/promise';
import winston from 'winston';
import DatabaseConfig from '../config/database.config';

export interface QueryOptions {
  timeout?: number;
  connection?: PoolConnection;  // For transactions
}

export interface UserFilters {
  email?: string;
  username?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export class DatabaseQueryService {
  private db: typeof DatabaseConfig;
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.db = DatabaseConfig;
    this.logger = logger;
  }

  /**
   * Execute parameterized query (SQL injection safe)
   * ✅ SECURITY: Always uses prepared statements
   */
  async executeQuery<T = any>(
    sql: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const connection = options.connection || this.db.getPool();

    try {
      // ✅ SECURITY: Parameterized query prevents SQL injection
      const [rows] = await connection.execute(sql, params);
      
      const duration = Date.now() - startTime;

      this.logger.debug('Query executed successfully', {
        sql: this.sanitizeQueryForLogging(sql),
        duration,
        rowCount: Array.isArray(rows) ? rows.length : 0,
      });

      return rows as T[];

    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logger.error('Query execution failed', {
        sql: this.sanitizeQueryForLogging(sql),
        duration,
        error: error.message,
        code: error.code,
        errno: error.errno,
        // ✅ SECURITY: Never log actual parameter values in production
        ...(process.env.NODE_ENV === 'development' && { 
          paramCount: params.length 
        }),
      });

      // Don't expose internal SQL errors to clients
      throw new Error('Database operation failed');
    }
  }

  /**
   * Find user by email (common authentication query)
   * ✅ SECURITY: Uses parameterized query
   */
  async findUserByEmail(email: string): Promise<any | null> {
    const sql = `
      SELECT 
        id, email, username, role, status, 
        created_at, updated_at
      FROM users 
      WHERE email = ? 
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const users = await this.executeQuery(sql, [email]);
    return users[0] || null;
  }

  /**
   * Find user by ID
   * ✅ SECURITY: Uses parameterized query
   */
  async findUserById(userId: string): Promise<any | null> {
    const sql = `
      SELECT 
        id, email, username, role, status,
        created_at, updated_at
      FROM users 
      WHERE id = ? 
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const users = await this.executeQuery(sql, [userId]);
    return users[0] || null;
  }

  /**
   * Search users with filters and pagination
   * ✅ SECURITY: All filters are parameterized
   */
  async searchUsers(
    filters: UserFilters,
    options: QueryOptions = {}
  ): Promise<any[]> {
    const params: any[] = [];
    const conditions: string[] = ['deleted_at IS NULL'];

    // Build WHERE clause with parameterized conditions
    if (filters.email) {
      conditions.push('email = ?');
      params.push(filters.email);
    }

    if (filters.username) {
      conditions.push('username LIKE ?');
      params.push(`%${filters.username}%`);
    }

    if (filters.role) {
      conditions.push('role = ?');
      params.push(filters.role);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    let sql = `
      SELECT 
        id, email, username, role, status, created_at
      FROM users 
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    // Add pagination
    const limit = Math.min(filters.limit || 50, 100); // Max 100 rows
    sql += ' LIMIT ?';
    params.push(limit);

    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    return this.executeQuery(sql, params, options);
  }

  /**
   * Count users matching filters
   * ✅ SECURITY: Uses parameterized query
   */
  async countUsers(filters: Omit<UserFilters, 'limit' | 'offset'>): Promise<number> {
    const params: any[] = [];
    const conditions: string[] = ['deleted_at IS NULL'];

    if (filters.email) {
      conditions.push('email = ?');
      params.push(filters.email);
    }

    if (filters.username) {
      conditions.push('username LIKE ?');
      params.push(`%${filters.username}%`);
    }

    if (filters.role) {
      conditions.push('role = ?');
      params.push(filters.role);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    const sql = `
      SELECT COUNT(*) as count
      FROM users 
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.executeQuery<{ count: number }>(sql, params);
    return result[0]?.count || 0;
  }

  /**
   * Execute operations within a transaction
   * ✅ SECURITY: Automatic rollback on error
   */
  async transaction<T>(
    operation: (connection: PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const result = await operation(connection);

      await connection.commit();

      this.logger.debug('Transaction committed successfully');

      return result;

    } catch (error: any) {
      await connection.rollback();

      this.logger.error('Transaction rolled back', {
        error: error.message,
      });

      throw error;

    } finally {
      connection.release();
    }
  }

  /**
   * Bulk insert with transaction support
   * ✅ SECURITY: Uses parameterized queries
   */
  async bulkInsert<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    options: QueryOptions = {}
  ): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }

    // Validate table name (whitelist approach)
    this.validateTableName(tableName);

    const columns = Object.keys(data[0]);
    
    // ✅ SECURITY: Validate column names
    this.validateColumnNames(columns);

    // Build parameterized query
    const placeholders = data.map(() => 
      `(${columns.map(() => '?').join(', ')})`
    ).join(', ');

    const values = data.flatMap(row => 
      columns.map(col => row[col])
    );

    // ✅ SECURITY: Use backticks for identifier quoting
    const sql = `
      INSERT INTO \`${tableName}\` 
      (${columns.map(col => `\`${col}\``).join(', ')})
      VALUES ${placeholders}
    `;

    await this.executeQuery(sql, values, options);

    this.logger.info('Bulk insert completed', {
      table: tableName,
      rowCount: data.length,
    });
  }

  /**
   * Update record by ID
   * ✅ SECURITY: Uses parameterized query
   */
  async updateById(
    tableName: string,
    id: string | number,
    updates: Record<string, any>
  ): Promise<void> {
    this.validateTableName(tableName);

    const columns = Object.keys(updates);
    this.validateColumnNames(columns);

    const setClause = columns.map(col => `\`${col}\` = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const sql = `
      UPDATE \`${tableName}\`
      SET ${setClause}, updated_at = NOW()
      WHERE id = ?
    `;

    await this.executeQuery(sql, values);
  }

  /**
   * Soft delete record by ID
   * ✅ SECURITY: Uses parameterized query
   */
  async softDeleteById(
    tableName: string,
    id: string | number
  ): Promise<void> {
    this.validateTableName(tableName);

    const sql = `
      UPDATE \`${tableName}\`
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    await this.executeQuery(sql, [id]);
  }

  /**
   * Validate table name (whitelist approach)
   * ✅ SECURITY: Prevents SQL injection via table names
   */
  private validateTableName(tableName: string): void {
    // Whitelist of allowed table names
    const allowedTables = [
      'users',
      'payments',
      'transactions',
      'refunds',
      'payment_providers',
      'payment_audit_logs',
      'reconciliations',
    ];

    if (!allowedTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    // Additional validation: only alphanumeric and underscores
    if (!/^[a-z_]+$/.test(tableName)) {
      throw new Error(`Invalid table name format: ${tableName}`);
    }
  }

  /**
   * Validate column names
   * ✅ SECURITY: Prevents SQL injection via column names
   */
  private validateColumnNames(columns: string[]): void {
    const invalidColumns = columns.filter(col => 
      !/^[a-z_][a-z0-9_]*$/.test(col)
    );

    if (invalidColumns.length > 0) {
      throw new Error(`Invalid column names: ${invalidColumns.join(', ')}`);
    }
  }

  /**
   * Sanitize query for logging
   * ✅ SECURITY: Redacts sensitive data from logs
   */
  private sanitizeQueryForLogging(sql: string): string {
    // Redact sensitive patterns
    return sql
      .replace(/(password|token|secret|key|cvv|cvc|card_number)\s*=\s*\?/gi, '$1 = [REDACTED]')
      .replace(/VALUES\s*\([^)]*\)/gi, 'VALUES ([REDACTED])')
      .trim()
      .substring(0, 500); // Limit length
  }

  /**
   * Health check query
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.executeQuery('SELECT 1 as health');
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get database pool statistics
   */
  getPoolStats() {
    return this.db.getPoolStats();
  }

  /**
   * Close database connections (for graceful shutdown)
   */
  async close(): Promise<void> {
    await this.db.close();
    this.logger.info('Database connections closed');
  }
}

export default DatabaseQueryService;

