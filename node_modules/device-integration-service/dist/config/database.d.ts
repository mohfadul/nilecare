/**
 * Database Configuration
 * PostgreSQL/TimescaleDB connection setup
 */
import { Pool } from 'pg';
export declare const initializeDatabase: () => Promise<Pool>;
export declare const getPool: () => Pool;
export declare const closeDatabase: () => Promise<void>;
declare const _default: {
    initializeDatabase: () => Promise<Pool>;
    getPool: () => Pool;
    closeDatabase: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map