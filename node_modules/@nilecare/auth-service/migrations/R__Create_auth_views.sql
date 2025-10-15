-- ============================================================
-- Auth Service - Create Views
-- Repeatable Migration
-- Description: Create/replace views for reporting and queries
-- Author: Database Team
-- Date: 2025-10-15
-- ============================================================

-- ============================================================
-- ACTIVE USERS VIEW
-- ============================================================
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
  id,
  email,
  username,
  CONCAT(first_name, ' ', last_name) as full_name,
  first_name,
  last_name,
  role,
  organization_id,
  email_verified,
  mfa_enabled,
  last_login,
  last_login_ip,
  created_at
FROM auth_users
WHERE status = 'active';

-- ============================================================
-- USER SESSIONS VIEW
-- ============================================================
CREATE OR REPLACE VIEW v_user_sessions AS
SELECT 
  rt.id as session_id,
  u.id as user_id,
  u.email,
  u.username,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  rt.device_fingerprint,
  rt.ip_address,
  rt.created_at as session_started,
  rt.expires_at as session_expires,
  rt.is_revoked
FROM auth_refresh_tokens rt
JOIN auth_users u ON rt.user_id = u.id
WHERE rt.is_revoked = FALSE 
  AND rt.expires_at > NOW()
ORDER BY rt.created_at DESC;

-- ============================================================
-- FAILED LOGIN ATTEMPTS (LAST 24 HOURS)
-- ============================================================
CREATE OR REPLACE VIEW v_recent_failed_logins AS
SELECT 
  email,
  ip_address,
  COUNT(*) as attempt_count,
  MAX(timestamp) as last_attempt,
  MIN(timestamp) as first_attempt
FROM auth_login_attempts
WHERE success = FALSE 
  AND timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY email, ip_address
HAVING attempt_count >= 3
ORDER BY attempt_count DESC, last_attempt DESC;

-- ============================================================
-- AUDIT LOG SUMMARY VIEW
-- ============================================================
CREATE OR REPLACE VIEW v_audit_summary AS
SELECT 
  DATE(timestamp) as audit_date,
  action,
  result,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM auth_audit_logs
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp), action, result
ORDER BY audit_date DESC, event_count DESC;

-- Log view creation
SELECT 'Repeatable migration R__Create_auth_views completed' as status;

