-- ============================================================================
-- NileCare Auth Service - MySQL Tables
-- Enterprise Authentication & Authorization System
-- ============================================================================

USE nilecare;

-- Users table
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

-- Refresh tokens table
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

-- Devices table
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

-- Roles table
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

-- Permissions table
CREATE TABLE IF NOT EXISTS auth_permissions (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
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

-- Login attempts table
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

-- Insert default roles
INSERT INTO auth_roles (id, name, description, permissions, is_system)
VALUES 
  (UUID(), 'admin', 'System Administrator', JSON_ARRAY('*'), TRUE),
  (UUID(), 'doctor', 'Healthcare Provider', JSON_ARRAY('patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'records:read', 'records:write'), TRUE),
  (UUID(), 'nurse', 'Nursing Staff', JSON_ARRAY('patients:read', 'appointments:read', 'records:read', 'records:write'), TRUE),
  (UUID(), 'patient', 'Patient', JSON_ARRAY('appointments:read', 'appointments:write', 'records:read'), TRUE),
  (UUID(), 'receptionist', 'Front Desk', JSON_ARRAY('patients:read', 'appointments:read', 'appointments:write'), TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Seed test users with bcrypt hashed password (TestPass123!)
INSERT INTO auth_users (id, email, username, password_hash, first_name, last_name, role, status, email_verified)
VALUES 
  (UUID(), 'doctor@nilecare.sd', 'Dr. Ahmed Hassan', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Ahmed', 'Hassan', 'doctor', 'active', TRUE),
  (UUID(), 'nurse@nilecare.sd', 'Nurse Sarah Ali', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Sarah', 'Ali', 'nurse', 'active', TRUE),
  (UUID(), 'admin@nilecare.sd', 'Admin User', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Admin', 'User', 'admin', 'active', TRUE)
ON DUPLICATE KEY UPDATE email=email;

-- Verification
SELECT 
  id,
  email,
  username,
  role,
  status,
  'TestPass123!' as password_note
FROM auth_users 
WHERE email LIKE '%@nilecare.sd'
ORDER BY role;

SELECT '✅ Auth Service tables created successfully!' as status;

