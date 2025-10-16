-- ============================================================================
-- V2: Add Audit Columns to All Tables
-- ============================================================================
-- Author: NileCare Backend Team
-- Date: 2025-10-16
-- Purpose: Add comprehensive audit tracking to all tables
--
-- AUDIT COLUMNS:
-- - created_at, updated_at, deleted_at (temporal tracking)
-- - created_by, updated_by, deleted_by (user tracking)
-- - Enables soft deletes, change tracking, compliance
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL COMMENT 'User ID who created this record',
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL COMMENT 'User ID who last updated this record',
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL COMMENT 'User ID who soft-deleted this record';

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- USER_SESSIONS TABLE
-- ============================================================================
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- MFA_SETTINGS TABLE
-- ============================================================================
ALTER TABLE mfa_settings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- API_KEYS TABLE
-- ============================================================================
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36) NULL;

-- ============================================================================
-- CREATE INDEXES FOR AUDIT QUERIES
-- ============================================================================

-- Soft delete indexes (frequently filter on deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted_at ON permissions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_deleted_at ON user_sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_deleted_at ON mfa_settings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_deleted_at ON api_keys(deleted_at);

-- Created/Updated audit indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables have audit columns
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP COLUMNS (only if migration fails)
-- ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS created_by;
-- ... etc

