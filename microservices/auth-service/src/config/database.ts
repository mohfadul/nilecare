import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool | null = null;

export const initializeDatabase = async (): Promise<mysql.Pool> => {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'nilecare',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  // Test connection and log details
  try {
    const connection = await pool.getConnection();
    
    // Log successful connection details
    logger.info('✅ MySQL Database connection established successfully', {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'nilecare',
      user: process.env.DB_USER || 'root',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    
    // Verify database exists
    const [rows]: any = await connection.query(
      'SELECT DATABASE() as db_name, USER() as `current_user`, VERSION() as mysql_version'
    );
    
    logger.info('📊 Database connection verified', {
      database: rows[0].db_name,
      user: rows[0].current_user,
      mysqlVersion: rows[0].mysql_version
    });
    
    connection.release();
  } catch (error: any) {
    logger.error('❌ Failed to connect to MySQL database', {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'nilecare',
      user: process.env.DB_USER || 'root',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    throw error;
  }

  return pool;
};

export const getPool = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
};

// Database table creation scripts for MySQL
export const createTables = async (pool: mysql.Pool): Promise<void> => {
  const connection = await pool.getConnection();
  
  try {
    await connection.query('START TRANSACTION');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'patient',
        status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
        
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        mfa_method VARCHAR(20),
        mfa_backup_codes JSON,
        
        failed_login_attempts INT DEFAULT 0,
        last_failed_login TIMESTAMP NULL,
        account_locked_until TIMESTAMP NULL,
        last_login TIMESTAMP NULL,
        last_login_ip VARCHAR(45),
        
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP NULL,
        
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verification_expires TIMESTAMP NULL,
        
        organization_id VARCHAR(50),
        permissions JSON,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50),
        
        INDEX idx_auth_users_email (email),
        INDEX idx_auth_users_username (username),
        INDEX idx_auth_users_organization (organization_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Refresh tokens table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
        id VARCHAR(50) PRIMARY KEY,
        token VARCHAR(500) UNIQUE NOT NULL,
        token_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        revoked_at TIMESTAMP NULL,
        revoked_reason VARCHAR(255),
        device_fingerprint VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        INDEX idx_refresh_tokens_user (user_id),
        INDEX idx_refresh_tokens_token (token(255))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Devices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_devices (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        fingerprint VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_fingerprint (user_id, fingerprint),
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
        INDEX idx_devices_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_roles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSON,
        is_system BOOLEAN DEFAULT FALSE,
        organization_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_permissions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Audit logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NOT NULL,
        result VARCHAR(20) NOT NULL,
        reason VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL,
        INDEX idx_audit_logs_user (user_id),
        INDEX idx_audit_logs_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Login attempts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_login_attempts (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        reason VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_login_attempts_email (email),
        INDEX idx_login_attempts_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert default roles
    await connection.query(`
      INSERT INTO auth_roles (id, name, description, permissions, is_system)
      VALUES 
        (UUID(), 'admin', 'System Administrator', JSON_ARRAY('*'), TRUE),
        (UUID(), 'doctor', 'Healthcare Provider', JSON_ARRAY('patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'records:read', 'records:write'), TRUE),
        (UUID(), 'nurse', 'Nursing Staff', JSON_ARRAY('patients:read', 'appointments:read', 'records:read', 'records:write'), TRUE),
        (UUID(), 'patient', 'Patient', JSON_ARRAY('appointments:read', 'appointments:write', 'records:read'), TRUE),
        (UUID(), 'receptionist', 'Front Desk', JSON_ARRAY('patients:read', 'appointments:read', 'appointments:write'), TRUE)
      ON DUPLICATE KEY UPDATE name=name;
    `);

    await connection.query('COMMIT');
    logger.info('✅ MySQL Database tables created successfully');
  } catch (error) {
    await connection.query('ROLLBACK');
    logger.error('❌ Failed to create MySQL database tables:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export { mysql };

