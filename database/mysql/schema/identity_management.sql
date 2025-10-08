-- =====================================================
-- NileCare Identity Management Database Schema
-- Database: identity_management (MySQL 8.0+)
-- Purpose: User management, authentication, authorization, security
-- =====================================================

CREATE DATABASE IF NOT EXISTS identity_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE identity_management;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires DATETIME,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  password_changed_at DATETIME,
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  failed_login_attempts INT DEFAULT 0,
  last_failed_login DATETIME,
  account_locked BOOLEAN DEFAULT FALSE,
  account_locked_until DATETIME,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  phone VARCHAR(20) COMMENT 'Sudan mobile format: +249xxxxxxxxx',
  phone_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
  profile_picture_url VARCHAR(500),
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  locale VARCHAR(10) DEFAULT 'ar_SD',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes JSON,
  security_questions JSON,
  preferred_mfa_method ENUM('sms', 'email', 'authenticator', 'biometric'),
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at DATETIME,
  last_login_at DATETIME,
  last_login_ip VARCHAR(45),
  last_activity_at DATETIME,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at DATETIME,
  privacy_policy_accepted BOOLEAN DEFAULT FALSE,
  privacy_policy_accepted_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_active (is_active),
  INDEX idx_last_login (last_login_at),
  FULLTEXT idx_user_search (first_name, last_name, email, username)
) ENGINE=InnoDB;

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_name VARCHAR(100) UNIQUE NOT NULL,
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_description TEXT,
  role_type ENUM('system', 'clinical', 'administrative', 'custom') NOT NULL,
  is_system_role BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  INDEX idx_role_code (role_code),
  INDEX idx_role_type (role_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- PERMISSIONS TABLE
-- =====================================================
CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  permission_name VARCHAR(100) UNIQUE NOT NULL,
  permission_code VARCHAR(100) UNIQUE NOT NULL,
  permission_description TEXT,
  resource VARCHAR(100) NOT NULL COMMENT 'e.g., patients, medications, appointments',
  action VARCHAR(50) NOT NULL COMMENT 'e.g., create, read, update, delete',
  scope ENUM('own', 'department', 'facility', 'organization', 'all') DEFAULT 'own',
  is_system_permission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_permission_code (permission_code),
  INDEX idx_resource (resource),
  INDEX idx_resource_action (resource, action)
) ENGINE=InnoDB;

-- =====================================================
-- USER ROLES TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  facility_id CHAR(36) COMMENT 'Scope role to specific facility',
  department_id CHAR(36) COMMENT 'Scope role to specific department',
  assigned_by CHAR(36),
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_role_facility (user_id, role_id, facility_id, department_id),
  INDEX idx_user (user_id),
  INDEX idx_role (role_id),
  INDEX idx_facility (facility_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- ROLE PERMISSIONS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE role_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  granted_by CHAR(36),
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  INDEX idx_role (role_id),
  INDEX idx_permission (permission_id)
) ENGINE=InnoDB;

-- =====================================================
-- USER PERMISSIONS TABLE (Direct user permissions)
-- =====================================================
CREATE TABLE user_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  permission_type ENUM('grant', 'deny') DEFAULT 'grant',
  granted_by CHAR(36),
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_permission (permission_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
CREATE TABLE sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  refresh_token VARCHAR(500) UNIQUE,
  device_id VARCHAR(255),
  device_type ENUM('web', 'mobile_ios', 'mobile_android', 'tablet', 'desktop', 'other'),
  device_name VARCHAR(255),
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  location_coordinates VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  logout_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_session_token (session_token),
  INDEX idx_refresh_token (refresh_token),
  INDEX idx_expires (expires_at),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- OAUTH CLIENTS TABLE
-- =====================================================
CREATE TABLE oauth_clients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_type ENUM('confidential', 'public') DEFAULT 'confidential',
  grant_types JSON NOT NULL COMMENT 'Array of allowed grant types',
  redirect_uris JSON NOT NULL COMMENT 'Array of allowed redirect URIs',
  scopes JSON COMMENT 'Array of allowed scopes',
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  privacy_policy_url VARCHAR(500),
  terms_of_service_url VARCHAR(500),
  owner_id CHAR(36),
  is_trusted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_id (client_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- OAUTH AUTHORIZATION CODES TABLE
-- =====================================================
CREATE TABLE oauth_authorization_codes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(255) UNIQUE NOT NULL,
  client_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  redirect_uri VARCHAR(500) NOT NULL,
  scopes JSON,
  code_challenge VARCHAR(255),
  code_challenge_method ENUM('plain', 'S256'),
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_client (client_id),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- OAUTH ACCESS TOKENS TABLE
-- =====================================================
CREATE TABLE oauth_access_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(500) UNIQUE NOT NULL,
  client_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  scopes JSON,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_client (client_id),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at),
  INDEX idx_revoked (is_revoked)
) ENGINE=InnoDB;

-- =====================================================
-- OAUTH REFRESH TOKENS TABLE
-- =====================================================
CREATE TABLE oauth_refresh_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(500) UNIQUE NOT NULL,
  access_token_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  scopes JSON,
  expires_at DATETIME NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (access_token_id) REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_access_token (access_token_id),
  INDEX idx_client (client_id),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at),
  INDEX idx_revoked (is_revoked)
) ENGINE=InnoDB;

-- =====================================================
-- API KEYS TABLE
-- =====================================================
CREATE TABLE api_keys (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(500) UNIQUE NOT NULL,
  api_secret VARCHAR(500),
  user_id CHAR(36),
  client_id CHAR(36),
  scopes JSON,
  rate_limit_per_minute INT DEFAULT 100,
  rate_limit_per_hour INT DEFAULT 1000,
  rate_limit_per_day INT DEFAULT 10000,
  allowed_ips JSON COMMENT 'Array of allowed IP addresses',
  expires_at DATETIME,
  last_used_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at DATETIME,
  revoked_by CHAR(36),
  revocation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_api_key (api_key),
  INDEX idx_user (user_id),
  INDEX idx_active (is_active),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- =====================================================
-- SECURITY AUDIT LOG TABLE
-- =====================================================
CREATE TABLE security_audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36),
  event_type ENUM('login', 'logout', 'login_failed', 'password_change', 'password_reset', 'mfa_enabled', 'mfa_disabled', 'permission_granted', 'permission_revoked', 'role_assigned', 'role_removed', 'account_locked', 'account_unlocked', 'suspicious_activity', 'other') NOT NULL,
  event_category ENUM('authentication', 'authorization', 'account_management', 'security', 'compliance') NOT NULL,
  severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
  event_description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_id VARCHAR(255),
  location_country VARCHAR(100),
  location_city VARCHAR(100),
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  metadata JSON,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_severity (severity),
  INDEX idx_success (success)
) ENGINE=InnoDB;

-- =====================================================
-- ACCESS CONTROL LISTS (ACL) TABLE
-- =====================================================
CREATE TABLE access_control_lists (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  resource_type VARCHAR(100) NOT NULL COMMENT 'e.g., patient, encounter, document',
  resource_id CHAR(36) NOT NULL,
  principal_type ENUM('user', 'role', 'group') NOT NULL,
  principal_id CHAR(36) NOT NULL,
  permission ENUM('read', 'write', 'delete', 'admin') NOT NULL,
  granted_by CHAR(36),
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_principal (principal_type, principal_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- CONSENT MANAGEMENT TABLE
-- =====================================================
CREATE TABLE user_consents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  consent_type ENUM('terms_of_service', 'privacy_policy', 'data_sharing', 'marketing', 'research', 'hipaa', 'other') NOT NULL,
  consent_version VARCHAR(50) NOT NULL,
  consent_status ENUM('granted', 'denied', 'revoked') NOT NULL,
  consent_method ENUM('electronic', 'written', 'verbal', 'implied') DEFAULT 'electronic',
  consent_text TEXT,
  consent_date DATETIME NOT NULL,
  revocation_date DATETIME,
  ip_address VARCHAR(45),
  device_info TEXT,
  witness_id CHAR(36),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_consent_type (consent_type),
  INDEX idx_status (consent_status),
  INDEX idx_consent_date (consent_date)
) ENGINE=InnoDB;

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- Active Users with Roles View
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.first_name,
  u.last_name,
  u.is_active,
  u.last_login_at,
  GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.is_active = TRUE AND u.is_deleted = FALSE
GROUP BY u.id;

-- User Permissions View (Combined role and direct permissions)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT DISTINCT
  u.id as user_id,
  u.username,
  p.permission_code,
  p.resource,
  p.action,
  'role' as permission_source,
  r.role_name as source_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = TRUE

UNION

SELECT DISTINCT
  u.id as user_id,
  u.username,
  p.permission_code,
  p.resource,
  p.action,
  'direct' as permission_source,
  'Direct Assignment' as source_name
FROM users u
JOIN user_permissions up ON u.id = up.user_id AND up.is_active = TRUE AND up.permission_type = 'grant'
JOIN permissions p ON up.permission_id = p.id
WHERE u.is_active = TRUE;

-- Active Sessions View
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
  s.*,
  u.username,
  u.email,
  u.first_name,
  u.last_name
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE
  AND s.expires_at > NOW()
  AND s.logout_at IS NULL;

-- =====================================================
-- CREATE STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure to check user permission
CREATE PROCEDURE sp_check_user_permission(
  IN p_user_id CHAR(36),
  IN p_resource VARCHAR(100),
  IN p_action VARCHAR(50),
  OUT p_has_permission BOOLEAN
)
BEGIN
  DECLARE permission_count INT;
  
  -- Check role-based permissions
  SELECT COUNT(*) INTO permission_count
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = TRUE
    AND p.resource = p_resource
    AND p.action = p_action;
  
  -- Check direct permissions (grants)
  IF permission_count = 0 THEN
    SELECT COUNT(*) INTO permission_count
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND up.is_active = TRUE
      AND up.permission_type = 'grant'
      AND p.resource = p_resource
      AND p.action = p_action;
  END IF;
  
  -- Check for explicit denies
  IF permission_count > 0 THEN
    SELECT COUNT(*) INTO @deny_count
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND up.is_active = TRUE
      AND up.permission_type = 'deny'
      AND p.resource = p_resource
      AND p.action = p_action;
    
    IF @deny_count > 0 THEN
      SET permission_count = 0;
    END IF;
  END IF;
  
  SET p_has_permission = (permission_count > 0);
END //

-- Procedure to log security event
CREATE PROCEDURE sp_log_security_event(
  IN p_user_id CHAR(36),
  IN p_event_type VARCHAR(50),
  IN p_event_category VARCHAR(50),
  IN p_severity VARCHAR(20),
  IN p_description TEXT,
  IN p_ip_address VARCHAR(45),
  IN p_success BOOLEAN
)
BEGIN
  INSERT INTO security_audit_log (
    user_id, event_type, event_category, severity,
    event_description, ip_address, success
  ) VALUES (
    p_user_id, p_event_type, p_event_category, p_severity,
    p_description, p_ip_address, p_success
  );
END //

DELIMITER ;

-- =====================================================
-- INSERT DEFAULT ROLES AND PERMISSIONS
-- =====================================================

-- Insert system roles
INSERT INTO roles (id, role_name, role_code, role_description, role_type, is_system_role) VALUES
(UUID(), 'System Administrator', 'SYSTEM_ADMIN', 'Full system access', 'system', TRUE),
(UUID(), 'Physician', 'PHYSICIAN', 'Licensed physician with full clinical access', 'clinical', TRUE),
(UUID(), 'Nurse', 'NURSE', 'Registered nurse with clinical access', 'clinical', TRUE),
(UUID(), 'Pharmacist', 'PHARMACIST', 'Licensed pharmacist', 'clinical', TRUE),
(UUID(), 'Lab Technician', 'LAB_TECH', 'Laboratory technician', 'clinical', TRUE),
(UUID(), 'Radiologist', 'RADIOLOGIST', 'Radiologist', 'clinical', TRUE),
(UUID(), 'Billing Specialist', 'BILLING_SPECIALIST', 'Billing and claims specialist', 'administrative', TRUE),
(UUID(), 'Receptionist', 'RECEPTIONIST', 'Front desk receptionist', 'administrative', TRUE),
(UUID(), 'Patient', 'PATIENT', 'Patient portal access', 'system', TRUE);

-- Insert system permissions
INSERT INTO permissions (id, permission_name, permission_code, resource, action, scope, is_system_permission) VALUES
-- Patient permissions
(UUID(), 'View Patients', 'patients.read', 'patients', 'read', 'all', TRUE),
(UUID(), 'Create Patients', 'patients.create', 'patients', 'create', 'all', TRUE),
(UUID(), 'Update Patients', 'patients.update', 'patients', 'update', 'all', TRUE),
(UUID(), 'Delete Patients', 'patients.delete', 'patients', 'delete', 'all', TRUE),
-- Encounter permissions
(UUID(), 'View Encounters', 'encounters.read', 'encounters', 'read', 'all', TRUE),
(UUID(), 'Create Encounters', 'encounters.create', 'encounters', 'create', 'all', TRUE),
(UUID(), 'Update Encounters', 'encounters.update', 'encounters', 'update', 'all', TRUE),
-- Medication permissions
(UUID(), 'View Medications', 'medications.read', 'medications', 'read', 'all', TRUE),
(UUID(), 'Prescribe Medications', 'medications.create', 'medications', 'create', 'all', TRUE),
(UUID(), 'Update Medications', 'medications.update', 'medications', 'update', 'all', TRUE),
(UUID(), 'Discontinue Medications', 'medications.delete', 'medications', 'delete', 'all', TRUE),
-- Lab permissions
(UUID(), 'View Lab Results', 'lab_results.read', 'lab_results', 'read', 'all', TRUE),
(UUID(), 'Order Labs', 'lab_orders.create', 'lab_orders', 'create', 'all', TRUE),
(UUID(), 'Enter Lab Results', 'lab_results.create', 'lab_results', 'create', 'all', TRUE),
-- Billing permissions
(UUID(), 'View Billing', 'billing.read', 'billing', 'read', 'all', TRUE),
(UUID(), 'Process Payments', 'payments.create', 'payments', 'create', 'all', TRUE),
(UUID(), 'Submit Claims', 'claims.create', 'claims', 'create', 'all', TRUE);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON identity_management.* TO 'nilecare_app'@'%';
GRANT SELECT ON identity_management.* TO 'nilecare_readonly'@'%';

FLUSH PRIVILEGES;
