# 🚀 NileCare Database Migration & Version Control Guide

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Status:** ✅ **PRODUCTION READY**

---

## 📋 Overview

This guide establishes the **official database migration strategy** for the NileCare Healthcare Platform. All database schema changes MUST follow this process to ensure consistency, traceability, and reliability across all environments.

---

## 🎯 Migration Framework: Flyway

### Why Flyway?

✅ **Database-agnostic** (MySQL, PostgreSQL, MongoDB)  
✅ **Production-proven** (used by Netflix, Airbnb, Box)  
✅ **Simple** (SQL-based migrations)  
✅ **Version control** (automatic tracking)  
✅ **Rollback support** (with undo migrations)  
✅ **CI/CD integration** (automated deployments)

**Official Site:** https://flywaydb.org

---

## 📦 Installation & Setup

### Global Installation

```bash
# macOS (Homebrew)
brew install flyway

# Linux (apt)
sudo apt-get install flyway

# Windows (Chocolatey)
choco install flyway

# NPM (all platforms)
npm install -g node-flyway
```

### Per-Service Installation

```bash
cd microservices/auth-service
npm install --save-dev node-flyway
```

### Verification

```bash
flyway -v
# Output: Flyway Community Edition 9.x.x
```

---

## 🏗️ Migration Directory Structure

### Standard Structure (Per Service)

```
microservices/
├── auth-service/
│   ├── migrations/
│   │   ├── V1__Initial_schema.sql
│   │   ├── V2__Add_mfa_support.sql
│   │   ├── V3__Add_audit_logging.sql
│   │   ├── U1__Rollback_initial_schema.sql
│   │   ├── U2__Rollback_mfa_support.sql
│   │   ├── R__Create_views.sql
│   │   └── R__Seed_default_roles.sql
│   ├── flyway.conf
│   └── package.json
```

### Migration File Types

| **Prefix** | **Type** | **Purpose** | **Execution** |
|------------|----------|-------------|---------------|
| `V` | Versioned | Schema changes | Once, in order |
| `U` | Undo | Rollback versioned migration | Manual rollback |
| `R` | Repeatable | Views, procedures, seed data | Every time checksum changes |

---

## 📝 Migration Naming Convention

### Standard Format

**Versioned Migrations:**
```
V{version}__{description}.sql
```

**Examples:**
```sql
V1__Initial_schema.sql
V2__Add_mfa_support.sql
V3__Add_password_reset.sql
V4__Add_device_tracking.sql
V5__Add_audit_logging.sql
V6__Modify_user_constraints.sql
V7__Add_two_factor_authentication.sql
V8__Create_refresh_tokens_table.sql
```

**Timestamp-Based (Recommended for teams):**
```
V{YYYYMMDD_HHMMSS}__{description}.sql
```

**Examples:**
```sql
V20251015_100000__Initial_schema.sql
V20251015_110000__Add_mfa_support.sql
V20251015_120000__Add_audit_logging.sql
V20251016_090000__Add_password_complexity.sql
```

### Undo Migrations

**Format:** `U{version}__{description}.sql`

```sql
U1__Rollback_initial_schema.sql
U2__Rollback_mfa_support.sql
```

**Content:** Reverse operations of corresponding `V` migration

### Repeatable Migrations

**Format:** `R__{description}.sql`

```sql
R__Create_views.sql
R__Create_stored_procedures.sql
R__Seed_default_roles.sql
R__Update_statistics.sql
```

---

## ⚙️ Flyway Configuration

### Configuration File: `flyway.conf`

**Location:** `microservices/{service}/flyway.conf`

```properties
# ============================================================
# Flyway Configuration - Auth Service
# ============================================================

# Database connection
flyway.url=jdbc:mysql://localhost:3306/nilecare_auth
flyway.user=${DB_USER}
flyway.password=${DB_PASSWORD}

# Migration locations
flyway.locations=filesystem:./migrations

# Schema history table
flyway.table=schema_version

# Encoding
flyway.encoding=UTF-8

# Validate migrations
flyway.validateOnMigrate=true

# Out of order
flyway.outOfOrder=false

# Placeholders
flyway.placeholders.service_name=auth_service
flyway.placeholders.env=${ENVIRONMENT}

# Mixed mode (SQL + Java-based migrations)
flyway.mixed=false

# Baseline
flyway.baselineOnMigrate=true
flyway.baselineVersion=0
flyway.baselineDescription=Baseline

# Callbacks
flyway.callbacks=

# Clean (disable in production!)
flyway.cleanDisabled=true
flyway.cleanOnValidationError=false
```

### Environment-Specific Configuration

**Development:** `flyway-dev.conf`
```properties
flyway.url=jdbc:mysql://localhost:3306/nilecare_auth_dev
flyway.user=auth_service_dev
flyway.password=${DB_PASSWORD_DEV}
flyway.cleanDisabled=false
```

**Staging:** `flyway-staging.conf`
```properties
flyway.url=jdbc:mysql://staging-db.nilecare.sd:3306/nilecare_auth
flyway.user=auth_service_staging
flyway.password=${DB_PASSWORD_STAGING}
flyway.cleanDisabled=true
```

**Production:** `flyway-prod.conf`
```properties
flyway.url=jdbc:mysql://prod-db.nilecare.sd:3306/nilecare_auth
flyway.user=auth_service_prod
flyway.password=${DB_PASSWORD_PROD}
flyway.cleanDisabled=true
flyway.validateOnMigrate=true
```

---

## 🔧 NPM Scripts Setup

### Update `package.json`

```json
{
  "name": "nilecare-auth-service",
  "scripts": {
    "migrate:info": "flyway -configFiles=flyway.conf info",
    "migrate:validate": "flyway -configFiles=flyway.conf validate",
    "migrate:up": "flyway -configFiles=flyway.conf migrate",
    "migrate:undo": "flyway -configFiles=flyway.conf undo",
    "migrate:clean": "flyway -configFiles=flyway.conf clean",
    "migrate:baseline": "flyway -configFiles=flyway.conf baseline",
    "migrate:repair": "flyway -configFiles=flyway.conf repair",
    
    "migrate:dev": "flyway -configFiles=flyway-dev.conf migrate",
    "migrate:staging": "flyway -configFiles=flyway-staging.conf migrate",
    "migrate:prod": "flyway -configFiles=flyway-prod.conf migrate"
  }
}
```

---

## 🚀 Running Migrations

### Check Migration Status

```bash
# Show current migration status
npm run migrate:info

# Output:
# +-----------+--------------+---------------------+---------+
# | Category  | Version      | Description         | Status  |
# +-----------+--------------+---------------------+---------+
# | Versioned | 1            | Initial schema      | Success |
# | Versioned | 2            | Add mfa support     | Success |
# | Versioned | 3            | Add audit logging   | Pending |
# +-----------+--------------+---------------------+---------+
```

### Apply Migrations

```bash
# Apply all pending migrations
npm run migrate:up

# Output:
# Migrating schema `nilecare_auth` to version "3 - Add audit logging"
# Successfully applied 1 migration to schema `nilecare_auth`
```

### Validate Migrations

```bash
# Validate applied migrations match migration files
npm run migrate:validate

# Output:
# Successfully validated 3 migrations
```

### Undo Last Migration (Rollback)

```bash
# Rollback last migration
npm run migrate:undo

# Output:
# Undoing migration of schema `nilecare_auth` to version "3 - Add audit logging"
# Successfully undone 1 migration
```

### Baseline Existing Database

```bash
# Mark current state as baseline (for existing databases)
npm run migrate:baseline

# Output:
# Creating Schema History table `nilecare_auth`.`schema_version` with baseline ...
# Successfully baselined schema with version: 1
```

### Repair (Fix broken state)

```bash
# Repair schema history table
npm run migrate:repair

# Output:
# Repair not necessary. No failed migrations detected.
```

### Clean (⚠️ DANGEROUS - Development only)

```bash
# Drop all objects in schema (ONLY in development!)
npm run migrate:clean

# Output:
# WARNING: This will DROP all objects in schema 'nilecare_auth'
# Cleaned database schema 'nilecare_auth'
```

---

## 📝 Writing Migration Scripts

### Versioned Migration Example

**File:** `V1__Initial_schema.sql`

```sql
-- ============================================================
-- Auth Service - Initial Schema
-- Version: 1
-- Description: Create core authentication tables
-- Author: Database Team
-- Date: 2025-10-15
-- ============================================================

-- Users table
CREATE TABLE auth_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
  
  -- MFA fields
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  
  -- Security fields
  failed_login_attempts INT DEFAULT 0,
  last_failed_login TIMESTAMP NULL,
  account_locked_until TIMESTAMP NULL,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_auth_users_email (email),
  INDEX idx_auth_users_username (username),
  INDEX idx_auth_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE auth_refresh_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(500) UNIQUE NOT NULL,
  user_id CHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  INDEX idx_auth_refresh_tokens_user (user_id),
  INDEX idx_auth_refresh_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default data
INSERT INTO auth_users (id, email, username, password_hash, first_name, last_name, role, status)
VALUES 
  (UUID(), 'admin@nilecare.sd', 'admin', '$2b$10$...', 'System', 'Admin', 'admin', 'active');

-- Log migration
SELECT 'Migration V1 completed successfully' as status;
```

### Undo Migration Example

**File:** `U1__Rollback_initial_schema.sql`

```sql
-- ============================================================
-- Auth Service - Rollback Initial Schema
-- Version: U1
-- Description: Undo V1 - Drop authentication tables
-- ============================================================

-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS auth_refresh_tokens;
DROP TABLE IF EXISTS auth_users;

-- Log rollback
SELECT 'Migration U1 rollback completed successfully' as status;
```

### Repeatable Migration Example

**File:** `R__Create_views.sql`

```sql
-- ============================================================
-- Auth Service - Create Views
-- Repeatable Migration
-- Description: Create/replace views for reporting
-- ============================================================

-- Active users view
CREATE OR REPLACE VIEW v_active_users AS
SELECT 
  id,
  email,
  username,
  CONCAT(first_name, ' ', last_name) as full_name,
  role,
  last_login_at,
  created_at
FROM auth_users
WHERE status = 'active' AND is_deleted = FALSE;

-- User sessions view
CREATE OR REPLACE VIEW v_user_sessions AS
SELECT 
  rt.id as session_id,
  u.id as user_id,
  u.email,
  u.username,
  rt.expires_at,
  rt.is_revoked,
  rt.created_at as session_started
FROM auth_refresh_tokens rt
JOIN auth_users u ON rt.user_id = u.id
WHERE rt.is_revoked = FALSE AND rt.expires_at > NOW();

-- Log repeatable migration
SELECT 'Repeatable migration R__Create_views completed' as status;
```

---

## 🔄 Migration Best Practices

### 1. **Always Write Undo Migrations**

```sql
-- V2__Add_column.sql
ALTER TABLE auth_users ADD COLUMN middle_name VARCHAR(50);

-- U2__Rollback_add_column.sql
ALTER TABLE auth_users DROP COLUMN middle_name;
```

### 2. **Use Transactions (MySQL InnoDB, PostgreSQL)**

```sql
START TRANSACTION;

-- Migration statements here
ALTER TABLE auth_users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_auth_users_phone ON auth_users(phone);

COMMIT;
```

### 3. **Make Migrations Idempotent**

```sql
-- ✅ GOOD: Check if exists
CREATE TABLE IF NOT EXISTS auth_devices (...);
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_phone ON auth_users(phone);

-- ❌ BAD: Will fail if already exists
CREATE TABLE auth_devices (...);
ALTER TABLE auth_users ADD COLUMN phone VARCHAR(20);
```

### 4. **Separate Data from Schema Changes**

```sql
-- V3__Add_roles_table.sql (schema)
CREATE TABLE auth_roles (...);

-- R__Seed_default_roles.sql (data - repeatable)
INSERT INTO auth_roles (name, description) VALUES
  ('admin', 'System Administrator'),
  ('doctor', 'Healthcare Provider')
ON DUPLICATE KEY UPDATE description=VALUES(description);
```

### 5. **Add Comments**

```sql
-- ============================================================
-- Migration: Add MFA Support
-- Version: V2
-- Author: Security Team
-- Date: 2025-10-15
-- Ticket: SEC-1234
-- ============================================================

ALTER TABLE auth_users 
  ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE COMMENT 'Multi-factor authentication enabled',
  ADD COLUMN mfa_secret VARCHAR(255) COMMENT 'TOTP secret for authenticator apps';

-- Add index for MFA lookups
CREATE INDEX idx_auth_users_mfa ON auth_users(mfa_enabled);
```

### 6. **Test Before Applying**

```bash
# Test on local database first
npm run migrate:info
npm run migrate:validate
npm run migrate:up

# If success, test undo
npm run migrate:undo
npm run migrate:up
```

### 7. **Handle Large Data Migrations**

```sql
-- V4__Migrate_user_data.sql
-- For large tables, batch process

-- Create backup
CREATE TABLE auth_users_backup AS SELECT * FROM auth_users;

-- Migrate in batches (10000 at a time)
SET @batch_size = 10000;
SET @offset = 0;

WHILE @offset < (SELECT COUNT(*) FROM auth_users) DO
  -- Process batch
  UPDATE auth_users
  SET new_column = calculate_value(old_column)
  WHERE id IN (
    SELECT id FROM auth_users 
    ORDER BY id 
    LIMIT @batch_size OFFSET @offset
  );
  
  SET @offset = @offset + @batch_size;
  
  -- Log progress
  SELECT CONCAT('Processed ', @offset, ' rows') as progress;
  
  -- Brief pause to avoid overloading
  DO SLEEP(0.1);
END WHILE;
```

---

## 🧪 Testing Migrations

### Local Testing

```bash
# 1. Create test database
mysql -u root -p -e "CREATE DATABASE nilecare_auth_test;"

# 2. Update flyway-test.conf
flyway.url=jdbc:mysql://localhost:3306/nilecare_auth_test

# 3. Run migration
flyway -configFiles=flyway-test.conf migrate

# 4. Verify tables created
mysql -u root -p nilecare_auth_test -e "SHOW TABLES;"

# 5. Test rollback
flyway -configFiles=flyway-test.conf undo

# 6. Cleanup
mysql -u root -p -e "DROP DATABASE nilecare_auth_test;"
```

### Automated Testing (CI/CD)

```yaml
# .github/workflows/test-migrations.yml
name: Test Database Migrations

on: [push, pull_request]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: nilecare_auth_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Flyway
        run: |
          wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.16.0/flyway-commandline-9.16.0-linux-x64.tar.gz | tar xvz
          sudo ln -s $(pwd)/flyway-9.16.0/flyway /usr/local/bin 
      
      - name: Run migrations
        run: |
          cd microservices/auth-service
          flyway -configFiles=flyway-test.conf migrate
      
      - name: Validate migrations
        run: |
          cd microservices/auth-service
          flyway -configFiles=flyway-test.conf validate
      
      - name: Test rollback
        run: |
          cd microservices/auth-service
          flyway -configFiles=flyway-test.conf undo
```

---

## 🚨 Migration Checklist

Before creating a migration:

- [ ] Migration file follows naming convention (`V{version}__{description}.sql`)
- [ ] Undo migration created (`U{version}__*.sql`)
- [ ] Migration is idempotent (uses `IF NOT EXISTS`, `IF EXISTS`)
- [ ] Transaction used (if supported)
- [ ] Comments explain what and why
- [ ] Tested locally
- [ ] Peer reviewed
- [ ] Indexes created for new columns
- [ ] Foreign key constraints correct
- [ ] Default values set appropriately
- [ ] Data migration batched for large tables
- [ ] Backward compatible (if required)

---

## 🔐 Security Considerations

### 1. **Never Commit Passwords**

```properties
# ❌ BAD
flyway.password=SuperSecret123

# ✅ GOOD
flyway.password=${DB_PASSWORD}
```

### 2. **Restrict Migration Execution**

```bash
# Production migrations should only be executed by:
# - Authorized DBAs
# - CI/CD pipeline with approval gates
# - Never manually by developers
```

### 3. **Audit Migration Execution**

```sql
-- Schema version table tracks:
-- - Which migrations applied
-- - When applied
-- - By whom
-- - Success/failure

SELECT * FROM schema_version ORDER BY installed_rank DESC;
```

### 4. **Backup Before Migration**

```bash
# Always backup before production migration
mysqldump -u root -p nilecare_auth > backup_before_migration_v5.sql

# Run migration
npm run migrate:prod

# If rollback needed:
mysql -u root -p nilecare_auth < backup_before_migration_v5.sql
```

---

## 📊 Migration Workflow

### Development

```
1. Developer writes migration (V{n}__*.sql)
2. Developer writes undo migration (U{n}__*.sql)
3. Test locally
4. Commit to feature branch
5. Create pull request
6. Peer review
7. CI/CD runs automated tests
8. Merge to main
```

### Staging Deployment

```
1. Pull latest code
2. Review pending migrations: npm run migrate:info
3. Backup database
4. Run migrations: npm run migrate:staging
5. Validate: npm run migrate:validate
6. Run integration tests
7. Sign off for production
```

### Production Deployment

```
1. Create maintenance window
2. Notify stakeholders
3. Backup database
4. Review migration plan
5. Execute migration with approval
6. Monitor application health
7. Rollback if issues detected
8. Document execution
```

---

## 🛠️ Troubleshooting

### Issue: Migration Failed

```bash
# Check status
npm run migrate:info

# Repair (mark failed migration as resolved)
npm run migrate:repair

# Re-run migration
npm run migrate:up
```

### Issue: Checksum Mismatch

```
ERROR: Migration checksum mismatch for migration version 2
```

**Cause:** Migration file was modified after being applied.

**Solution:**
```bash
# Option 1: Repair (if intentional)
npm run migrate:repair

# Option 2: Create new migration (recommended)
# - Don't modify existing migrations
# - Create V{n+1}__Fix_previous_migration.sql
```

### Issue: Out of Order Migrations

**Cause:** Developer created V5 before V4 was merged.

**Solution:**
```properties
# Allow out-of-order migrations (not recommended for production)
flyway.outOfOrder=true
```

**Better Solution:** Rename migration to next available version.

---

## 📚 Additional Resources

- **Flyway Documentation:** https://flywaydb.org/documentation/
- **Flyway Tutorials:** https://flywaydb.org/documentation/tutorials/
- **Best Practices:** https://flywaydb.org/documentation/bestpractices
- **MySQL Migration Guide:** https://flywaydb.org/documentation/database/mysql

---

## ✅ Summary

**Key Takeaways:**

1. ✅ Use Flyway for all database migrations
2. ✅ Follow `V{version}__{description}.sql` naming
3. ✅ Always write undo migrations
4. ✅ Test migrations locally before deploying
5. ✅ Never modify applied migrations
6. ✅ Backup before production migrations
7. ✅ Use transactions for atomic changes
8. ✅ Make migrations idempotent
9. ✅ Batch large data migrations
10. ✅ Document all migrations

**Next Steps:**
1. Install Flyway in each microservice
2. Create initial baseline migration
3. Convert existing SQL scripts to Flyway migrations
4. Test migration workflow
5. Integrate with CI/CD pipeline

---

**Document Owner:** Database Team  
**Last Updated:** October 15, 2025  
**Next Review:** January 15, 2026

