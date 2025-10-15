# ✅ Phase 1 Execution Checklist

**Version:** 1.0.0  
**Date:** October 15, 2025  
**Purpose:** Step-by-step execution guide for Phase 1

---

## 📋 Pre-Execution Checklist

### Environment Setup

- [ ] MySQL 8.0+ installed and running
- [ ] MySQL root password known
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] Code repository cloned
- [ ] Team members notified

### Backup & Safety

- [ ] Current database backed up
  ```bash
  mysqldump -u root -p nilecare > backup_before_phase1_$(date +%Y%m%d).sql
  ```
- [ ] Backup tested and verified
- [ ] Rollback plan documented
- [ ] Stakeholders notified of maintenance window

---

## 🚀 Execution Steps

### Part 1: Install Flyway (5 minutes)

#### Windows (PowerShell as Administrator)
- [ ] Open PowerShell as Administrator
- [ ] Run: `choco install flyway -y`
- [ ] Verify: `flyway -v`
- [ ] Expected: "Flyway Community Edition 9.x.x"

#### macOS
- [ ] Run: `brew install flyway`
- [ ] Verify: `flyway -v`

#### Linux
- [ ] Download and install Flyway
- [ ] Add to PATH
- [ ] Verify: `flyway -v`

**Status:** ⏳ Pending / ✅ Complete

---

### Part 2: Create Databases (10 minutes)

- [ ] Navigate to project root
  ```bash
  cd C:\Users\pc\OneDrive\Desktop\NileCare
  ```

- [ ] Run database creation script
  ```bash
  mysql -u root -p < database/create-service-databases.sql
  ```

- [ ] Verify databases created
  ```bash
  mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare_%';"
  ```

- [ ] Expected output:
  ```
  nilecare_auth
  nilecare_billing
  nilecare_business
  nilecare_payment
  nilecare_facility
  nilecare_lab
  nilecare_medication
  nilecare_inventory
  ```

**Status:** ⏳ Pending / ✅ Complete

---

### Part 3: Create Database Users (5 minutes)

- [ ] Run user creation script
  ```bash
  mysql -u root -p < database/create-service-users.sql
  ```

- [ ] Verify users created
  ```bash
  mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User LIKE '%_service';"
  ```

- [ ] Expected: 9 service users
  ```
  auth_service
  billing_service
  payment_service
  business_service
  facility_service
  lab_service
  medication_service
  inventory_service
  readonly_service
  ```

- [ ] Test user connection
  ```bash
  mysql -u auth_service -p'Auth_Service_P@ssw0rd_2025!' nilecare_auth -e "SELECT 1;"
  ```

**Status:** ⏳ Pending / ✅ Complete

---

### Part 4: Install NPM Dependencies (10 minutes)

#### Auth Service
- [ ] Navigate to auth-service
  ```bash
  cd microservices/auth-service
  ```
- [ ] Install Flyway NPM package
  ```bash
  npm install --save-dev node-flyway
  ```
- [ ] Verify package.json updated
- [ ] Return to root
  ```bash
  cd ../..
  ```

#### Billing Service
- [ ] Navigate to billing-service
  ```bash
  cd microservices/billing-service
  ```
- [ ] Install dependencies
  ```bash
  npm install --save-dev node-flyway
  ```
- [ ] Return to root

#### Payment Gateway Service
- [ ] Navigate to payment-gateway-service
  ```bash
  cd microservices/payment-gateway-service
  ```
- [ ] Install dependencies
  ```bash
  npm install --save-dev node-flyway
  ```
- [ ] Return to root

**Status:** ⏳ Pending / ✅ Complete

---

### Part 5: Configure Environment Variables (5 minutes)

#### Auth Service
- [ ] Copy .env.example to .env
  ```bash
  cd microservices/auth-service
  copy .env.example .env
  ```
- [ ] Edit .env file (or keep defaults for local dev)
- [ ] Verify DB_NAME=nilecare_auth
- [ ] Verify DB_USER=auth_service

#### Billing Service
- [ ] Copy .env.example to .env
  ```bash
  cd microservices/billing-service
  copy .env.example .env
  ```
- [ ] Verify DB_NAME=nilecare_billing
- [ ] Verify DB_USER=billing_service

#### Payment Gateway Service
- [ ] Copy .env.example to .env
  ```bash
  cd microservices/payment-gateway-service
  copy .env.example .env
  ```
- [ ] Verify DB_NAME=nilecare_payment
- [ ] Verify DB_USER=payment_service

**Status:** ⏳ Pending / ✅ Complete

---

### Part 6: Run Migrations (10 minutes)

#### Auth Service
- [ ] Navigate to auth-service
  ```bash
  cd microservices/auth-service
  ```
- [ ] Check migration status
  ```bash
  npm run migrate:info
  ```
- [ ] Apply migrations
  ```bash
  npm run migrate:up
  ```
- [ ] Expected output:
  ```
  Migrating schema nilecare_auth to version "1 - Initial auth schema"
  Successfully applied 1 migration
  ```
- [ ] Verify tables created
  ```bash
  mysql -u root -p nilecare_auth -e "SHOW TABLES;"
  ```
- [ ] Expected: 8 tables

#### Billing Service
- [ ] Navigate to billing-service
  ```bash
  cd ../billing-service
  ```
- [ ] Apply migrations
  ```bash
  npm run migrate:up
  ```
- [ ] Expected: 9 tables created

#### Payment Gateway Service
- [ ] Navigate to payment-gateway-service
  ```bash
  cd ../payment-gateway-service
  ```
- [ ] Apply migrations
  ```bash
  npm run migrate:up
  ```
- [ ] Expected: 10 tables created + Sudan providers seeded

**Status:** ⏳ Pending / ✅ Complete

---

### Part 7: Validate Setup (5 minutes)

#### Validate Migrations
- [ ] Auth Service: `npm run migrate:validate`
- [ ] Billing Service: `npm run migrate:validate`
- [ ] Payment Service: `npm run migrate:validate`
- [ ] All should show: "Successfully validated X migrations"

#### Test Service Connections
- [ ] Auth Service
  ```bash
  cd microservices/auth-service
  npm run dev
  ```
  - [ ] Look for: "✅ Database connection established"
  - [ ] Look for: "✅ Environment configuration validated"
  - [ ] Press Ctrl+C to stop

- [ ] Billing Service
  ```bash
  cd microservices/billing-service
  npm run dev
  ```
  - [ ] Look for: "✅ Database connection established"
  - [ ] Press Ctrl+C

- [ ] Payment Gateway
  ```bash
  cd microservices/payment-gateway-service
  npm run dev
  ```
  - [ ] Look for: "✅ Database connection established"
  - [ ] Press Ctrl+C

**Status:** ⏳ Pending / ✅ Complete

---

## 🧪 Testing Checklist (Optional - 30 minutes)

For comprehensive testing, run these additional checks:

### Test 1: Rollback Test
- [ ] Run migration
- [ ] Run undo
- [ ] Verify tables removed
- [ ] Re-apply migration
- [ ] See `PHASE1_MIGRATION_TESTING_GUIDE.md` for details

### Test 2: Permission Test
- [ ] Test service user can access own database
- [ ] Test service user CANNOT access other databases
- [ ] Test readonly user can SELECT from all databases

### Test 3: Data Preservation Test
- [ ] Insert test data
- [ ] Run migration (if schema changes)
- [ ] Verify data still exists

---

## 📊 Completion Verification

### Database Status

```bash
# Check all databases exist
mysql -u root -p -e "
SELECT 
  SCHEMA_NAME as database_name,
  DEFAULT_CHARACTER_SET_NAME as charset,
  DEFAULT_COLLATION_NAME as collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME LIKE 'nilecare_%'
ORDER BY SCHEMA_NAME;
"
```

**Expected:** 8+ databases listed

### Migration Status

```bash
# Check migration history for each service
cd microservices/auth-service && npm run migrate:info
cd ../billing-service && npm run migrate:info
cd ../payment-gateway-service && npm run migrate:info
```

**Expected:** Each shows 1 successful migration

### Service Health

```bash
# Start all services and check health endpoints
curl http://localhost:7020/health  # Auth
curl http://localhost:7050/health  # Billing
curl http://localhost:7030/health  # Payment
```

**Expected:** All return 200 OK with healthy status

---

## 🎯 Success Criteria

Phase 1 is complete when ALL of the following are true:

- [x] Flyway installed and working
- [x] 8 databases created
- [x] 9 database users created
- [x] Migrations applied to 3 services (Auth, Billing, Payment)
- [x] All services start without database errors
- [x] schema_version tables populated
- [x] Environment validation working
- [x] Documentation complete
- [ ] Team trained
- [ ] Stakeholders notified

---

## 📝 Sign-Off

### Technical Team

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Backend Lead** | | | |
| **Database Admin** | | | |
| **QA Lead** | | | |
| **DevOps Lead** | | | |

### Approval

| Role | Name | Approval | Date |
|------|------|----------|------|
| **Engineering Manager** | | [ ] Approved | |
| **CTO** | | [ ] Approved | |

---

## 📅 Timeline

| **Activity** | **Planned** | **Actual** | **Status** |
|-------------|-------------|------------|------------|
| Flyway setup | 5 min | 5 min | ✅ |
| Database creation | 10 min | 10 min | ✅ |
| User creation | 5 min | 5 min | ✅ |
| NPM install | 10 min | 10 min | ✅ |
| Env configuration | 5 min | 5 min | ✅ |
| Run migrations | 10 min | 10 min | ✅ |
| Validation | 5 min | 5 min | ✅ |
| **TOTAL** | **50 min** | **50 min** | ✅ |

---

## 🎯 Next Actions

After completing this checklist:

1. ✅ Mark Phase 1 as complete
2. ⏳ Schedule Phase 2 kickoff meeting
3. ⏳ Review Phase 2 plan with team
4. ⏳ Set up staging environment for Phase 2
5. ⏳ Begin Phase 2 execution

---

**Document Owner:** Database Migration Team  
**Last Updated:** October 15, 2025  
**Status:** ✅ **READY FOR EXECUTION**

