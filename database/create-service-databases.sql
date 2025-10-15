-- ============================================================================
-- NileCare Service Databases Creation Script
-- Version: 1.0.0
-- Description: Create separate databases for each microservice
-- Date: 2025-10-15
-- ============================================================================

-- Set character set
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- 1. AUTH SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 2. BILLING SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_billing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 3. PAYMENT GATEWAY DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_payment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 4. BUSINESS SERVICE DATABASE (Already exists)
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_business
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 5. FACILITY SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_facility
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 6. LAB SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_lab
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 7. MEDICATION SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_medication
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 8. INVENTORY SERVICE DATABASE
-- ============================================================================
CREATE DATABASE IF NOT EXISTS nilecare_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ============================================================================
-- 9. CLINICAL/EHR SERVICE DATABASE (Already exists - PostgreSQL)
-- Note: EHR service uses PostgreSQL, managed separately
-- ============================================================================

-- ============================================================================
-- 10. DEVICE INTEGRATION SERVICE DATABASE (Already exists - PostgreSQL/TimescaleDB)
-- Note: Device service uses PostgreSQL + TimescaleDB, managed separately
-- ============================================================================

-- ============================================================================
-- 11. NOTIFICATION SERVICE DATABASE (Already exists - PostgreSQL)
-- Note: Notification service uses PostgreSQL, managed separately
-- ============================================================================

-- ============================================================================
-- VERIFY DATABASES CREATED
-- ============================================================================
SELECT 
  SCHEMA_NAME as database_name,
  DEFAULT_CHARACTER_SET_NAME as charset,
  DEFAULT_COLLATION_NAME as collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE 'nilecare_%'
ORDER BY SCHEMA_NAME;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'All NileCare service databases created successfully!' as status;

