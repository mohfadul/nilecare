-- ============================================================================
-- NileCare Business Service - Audit Logs Table
-- PRIORITY 1.1 - Comprehensive Audit Logging
-- ============================================================================
-- 
-- Purpose: Track all business operations for compliance and security
-- Retention: Keep audit logs for 7 years (regulatory requirement)
-- Access: Admin and Compliance Officer only
-- 
-- ============================================================================

USE nilecare;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  
  -- WHO: User identification
  user_id CHAR(36) NOT NULL COMMENT 'User who performed the action',
  user_role VARCHAR(50) NOT NULL COMMENT 'User role at time of action',
  user_email VARCHAR(255) COMMENT 'User email for quick reference',
  organization_id VARCHAR(100) NOT NULL COMMENT 'Organization context',
  
  -- WHAT: Action details
  action VARCHAR(50) NOT NULL COMMENT 'Action performed (VIEW, CREATE, UPDATE, DELETE, etc.)',
  resource VARCHAR(50) NOT NULL COMMENT 'Resource type (APPOINTMENT, BILLING, etc.)',
  resource_id VARCHAR(100) COMMENT 'Specific resource identifier',
  resource_type VARCHAR(50) COMMENT 'Resource subtype',
  
  -- WHEN: Timestamp
  timestamp DATETIME NOT NULL COMMENT 'When action occurred',
  
  -- WHERE: Request context
  ip_address VARCHAR(45) COMMENT 'Client IP address',
  user_agent TEXT COMMENT 'Client user agent string',
  service VARCHAR(50) NOT NULL COMMENT 'Service name (business-service)',
  endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint called',
  http_method VARCHAR(10) NOT NULL COMMENT 'HTTP method (GET, POST, etc.)',
  
  -- RESULT: Outcome
  result ENUM('SUCCESS', 'FAILURE', 'PARTIAL') NOT NULL COMMENT 'Operation result',
  status_code INT COMMENT 'HTTP status code',
  
  -- CONTEXT: Change tracking
  description TEXT COMMENT 'Human-readable description',
  old_values JSON COMMENT 'Previous values (for UPDATE/DELETE)',
  new_values JSON COMMENT 'New values (for CREATE/UPDATE)',
  metadata JSON COMMENT 'Additional context data',
  
  -- ERROR INFO: Failure details
  error_message TEXT COMMENT 'Error message if failed',
  error_code VARCHAR(50) COMMENT 'Error code if failed',
  
  -- METADATA
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation time',
  
  -- INDEXES for performance
  INDEX idx_user_id (user_id),
  INDEX idx_organization_id (organization_id),
  INDEX idx_resource (resource, resource_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_result (result),
  INDEX idx_composite_user_resource (user_id, resource, timestamp),
  INDEX idx_composite_org_resource (organization_id, resource, timestamp)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for all business service operations';

-- Create a view for failed operations (security monitoring)
CREATE OR REPLACE VIEW audit_failed_operations AS
SELECT 
  id,
  user_id,
  user_role,
  user_email,
  action,
  resource,
  resource_id,
  timestamp,
  ip_address,
  status_code,
  error_message,
  error_code
FROM audit_logs
WHERE result = 'FAILURE'
ORDER BY timestamp DESC;

-- Create a view for recent access to sensitive resources
CREATE OR REPLACE VIEW audit_recent_access AS
SELECT 
  user_id,
  user_email,
  resource,
  COUNT(*) as access_count,
  MAX(timestamp) as last_access,
  COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND action IN ('VIEW', 'LIST', 'SEARCH')
GROUP BY user_id, user_email, resource
ORDER BY access_count DESC;

-- Create a view for data modifications
CREATE OR REPLACE VIEW audit_modifications AS
SELECT 
  id,
  user_id,
  user_role,
  user_email,
  action,
  resource,
  resource_id,
  timestamp,
  old_values,
  new_values,
  description
FROM audit_logs
WHERE action IN ('CREATE', 'UPDATE', 'DELETE')
  AND result = 'SUCCESS'
ORDER BY timestamp DESC;

-- Index for efficient querying of recent logs
CREATE INDEX IF NOT EXISTS idx_audit_recent 
  ON audit_logs(timestamp DESC, result, resource);

-- Index for user activity reports
CREATE INDEX IF NOT EXISTS idx_audit_user_activity 
  ON audit_logs(user_id, timestamp DESC, action);

-- Index for compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_compliance 
  ON audit_logs(organization_id, resource, timestamp DESC);

SELECT '✅ Audit logs table and indexes created successfully' AS status;
SELECT CONCAT('📊 Audit logging enabled for: ', COUNT(*), ' existing records') AS info 
FROM audit_logs;

-- Display table structure
SHOW CREATE TABLE audit_logs;

