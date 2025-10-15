"use strict";
/**
 * Database Configuration
 * PostgreSQL/TimescaleDB connection setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getPool = exports.initializeDatabase = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'nilecare_devices',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};
let pool = null;
const initializeDatabase = async () => {
    if (pool) {
        return pool;
    }
    pool = new pg_1.Pool(poolConfig);
    // Test connection
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
    // Handle pool errors
    pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
    });
    return pool;
};
exports.initializeDatabase = initializeDatabase;
const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initializeDatabase() first.');
    }
    return pool;
};
exports.getPool = getPool;
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
exports.default = {
    initializeDatabase: exports.initializeDatabase,
    getPool: exports.getPool,
    closeDatabase: exports.closeDatabase,
};
//# sourceMappingURL=database.js.map