"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.getConnection = getConnection;
exports.query = query;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nilecare',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 10,
};
exports.pool = promise_1.default.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port,
    waitForConnections: true,
    connectionLimit: dbConfig.connectionLimit,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});
async function getConnection() {
    return await exports.pool.getConnection();
}
async function query(sql, params) {
    const [rows] = await exports.pool.execute(sql, params);
    return rows;
}
async function testConnection() {
    try {
        const connection = await exports.pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}
exports.default = exports.pool;
//# sourceMappingURL=database.js.map