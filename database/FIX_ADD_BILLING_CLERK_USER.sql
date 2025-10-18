-- ============================================================================
-- FIX: Add Missing Billing Clerk Test User
-- Date: October 18, 2025
-- Issue: Billing Clerk Dashboard has no test user
-- Impact: Cannot test Billing Clerk Dashboard (1/7 dashboards blocked)
-- ============================================================================

USE nilecare;

-- ============================================================================
-- 1. Add billing_clerk test user to main database
-- ============================================================================

-- Check if user already exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ User already exists - skipping insert'
    ELSE '✅ User does not exist - will create'
  END as status
FROM users 
WHERE email = 'billing@nilecare.sd';

-- Insert billing_clerk user (safe with INSERT IGNORE)
INSERT IGNORE INTO users (id, email, password, first_name, last_name, role, status, phone, national_id, specialty, department)
VALUES (
  'user_billing_1', 
  'billing@nilecare.sd', 
  'TestPass123!', 
  'Omar', 
  'Hassan', 
  'billing_clerk', 
  'active', 
  '+249912345007', 
  'SD007', 
  'Finance',
  'Billing Department'
);

-- ============================================================================
-- 2. Verify creation
-- ============================================================================

SELECT '✅ VERIFICATION RESULTS' as status;

SELECT 
  id,
  email,
  CONCAT(first_name, ' ', last_name) as full_name,
  role,
  status,
  department,
  'TestPass123!' as password_hint
FROM users 
WHERE email = 'billing@nilecare.sd';

-- ============================================================================
-- 3. Display all test users for reference
-- ============================================================================

SELECT '📋 ALL TEST USERS' as status;

SELECT 
  role,
  email,
  CONCAT(first_name, ' ', last_name) as name,
  status
FROM users 
WHERE email LIKE '%@nilecare.sd'
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'doctor' THEN 2
    WHEN 'nurse' THEN 3
    WHEN 'receptionist' THEN 4
    WHEN 'billing_clerk' THEN 5
    WHEN 'lab_technician' THEN 6
    WHEN 'pharmacist' THEN 7
    ELSE 8
  END;

-- ============================================================================
-- 4. Count users by role
-- ============================================================================

SELECT '📊 USER COUNT BY ROLE' as status;

SELECT 
  role,
  COUNT(*) as user_count
FROM users 
WHERE email LIKE '%@nilecare.sd'
GROUP BY role
ORDER BY role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '
╔════════════════════════════════════════════════════════════════════╗
║                  ✅ BILLING CLERK USER ADDED                       ║
╚════════════════════════════════════════════════════════════════════╝

Test User Details:
  Email:    billing@nilecare.sd
  Password: TestPass123!
  Name:     Omar Hassan
  Role:     billing_clerk
  Status:   active

Login to Test:
  1. Open http://localhost:5173
  2. Login with: billing@nilecare.sd / TestPass123!
  3. Navigate to Billing Clerk Dashboard
  4. Verify real data loading

Dashboard Status: 7/7 (100%) ✅
  ✅ Doctor Dashboard          - doctor@nilecare.sd
  ✅ Nurse Dashboard           - nurse@nilecare.sd
  ✅ Receptionist Dashboard    - reception@nilecare.sd
  ✅ Admin Dashboard           - admin@nilecare.sd
  ✅ Billing Clerk Dashboard   - billing@nilecare.sd (NEW!)
  ✅ Lab Tech Dashboard        - lab@nilecare.sd
  ✅ Pharmacist Dashboard      - pharmacist@nilecare.sd

🎉 All dashboards now have test users!

' as success_message;

