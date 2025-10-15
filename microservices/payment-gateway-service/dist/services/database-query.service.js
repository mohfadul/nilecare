"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseQueryService = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
class DatabaseQueryService {
    constructor(logger) {
        this.db = database_config_1.default;
        this.logger = logger;
    }
    /**
     * Execute parameterized query (SQL injection safe)
     * ✅ SECURITY: Always uses prepared statements
     */
    async executeQuery(sql, params = [], options = {}) {
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
            return rows;
        }
        catch (error) {
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
    async findUserByEmail(email) {
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
    async findUserById(userId) {
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
    async searchUsers(filters, options = {}) {
        const params = [];
        const conditions = ['deleted_at IS NULL'];
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
    async countUsers(filters) {
        const params = [];
        const conditions = ['deleted_at IS NULL'];
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
        const result = await this.executeQuery(sql, params);
        return result[0]?.count || 0;
    }
    /**
     * Execute operations within a transaction
     * ✅ SECURITY: Automatic rollback on error
     */
    async transaction(operation) {
        const connection = await this.db.getConnection();
        try {
            await connection.beginTransaction();
            const result = await operation(connection);
            await connection.commit();
            this.logger.debug('Transaction committed successfully');
            return result;
        }
        catch (error) {
            await connection.rollback();
            this.logger.error('Transaction rolled back', {
                error: error.message,
            });
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Bulk insert with transaction support
     * ✅ SECURITY: Uses parameterized queries
     */
    async bulkInsert(tableName, data, options = {}) {
        if (!data || data.length === 0) {
            return;
        }
        // Validate table name (whitelist approach)
        this.validateTableName(tableName);
        const columns = Object.keys(data[0]);
        // ✅ SECURITY: Validate column names
        this.validateColumnNames(columns);
        // Build parameterized query
        const placeholders = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
        const values = data.flatMap(row => columns.map(col => row[col]));
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
    async updateById(tableName, id, updates) {
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
    async softDeleteById(tableName, id) {
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
    validateTableName(tableName) {
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
    validateColumnNames(columns) {
        const invalidColumns = columns.filter(col => !/^[a-z_][a-z0-9_]*$/.test(col));
        if (invalidColumns.length > 0) {
            throw new Error(`Invalid column names: ${invalidColumns.join(', ')}`);
        }
    }
    /**
     * Sanitize query for logging
     * ✅ SECURITY: Redacts sensitive data from logs
     */
    sanitizeQueryForLogging(sql) {
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
    async healthCheck() {
        try {
            await this.executeQuery('SELECT 1 as health');
            return true;
        }
        catch (error) {
            this.logger.error('Database health check failed', {
                error: error.message,
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
    async close() {
        await this.db.close();
        this.logger.info('Database connections closed');
    }
}
exports.DatabaseQueryService = DatabaseQueryService;
exports.default = DatabaseQueryService;
//# sourceMappingURL=database-query.service.js.map