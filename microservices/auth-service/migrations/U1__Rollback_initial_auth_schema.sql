-- ============================================================
-- Auth Service - Rollback Initial Schema
-- Version: U1
-- Description: Undo V1 - Drop authentication tables
-- Author: Database Team
-- Date: 2025-10-15
-- ============================================================

-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS auth_login_attempts;
DROP TABLE IF EXISTS auth_audit_logs;
DROP TABLE IF EXISTS auth_permissions;
DROP TABLE IF EXISTS auth_roles;
DROP TABLE IF EXISTS auth_devices;
DROP TABLE IF EXISTS auth_refresh_tokens;
DROP TABLE IF EXISTS auth_users;

-- Log rollback completion
SELECT 'Rollback U1__Rollback_initial_auth_schema completed successfully' as status;

