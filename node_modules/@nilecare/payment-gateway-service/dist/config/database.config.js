"use strict";
/**
 * Database Configuration
 * MySQL connection configuration for payment system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const promise_1 = require("mysql2/promise");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class DatabaseConfig {
    constructor() {
        this.pool = (0, promise_1.createPool)({
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
    static getInstance() {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }
    /**
     * Get database connection pool
     */
    getPool() {
        return this.pool;
    }
    /**
     * Get a connection from the pool
     */
    async getConnection() {
        return await this.pool.getConnection();
    }
    /**
     * Execute query with automatic connection management
     */
    async query(sql, params) {
        const connection = await this.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Execute query within a transaction
     */
    async transaction(callback) {
        const connection = await this.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('✅ Database connection established successfully');
            // Test query
            await connection.execute('SELECT 1');
            console.log('✅ Database query test successful');
            connection.release();
        }
        catch (error) {
            console.error('❌ Database connection failed:', error.message);
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }
    /**
     * Close all connections (for graceful shutdown)
     */
    async close() {
        await this.pool.end();
        console.log('Database connections closed');
    }
    /**
     * Get pool statistics
     */
    getPoolStats() {
        return {
            totalConnections: this.pool.pool.config.connectionLimit,
            // Additional pool stats would come from pool monitoring
        };
    }
}
exports.DatabaseConfig = DatabaseConfig;
// Export singleton instance
exports.default = DatabaseConfig.getInstance();
//# sourceMappingURL=database.config.js.map