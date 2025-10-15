-- ============================================================================
-- NileCare Service Database Users Creation Script
-- Version: 1.0.0
-- Description: Create separate database users for each microservice
-- Date: 2025-10-15
-- Security: CHANGE ALL PASSWORDS IN PRODUCTION!
-- ============================================================================

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================
-- 1. These are DEFAULT PASSWORDS for development only
-- 2. In production, use strong randomly generated passwords
-- 3. Store production passwords in secrets manager (AWS Secrets Manager, Vault)
-- 4. Rotate credentials every 90 days
-- 5. Use different passwords for dev/staging/production
-- ============================================================================

-- Drop existing users if they exist (for clean setup)
DROP USER IF EXISTS 'auth_service'@'localhost';
DROP USER IF EXISTS 'auth_service'@'%';
DROP USER IF EXISTS 'billing_service'@'localhost';
DROP USER IF EXISTS 'billing_service'@'%';
DROP USER IF EXISTS 'payment_service'@'localhost';
DROP USER IF EXISTS 'payment_service'@'%';
DROP USER IF EXISTS 'business_service'@'localhost';
DROP USER IF EXISTS 'business_service'@'%';
DROP USER IF EXISTS 'facility_service'@'localhost';
DROP USER IF EXISTS 'facility_service'@'%';
DROP USER IF EXISTS 'lab_service'@'localhost';
DROP USER IF EXISTS 'lab_service'@'%';
DROP USER IF EXISTS 'medication_service'@'localhost';
DROP USER IF EXISTS 'medication_service'@'%';
DROP USER IF EXISTS 'inventory_service'@'localhost';
DROP USER IF EXISTS 'inventory_service'@'%';
DROP USER IF EXISTS 'readonly_service'@'localhost';
DROP USER IF EXISTS 'readonly_service'@'%';

FLUSH PRIVILEGES;

-- ============================================================================
-- 1. AUTH SERVICE USER
-- ============================================================================
CREATE USER 'auth_service'@'localhost' IDENTIFIED BY 'Auth_Service_P@ssw0rd_2025!';
CREATE USER 'auth_service'@'%' IDENTIFIED BY 'Auth_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_auth.* TO 'auth_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_auth.* TO 'auth_service'@'%';

-- Grant schema_version access (Flyway)
GRANT ALL PRIVILEGES ON nilecare_auth.schema_version TO 'auth_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_auth.schema_version TO 'auth_service'@'%';

-- ============================================================================
-- 2. BILLING SERVICE USER
-- ============================================================================
CREATE USER 'billing_service'@'localhost' IDENTIFIED BY 'Billing_Service_P@ssw0rd_2025!';
CREATE USER 'billing_service'@'%' IDENTIFIED BY 'Billing_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_billing.* TO 'billing_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_billing.* TO 'billing_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_billing.schema_version TO 'billing_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_billing.schema_version TO 'billing_service'@'%';

-- ============================================================================
-- 3. PAYMENT GATEWAY SERVICE USER
-- ============================================================================
CREATE USER 'payment_service'@'localhost' IDENTIFIED BY 'Payment_Service_P@ssw0rd_2025!';
CREATE USER 'payment_service'@'%' IDENTIFIED BY 'Payment_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_payment.* TO 'payment_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_payment.* TO 'payment_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_payment.schema_version TO 'payment_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_payment.schema_version TO 'payment_service'@'%';

-- ============================================================================
-- 4. BUSINESS SERVICE USER
-- ============================================================================
CREATE USER 'business_service'@'localhost' IDENTIFIED BY 'Business_Service_P@ssw0rd_2025!';
CREATE USER 'business_service'@'%' IDENTIFIED BY 'Business_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_business.* TO 'business_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_business.* TO 'business_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_business.schema_version TO 'business_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_business.schema_version TO 'business_service'@'%';

-- ============================================================================
-- 5. FACILITY SERVICE USER
-- ============================================================================
CREATE USER 'facility_service'@'localhost' IDENTIFIED BY 'Facility_Service_P@ssw0rd_2025!';
CREATE USER 'facility_service'@'%' IDENTIFIED BY 'Facility_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_facility.* TO 'facility_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_facility.* TO 'facility_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_facility.schema_version TO 'facility_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_facility.schema_version TO 'facility_service'@'%';

-- ============================================================================
-- 6. LAB SERVICE USER
-- ============================================================================
CREATE USER 'lab_service'@'localhost' IDENTIFIED BY 'Lab_Service_P@ssw0rd_2025!';
CREATE USER 'lab_service'@'%' IDENTIFIED BY 'Lab_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_lab.* TO 'lab_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_lab.* TO 'lab_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_lab.schema_version TO 'lab_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_lab.schema_version TO 'lab_service'@'%';

-- ============================================================================
-- 7. MEDICATION SERVICE USER
-- ============================================================================
CREATE USER 'medication_service'@'localhost' IDENTIFIED BY 'Medication_Service_P@ssw0rd_2025!';
CREATE USER 'medication_service'@'%' IDENTIFIED BY 'Medication_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_medication.* TO 'medication_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_medication.* TO 'medication_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_medication.schema_version TO 'medication_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_medication.schema_version TO 'medication_service'@'%';

-- ============================================================================
-- 8. INVENTORY SERVICE USER
-- ============================================================================
CREATE USER 'inventory_service'@'localhost' IDENTIFIED BY 'Inventory_Service_P@ssw0rd_2025!';
CREATE USER 'inventory_service'@'%' IDENTIFIED BY 'Inventory_Service_P@ssw0rd_2025!';

GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_inventory.* TO 'inventory_service'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare_inventory.* TO 'inventory_service'@'%';

GRANT ALL PRIVILEGES ON nilecare_inventory.schema_version TO 'inventory_service'@'localhost';
GRANT ALL PRIVILEGES ON nilecare_inventory.schema_version TO 'inventory_service'@'%';

-- ============================================================================
-- 9. READ-ONLY SERVICE USER (Analytics, Reporting)
-- ============================================================================
CREATE USER 'readonly_service'@'localhost' IDENTIFIED BY 'ReadOnly_Service_P@ssw0rd_2025!';
CREATE USER 'readonly_service'@'%' IDENTIFIED BY 'ReadOnly_Service_P@ssw0rd_2025!';

-- Grant read-only access to all nilecare databases
GRANT SELECT ON nilecare_auth.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_auth.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_billing.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_billing.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_payment.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_payment.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_business.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_business.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_facility.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_facility.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_lab.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_lab.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_medication.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_medication.* TO 'readonly_service'@'%';
GRANT SELECT ON nilecare_inventory.* TO 'readonly_service'@'localhost';
GRANT SELECT ON nilecare_inventory.* TO 'readonly_service'@'%';

-- ============================================================================
-- APPLY ALL CHANGES
-- ============================================================================
FLUSH PRIVILEGES;

-- ============================================================================
-- VERIFY USERS CREATED
-- ============================================================================
SELECT 
  User as username,
  Host as host,
  account_locked as locked,
  password_expired as password_expired
FROM mysql.user
WHERE User LIKE '%_service'
ORDER BY User, Host;

-- ============================================================================
-- DISPLAY CREDENTIALS SUMMARY
-- ============================================================================
SELECT '
╔════════════════════════════════════════════════════════════════════╗
║                  SERVICE DATABASE USERS CREATED                    ║
╚════════════════════════════════════════════════════════════════════╝

✅ Created 9 service-specific database users
✅ Granted appropriate permissions
✅ Configured for localhost and remote access (%)

⚠️  SECURITY WARNINGS:
   1. These are DEFAULT DEVELOPMENT PASSWORDS
   2. CHANGE ALL PASSWORDS in production
   3. Use AWS Secrets Manager or HashiCorp Vault
   4. Rotate credentials every 90 days
   5. Disable % (remote) access in production if not needed

📋 Service Users Created:
   • auth_service      → nilecare_auth
   • billing_service   → nilecare_billing
   • payment_service   → nilecare_payment
   • business_service  → nilecare_business
   • facility_service  → nilecare_facility
   • lab_service       → nilecare_lab
   • medication_service → nilecare_medication
   • inventory_service → nilecare_inventory
   • readonly_service  → ALL databases (READ-ONLY)

🔐 Update .env files with:
   DB_USER=<service>_service
   DB_PASSWORD=<password from this script>

' as setup_summary;
