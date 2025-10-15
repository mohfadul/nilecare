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
export interface QueryOptions {
    timeout?: number;
    connection?: PoolConnection;
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
export declare class DatabaseQueryService {
    private db;
    private logger;
    constructor(logger: winston.Logger);
    /**
     * Execute parameterized query (SQL injection safe)
     * ✅ SECURITY: Always uses prepared statements
     */
    executeQuery<T = any>(sql: string, params?: any[], options?: QueryOptions): Promise<T[]>;
    /**
     * Find user by email (common authentication query)
     * ✅ SECURITY: Uses parameterized query
     */
    findUserByEmail(email: string): Promise<any | null>;
    /**
     * Find user by ID
     * ✅ SECURITY: Uses parameterized query
     */
    findUserById(userId: string): Promise<any | null>;
    /**
     * Search users with filters and pagination
     * ✅ SECURITY: All filters are parameterized
     */
    searchUsers(filters: UserFilters, options?: QueryOptions): Promise<any[]>;
    /**
     * Count users matching filters
     * ✅ SECURITY: Uses parameterized query
     */
    countUsers(filters: Omit<UserFilters, 'limit' | 'offset'>): Promise<number>;
    /**
     * Execute operations within a transaction
     * ✅ SECURITY: Automatic rollback on error
     */
    transaction<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T>;
    /**
     * Bulk insert with transaction support
     * ✅ SECURITY: Uses parameterized queries
     */
    bulkInsert<T extends Record<string, any>>(tableName: string, data: T[], options?: QueryOptions): Promise<void>;
    /**
     * Update record by ID
     * ✅ SECURITY: Uses parameterized query
     */
    updateById(tableName: string, id: string | number, updates: Record<string, any>): Promise<void>;
    /**
     * Soft delete record by ID
     * ✅ SECURITY: Uses parameterized query
     */
    softDeleteById(tableName: string, id: string | number): Promise<void>;
    /**
     * Validate table name (whitelist approach)
     * ✅ SECURITY: Prevents SQL injection via table names
     */
    private validateTableName;
    /**
     * Validate column names
     * ✅ SECURITY: Prevents SQL injection via column names
     */
    private validateColumnNames;
    /**
     * Sanitize query for logging
     * ✅ SECURITY: Redacts sensitive data from logs
     */
    private sanitizeQueryForLogging;
    /**
     * Health check query
     */
    healthCheck(): Promise<boolean>;
    /**
     * Get database pool statistics
     */
    getPoolStats(): {
        totalConnections: number | undefined;
    };
    /**
     * Close database connections (for graceful shutdown)
     */
    close(): Promise<void>;
}
export default DatabaseQueryService;
//# sourceMappingURL=database-query.service.d.ts.map