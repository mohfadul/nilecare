-- ============================================================================
-- NileCare Auth Service - MySQL Database Initialization
-- ============================================================================
-- This script creates the application database user and sets up permissions
-- It runs automatically when the MySQL container starts for the first time
-- ============================================================================

-- Create the nilecare_auth database if it doesn't exist
CREATE DATABASE IF NOT EXISTS nilecare_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Use the database
USE nilecare_auth;

-- Create the application user with proper permissions
-- Note: This will only work if the user doesn't exist
-- The password should match the MYSQL_PASSWORD in docker-compose.yml
CREATE USER IF NOT EXISTS 'nilecare_user'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';

-- Grant all privileges on the nilecare_auth database to the application user
GRANT ALL PRIVILEGES ON nilecare_auth.* TO 'nilecare_user'@'%';

-- Allow the application user to manage its own sessions
GRANT SELECT ON mysql.user TO 'nilecare_user'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Log successful initialization
SELECT 'Database initialization completed successfully' AS status,
       'nilecare_auth' AS database_name,
       'nilecare_user' AS app_user,
       NOW() AS timestamp;

