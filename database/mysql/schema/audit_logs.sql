-- =====================================================
-- Audit Logging Schema (MySQL)
-- Purpose: Track all CRUD operations and user actions
-- HIPAA-compliant audit trail
-- =====================================================

USE nilecare;

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  -- Action details
  action VARCHAR(50) NOT NULL COMMENT 'create, read, update, delete, login, logout, etc.',
  entity_type VARCHAR(100) NOT NULL COMMENT 'patients, appointments, users, etc.',
  entity_id VARCHAR(100) NULL COMMENT 'ID of the affected entity',
  
  -- User information
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(200) NULL,
  user_role VARCHAR(50) NULL,
  user_email VARCHAR(255) NULL,
  
  -- Request information
  ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6',
  user_agent TEXT NULL,
  request_method VARCHAR(10) NULL COMMENT 'GET, POST, PUT, DELETE, PATCH',
  request_url VARCHAR(500) NULL,
  request_body JSON NULL COMMENT 'Request payload (sensitive data masked)',
  
  -- Response information
  response_status INT NULL COMMENT 'HTTP status code',
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT NULL,
  
  -- Additional metadata
  changes JSON NULL COMMENT 'Before/after values for updates',
  duration INT NULL COMMENT 'Duration in milliseconds',
  session_id VARCHAR(100) NULL,
  request_id VARCHAR(100) NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_timestamp (created_at DESC),
  INDEX idx_audit_success (success),
  INDEX idx_audit_session (session_id),
  INDEX idx_audit_composite (entity_type, action, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for all system operations';

-- =====================================================
-- SECURITY EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  event_type VARCHAR(50) NOT NULL COMMENT 'brute_force, unauthorized_access, suspicious_activity, etc.',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT 'low, medium, high, critical',
  
  -- User/IP information
  user_id VARCHAR(100) NULL,
  user_name VARCHAR(200) NULL,
  ip_address VARCHAR(45) NULL,
  
  -- Event details
  description TEXT NOT NULL,
  details JSON NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' COMMENT 'open, investigating, resolved, false_positive',
  investigated_by VARCHAR(100) NULL,
  investigated_at TIMESTAMP NULL,
  resolution TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_security_type (event_type),
  INDEX idx_security_severity (severity),
  INDEX idx_security_status (status),
  INDEX idx_security_timestamp (created_at DESC),
  INDEX idx_security_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security incidents and suspicious activities';

-- =====================================================
-- LOGIN ATTEMPTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_login_email (email),
  INDEX idx_login_ip (ip_address),
  INDEX idx_login_timestamp (created_at DESC),
  INDEX idx_login_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track all login attempts for security monitoring';

-- =====================================================
-- DATA EXPORT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS data_export_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(200) NULL,
  export_type VARCHAR(50) NOT NULL COMMENT 'excel, pdf, csv',
  entity_type VARCHAR(100) NOT NULL COMMENT 'patients, appointments, etc.',
  record_count INT NULL COMMENT 'Number of records exported',
  filters JSON NULL COMMENT 'Applied filters',
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_export_user (user_id),
  INDEX idx_export_type (export_type),
  INDEX idx_export_entity (entity_type),
  INDEX idx_export_timestamp (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Track all data exports for compliance';

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Daily activity summary
CREATE OR REPLACE VIEW v_daily_audit_summary AS
SELECT 
  DATE(created_at) as activity_date,
  entity_type,
  action,
  COUNT(*) as action_count,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_actions,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_actions
FROM audit_logs
GROUP BY DATE(created_at), entity_type, action;

-- User activity summary
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT 
  user_id,
  user_name,
  user_role,
  COUNT(*) as total_actions,
  COUNT(DISTINCT entity_type) as entities_accessed,
  MAX(created_at) as last_activity,
  SUM(CASE WHEN action = 'create' THEN 1 ELSE 0 END) as creates,
  SUM(CASE WHEN action = 'read' THEN 1 ELSE 0 END) as reads,
  SUM(CASE WHEN action = 'update' THEN 1 ELSE 0 END) as updates,
  SUM(CASE WHEN action = 'delete' THEN 1 ELSE 0 END) as deletes
FROM audit_logs
GROUP BY user_id, user_name, user_role;

-- Failed actions view
CREATE OR REPLACE VIEW v_failed_actions AS
SELECT 
  id,
  action,
  entity_type,
  entity_id,
  user_id,
  user_name,
  error_message,
  created_at
FROM audit_logs
WHERE success = FALSE
ORDER BY created_at DESC;

-- Recent security events
CREATE OR REPLACE VIEW v_recent_security_events AS
SELECT 
  id,
  event_type,
  severity,
  user_id,
  user_name,
  ip_address,
  description,
  status,
  created_at
FROM security_events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC, severity DESC;

-- Failed login attempts
CREATE OR REPLACE VIEW v_failed_logins AS
SELECT 
  email,
  ip_address,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt
FROM login_attempts
WHERE success = FALSE
  AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY email, ip_address
HAVING COUNT(*) >= 3
ORDER BY COUNT(*) DESC, last_attempt DESC;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

DELIMITER $$

-- Get user activity for date range
CREATE PROCEDURE IF NOT EXISTS sp_get_user_activity(
  IN p_user_id VARCHAR(100),
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    DATE(created_at) as activity_date,
    action,
    entity_type,
    COUNT(*) as action_count
  FROM audit_logs
  WHERE user_id = p_user_id
    AND DATE(created_at) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(created_at), action, entity_type
  ORDER BY activity_date DESC, action_count DESC;
END$$

-- Get entity access history
CREATE PROCEDURE IF NOT EXISTS sp_get_entity_history(
  IN p_entity_type VARCHAR(100),
  IN p_entity_id VARCHAR(100),
  IN p_limit INT
)
BEGIN
  SELECT 
    id,
    action,
    user_id,
    user_name,
    user_role,
    changes,
    created_at
  FROM audit_logs
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END$$

-- Clean old audit logs (beyond retention period)
CREATE PROCEDURE IF NOT EXISTS sp_clean_old_audit_logs(
  IN p_retention_days INT
)
BEGIN
  DECLARE deleted_count INT;
  
  DELETE FROM audit_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL p_retention_days DAY);
  
  SET deleted_count = ROW_COUNT();
  
  SELECT deleted_count as records_deleted;
END$$

DELIMITER ;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Log a CRUD action
INSERT INTO audit_logs (
  action, entity_type, entity_id,
  user_id, user_name, user_role,
  ip_address, request_method, request_url,
  success
) VALUES (
  'create', 'patients', 'patient-123',
  'user-456', 'Dr. Ahmed', 'doctor',
  '192.168.1.100', 'POST', '/api/v1/patients',
  TRUE
);

-- Log a security event
INSERT INTO security_events (
  event_type, severity, user_id, ip_address, description
) VALUES (
  'brute_force', 'high', 'user-789', '192.168.1.200',
  'Multiple failed login attempts detected'
);

-- Log a login attempt
INSERT INTO login_attempts (
  email, ip_address, success
) VALUES (
  'doctor@example.com', '192.168.1.100', TRUE
);

-- Get user activity
CALL sp_get_user_activity('user-456', '2025-01-01', '2025-01-31');

-- Get entity history
CALL sp_get_entity_history('patients', 'patient-123', 50);

-- View daily summary
SELECT * FROM v_daily_audit_summary
WHERE activity_date = CURDATE();

-- View failed actions
SELECT * FROM v_failed_actions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- View failed logins
SELECT * FROM v_failed_logins;
*/

