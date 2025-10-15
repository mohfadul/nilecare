-- ============================================================
-- Auth Service - Initial Schema Migration
-- Version: 1
-- Description: Create core authentication tables
-- Author: Database Team
-- Date: 2025-10-15
-- Ticket: DB-001
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  
  -- MFA fields
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_method VARCHAR(20),
  mfa_backup_codes JSON,
  
  -- Security fields
  failed_login_attempts INT DEFAULT 0,
  last_failed_login TIMESTAMP NULL,
  account_locked_until TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  last_login_ip VARCHAR(45),
  
  -- Password reset fields
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP NULL,
  
  -- Email verification fields
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP NULL,
  
  -- Organization/multi-tenancy
  organization_id VARCHAR(50),
  permissions JSON,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  
  -- Indexes
  INDEX idx_auth_users_email (email),
  INDEX idx_auth_users_username (username),
  INDEX idx_auth_users_organization (organization_id),
  INDEX idx_auth_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts and authentication data';

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
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
  INDEX idx_refresh_tokens_token (token(255)),
  INDEX idx_refresh_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='JWT refresh tokens for session management';

-- ============================================================
-- DEVICES TABLE
-- ============================================================
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
  
  UNIQUE KEY uk_user_fingerprint (user_id, fingerprint),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  INDEX idx_devices_user (user_id),
  INDEX idx_devices_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Trusted device tracking for enhanced security';

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON,
  is_system BOOLEAN DEFAULT FALSE,
  organization_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_roles_name (name),
  INDEX idx_roles_organization (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User roles and role-based permissions';

-- ============================================================
-- PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_permissions (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_permissions_resource (resource),
  INDEX idx_permissions_action (action),
  INDEX idx_permissions_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Granular permission definitions';

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
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
  INDEX idx_audit_logs_timestamp (timestamp),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security audit trail for compliance';

-- ============================================================
-- LOGIN ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_login_attempts_email (email),
  INDEX idx_login_attempts_timestamp (timestamp),
  INDEX idx_login_attempts_ip (ip_address),
  INDEX idx_login_attempts_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Failed login attempt tracking for security';

-- ============================================================
-- SEED DEFAULT ROLES
-- ============================================================
INSERT INTO auth_roles (id, name, description, permissions, is_system)
VALUES 
  (UUID(), 'admin', 'System Administrator', JSON_ARRAY('*'), TRUE),
  (UUID(), 'doctor', 'Healthcare Provider', JSON_ARRAY('patients:read', 'patients:write', 'appointments:read', 'appointments:write', 'records:read', 'records:write'), TRUE),
  (UUID(), 'nurse', 'Nursing Staff', JSON_ARRAY('patients:read', 'appointments:read', 'records:read', 'records:write'), TRUE),
  (UUID(), 'patient', 'Patient', JSON_ARRAY('appointments:read', 'appointments:write', 'records:read'), TRUE),
  (UUID(), 'receptionist', 'Front Desk', JSON_ARRAY('patients:read', 'appointments:read', 'appointments:write'), TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================================
-- LOG MIGRATION COMPLETION
-- ============================================================
SELECT 'Migration V1__Initial_auth_schema completed successfully' as status;

