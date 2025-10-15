import mysql from 'mysql2/promise';
export interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
    connectionLimit: number;
}
export declare const pool: mysql.Pool;
export declare function getConnection(): Promise<mysql.PoolConnection>;
export declare function query(sql: string, params?: any[]): Promise<mysql.QueryResult>;
export declare function testConnection(): Promise<boolean>;
export default pool;
//# sourceMappingURL=database.d.ts.map