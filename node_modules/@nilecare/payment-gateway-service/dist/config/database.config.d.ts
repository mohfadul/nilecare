/**
 * Database Configuration
 * MySQL connection configuration for payment system
 */
import { Pool, PoolConnection } from 'mysql2/promise';
export declare class DatabaseConfig {
    private static instance;
    private pool;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): DatabaseConfig;
    /**
     * Get database connection pool
     */
    getPool(): Pool;
    /**
     * Get a connection from the pool
     */
    getConnection(): Promise<PoolConnection>;
    /**
     * Execute query with automatic connection management
     */
    query<T = any>(sql: string, params?: any[]): Promise<T>;
    /**
     * Execute query within a transaction
     */
    transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T>;
    /**
     * Test database connection
     */
    private testConnection;
    /**
     * Close all connections (for graceful shutdown)
     */
    close(): Promise<void>;
    /**
     * Get pool statistics
     */
    getPoolStats(): {
        totalConnections: number | undefined;
    };
}
declare const _default: DatabaseConfig;
export default _default;
//# sourceMappingURL=database.config.d.ts.map