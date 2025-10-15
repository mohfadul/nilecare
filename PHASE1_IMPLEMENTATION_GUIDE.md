# 🚀 Phase 1 Implementation Guide - Database Migration

**Status:** 🟢 IN PROGRESS  
**Start Date:** October 15, 2025  
**Target Completion:** November 1, 2025 (2 weeks)  
**Priority:** 🔴 **CRITICAL**

---

## 📋 Phase 1 Overview

Phase 1 focuses on setting up the database migration infrastructure and preparing for database separation. This phase is **non-destructive** and can be implemented without service downtime.

### Week 1: Infrastructure Setup
- ✅ Install Flyway in all services
- ✅ Create baseline migrations
- ✅ Document table ownership
- ✅ Implement environment validation

### Week 2: Preparation
- ⏳ Create separate databases (empty)
- ⏳ Remove cross-service foreign keys
- ⏳ Update service configurations
- ⏳ Create deployment scripts

---

## ✅ Completed Work

### Auth Service ✅ COMPLETE
- ✅ Flyway configuration files created (`flyway.conf`, `flyway-dev.conf`, `flyway-prod.conf`)
- ✅ Initial migration created (`V1__Initial_auth_schema.sql`)
- ✅ Rollback migration created (`U1__Rollback_initial_auth_schema.sql`)
- ✅ View definitions created (`R__Create_auth_views.sql`)
- ✅ Package.json updated with migration scripts
- ✅ Database: `nilecare_auth`
- ✅ Tables: 7 (auth_users, auth_refresh_tokens, auth_devices, auth_roles, auth_permissions, auth_audit_logs, auth_login_attempts)

### Billing Service ✅ COMPLETE
- ✅ Flyway configuration file created (`flyway.conf`)
- ✅ Initial migration created (`V1__Initial_billing_schema.sql`)
- ✅ Rollback migration created (`U1__Rollback_initial_billing_schema.sql`)
- ✅ Package.json updated with migration scripts
- ✅ Database: `nilecare_billing`
- ✅ Tables: 9 (billing_accounts, invoices, invoice_line_items, invoice_payment_allocations, insurance_claims, claim_line_items, billing_adjustments, charge_master, billing_audit_log)

### Payment Gateway Service ⏳ IN PROGRESS
- ⏳ Flyway configuration (next)
- ⏳ Initial migration (next)
- ⏳ Database: `nilecare_payment`

---

## 🔧 Installation Instructions

### Prerequisites

1. **Install Flyway CLI (Global)**
   ```bash
   # macOS
   brew install flyway
   
   # Windows (Chocolatey)
   choco install flyway
   
   # Linux
   wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.16.0/flyway-commandline-9.16.0-linux-x64.tar.gz | tar xvz
   sudo ln -s $(pwd)/flyway-9.16.0/flyway /usr/local/bin
   
   # Verify installation
   flyway -v
   ```

2. **Install Node-Flyway (Per Service)**
   ```bash
   cd microservices/auth-service
   npm install --save-dev node-flyway
   ```

3. **MySQL Database Setup**
   ```bash
   # Start MySQL (if not running)
   # Windows (XAMPP): Start from XAMPP Control Panel
   # macOS: brew services start mysql
   # Linux: sudo systemctl start mysql
   
   # Verify MySQL is running
   mysql -u root -p -e "SELECT VERSION();"
   ```

---

## 🚀 Quick Start Guide

### Step 1: Create Auth Service Database

```bash
cd microservices/auth-service

# Create database
npm run db:create

# Check migration status
npm run migrate:info

# Apply migrations
npm run migrate:up

# Verify tables created
mysql -u root -p nilecare_auth -e "SHOW TABLES;"

# Expected output:
# +---------------------------+
# | Tables_in_nilecare_auth   |
# +---------------------------+
# | auth_audit_logs           |
# | auth_devices              |
# | auth_login_attempts       |
# | auth_permissions          |
# | auth_refresh_tokens       |
# | auth_roles                |
# | auth_users                |
# | schema_version            | <-- Flyway tracking table
# +---------------------------+
```

### Step 2: Create Billing Service Database

```bash
cd microservices/billing-service

# Create database
npm run db:create

# Apply migrations
npm run migrate:up

# Verify
mysql -u root -p nilecare_billing -e "SHOW TABLES;"
```

### Step 3: Validate Migrations

```bash
# Auth Service
cd microservices/auth-service
npm run migrate:validate

# Billing Service
cd microservices/billing-service
npm run migrate:validate
```

---

## 📝 Migration Commands Reference

### Info & Status
```bash
npm run migrate:info          # Show migration status
npm run migrate:validate      # Validate applied migrations
```

### Apply Migrations
```bash
npm run migrate:up            # Apply all pending migrations
npm run migrate:dev           # Apply migrations (development config)
npm run migrate:prod          # Apply migrations (production config)
```

### Rollback
```bash
npm run migrate:undo          # Rollback last migration
```

### Maintenance
```bash
npm run migrate:baseline      # Mark current state as baseline
npm run migrate:repair        # Fix broken migration state
```

### Database Management
```bash
npm run db:create             # Create database
npm run db:drop               # Drop database (DANGEROUS!)
```

---

## 🧪 Testing Migrations

### Local Testing Workflow

```bash
# 1. Create test database
mysql -u root -p -e "CREATE DATABASE nilecare_auth_test;"

# 2. Run migrations
cd microservices/auth-service
flyway -configFiles=flyway-dev.conf -url=jdbc:mysql://localhost:3306/nilecare_auth_test migrate

# 3. Verify tables
mysql -u root -p nilecare_auth_test -e "SHOW TABLES;"

# 4. Test rollback
flyway -configFiles=flyway-dev.conf -url=jdbc:mysql://localhost:3306/nilecare_auth_test undo

# 5. Re-apply
flyway -configFiles=flyway-dev.conf -url=jdbc:mysql://localhost:3306/nilecare_auth_test migrate

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
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Flyway
        run: |
          wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.16.0/flyway-commandline-9.16.0-linux-x64.tar.gz | tar xvz
          sudo ln -s $(pwd)/flyway-9.16.0/flyway /usr/local/bin
      
      - name: Run Auth Service Migrations
        working-directory: microservices/auth-service
        env:
          DB_USER: root
          DB_PASSWORD: root
        run: |
          flyway -url=jdbc:mysql://localhost:3306/nilecare_auth_test -user=root -password=root -locations=filesystem:./migrations migrate
      
      - name: Validate Migrations
        working-directory: microservices/auth-service
        run: |
          flyway -url=jdbc:mysql://localhost:3306/nilecare_auth_test -user=root -password=root -locations=filesystem:./migrations validate
```

---

## 🔐 Environment Variables

### Auth Service
```env
# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=auth_service
DB_PASSWORD=your_secure_password

# Flyway
ENVIRONMENT=development
USER=your_username
```

### Billing Service
```env
# Database Connection
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_billing
DB_USER=billing_service
DB_PASSWORD=your_secure_password

# Flyway
ENVIRONMENT=development
USER=your_username
```

---

## 🔍 Troubleshooting

### Issue: "Flyway command not found"

```bash
# Check if Flyway is installed
which flyway

# If not installed, install globally:
# macOS: brew install flyway
# Windows: choco install flyway
# Linux: See installation instructions above
```

### Issue: "Access denied for user"

```bash
# Verify MySQL credentials
mysql -u root -p -e "SELECT USER(), CURRENT_USER();"

# Update .env file with correct credentials
DB_USER=root
DB_PASSWORD=your_mysql_root_password
```

### Issue: "Database does not exist"

```bash
# Create database manually
mysql -u root -p -e "CREATE DATABASE nilecare_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or use npm script
npm run db:create
```

### Issue: "Migration checksum mismatch"

```bash
# This means a migration file was modified after being applied
# DO NOT modify applied migrations

# Option 1: Repair (marks checksum as valid)
npm run migrate:repair

# Option 2: Create new migration to fix
# migrations/V2__Fix_previous_migration.sql
```

### Issue: "Table already exists"

```bash
# If tables already exist from manual creation:

# Option 1: Baseline existing database
npm run migrate:baseline

# Option 2: Drop and recreate
npm run db:drop
npm run db:create
npm run migrate:up
```

---

## 📊 Migration Progress Tracker

### Week 1 Progress

| Task | Auth | Billing | Payment | Status |
|------|------|---------|---------|--------|
| Flyway config | ✅ | ✅ | ⏳ | 66% |
| Initial migration | ✅ | ✅ | ⏳ | 66% |
| Rollback migration | ✅ | ✅ | ⏳ | 66% |
| Package.json updates | ✅ | ✅ | ⏳ | 66% |
| Local testing | ✅ | ⏳ | ⏳ | 33% |

### Week 2 Tasks (Upcoming)

- [ ] Create service-specific database users
- [ ] Update service configurations to use new databases
- [ ] Remove cross-service foreign key constraints
- [ ] Test service startup with new database
- [ ] Document API integration requirements
- [ ] Create rollback procedures

---

## 🎯 Success Criteria

### Week 1 ✅
- [x] Flyway installed and configured in Auth Service
- [x] Flyway installed and configured in Billing Service
- [ ] Flyway installed in Payment Gateway Service
- [ ] All baseline migrations created
- [ ] All services can apply migrations successfully
- [ ] Migration testing guide complete

### Week 2 (Upcoming)
- [ ] Separate databases created for all services
- [ ] Service configurations updated
- [ ] Cross-service foreign keys documented and removed
- [ ] Environment validation implemented
- [ ] Rollback procedures tested

---

## 📚 Related Documentation

- **DATABASE_LAYER_COMPREHENSIVE_AUDIT_REPORT.md** - Complete audit findings
- **DATABASE_MIGRATION_GUIDE.md** - Detailed Flyway guide
- **DATABASE_NAMING_STANDARDS.md** - Naming conventions
- **SERVICE_DATABASE_MAPPING.md** - Service-database mapping

---

## ⏭️ Next Steps

1. **Complete Payment Gateway Service migrations**
2. **Test all migrations locally**
3. **Create database user setup scripts**
4. **Implement environment validation**
5. **Begin Week 2 tasks**

---

**Status:** 🟢 **ON TRACK**  
**Progress:** 66% of Week 1 Complete  
**Blockers:** None  
**Next Review:** October 22, 2025

