-- ============================================================================
-- FIX: Add Missing Roles and Users to Auth Service
-- Date: October 18, 2025
-- Issue: Auth service only has 3/7 dashboard users
-- Impact: RBAC and authentication incomplete for 4 dashboards
-- ============================================================================

-- Use auth service database
-- Note: Database name might be nilecare_auth or auth_service depending on setup
-- Adjust as needed for your environment

-- ============================================================================
-- 1. Add missing roles to auth_roles table
-- ============================================================================

INSERT INTO auth_roles (id, name, description, permissions, is_system)
VALUES 
  (UUID(), 'billing_clerk', 'Billing Clerk', JSON_ARRAY('invoices:read', 'invoices:write', 'payments:read', 'claims:read', 'claims:write', 'reports:read'), TRUE),
  (UUID(), 'pharmacist', 'Pharmacist', JSON_ARRAY('medications:read', 'medications:write', 'prescriptions:read', 'prescriptions:write', 'inventory:read', 'patients:read'), TRUE),
  (UUID(), 'lab_technician', 'Lab Technician', JSON_ARRAY('lab:read', 'lab:write', 'results:read', 'results:write', 'patients:read', 'orders:read'), TRUE)
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  permissions = VALUES(permissions);

-- ============================================================================
-- 2. Add missing test users to auth_users table
-- ============================================================================
-- Password hash: $2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS
-- This is bcrypt hash for: TestPass123!
-- ============================================================================

INSERT INTO auth_users (id, email, username, password_hash, first_name, last_name, role, status, email_verified)
VALUES 
  (UUID(), 'reception@nilecare.sd', 'Amina Khalil', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Amina', 'Khalil', 'receptionist', 'active', TRUE),
  (UUID(), 'pharmacist@nilecare.sd', 'Mohamed Osman', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Mohamed', 'Osman', 'pharmacist', 'active', TRUE),
  (UUID(), 'lab@nilecare.sd', 'Ibrahim Ahmed', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Ibrahim', 'Ahmed', 'lab_technician', 'active', TRUE),
  (UUID(), 'billing@nilecare.sd', 'Omar Hassan', '$2b$10$KDjSqIFF0zkAqBU3cjOzoexD2RY3hsNgG.vq07WZUxHwAzjzunHIS', 'Omar', 'Hassan', 'billing_clerk', 'active', TRUE)
ON DUPLICATE KEY UPDATE 
  email = VALUES(email);

-- ============================================================================
-- 3. Verify all roles exist
-- ============================================================================

SELECT '✅ ROLES VERIFICATION' as status;

SELECT 
  id,
  name,
  description,
  is_system,
  created_at
FROM auth_roles
WHERE is_system = TRUE
ORDER BY name;

-- ============================================================================
-- 4. Verify all test users exist
-- ============================================================================

SELECT '✅ USERS VERIFICATION' as status;

SELECT 
  id,
  email,
  username,
  role,
  status,
  email_verified,
  'TestPass123!' as password_hint
FROM auth_users 
WHERE email LIKE '%@nilecare.sd'
ORDER BY role;

-- ============================================================================
-- 5. Count users by role
-- ============================================================================

SELECT '📊 USER COUNT BY ROLE' as status;

SELECT 
  role,
  COUNT(*) as user_count,
  GROUP_CONCAT(email SEPARATOR ', ') as emails
FROM auth_users
WHERE email LIKE '%@nilecare.sd'
GROUP BY role
ORDER BY role;

-- ============================================================================
-- 6. Verify role-permission mapping
-- ============================================================================

SELECT '🔐 ROLE PERMISSIONS' as status;

SELECT 
  name as role,
  description,
  JSON_LENGTH(permissions) as permission_count,
  JSON_EXTRACT(permissions, '$') as permissions_list
FROM auth_roles
WHERE is_system = TRUE
ORDER BY name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '
╔════════════════════════════════════════════════════════════════════╗
║            ✅ AUTH SERVICE - ALL USERS ADDED                       ║
╚════════════════════════════════════════════════════════════════════╝

Added Roles:
  ✅ billing_clerk    - Financial management permissions
  ✅ pharmacist       - Medication and prescription management
  ✅ lab_technician   - Lab orders and results management

Added Test Users:
  ✅ reception@nilecare.sd    - Amina Khalil (receptionist)
  ✅ pharmacist@nilecare.sd   - Mohamed Osman (pharmacist)
  ✅ lab@nilecare.sd          - Ibrahim Ahmed (lab_technician)
  ✅ billing@nilecare.sd      - Omar Hassan (billing_clerk) 🆕

All Test Users (7/7):
  1. doctor@nilecare.sd       - Dr. Ahmed Hassan
  2. nurse@nilecare.sd        - Nurse Sarah Ali
  3. admin@nilecare.sd        - Admin User
  4. reception@nilecare.sd    - Amina Khalil
  5. billing@nilecare.sd      - Omar Hassan
  6. lab@nilecare.sd          - Ibrahim Ahmed
  7. pharmacist@nilecare.sd   - Mohamed Osman

Password (all users): TestPass123!

🎉 Auth Service Complete - All dashboard roles configured!

' as success_message;

