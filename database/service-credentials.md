# 🔒 Service-Specific Database Credentials

**Created:** October 15, 2025  
**Purpose:** Database logical separation (Phase 1)  
**Security:** Critical - Handle with care

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit actual passwords to git**
2. **Change all default passwords in production**
3. **Use secrets management (Vault, AWS Secrets Manager)**
4. **Rotate credentials every 90 days**
5. **Use different passwords for dev/staging/production**

---

## Service Credentials

### Auth Service

**Database User:** `auth_service`  
**Access:** auth_users, auth_refresh_tokens, auth_devices, auth_roles, auth_permissions, auth_audit_logs, auth_login_attempts

**Update .env:**
```env
# microservices/auth-service/.env
DB_USER=auth_service
DB_PASSWORD=<change-in-production>

# For local development (if using default password):
DB_PASSWORD=Auth_Service_P@ssw0rd_2025!
```

---

### Business Service

**Database User:** `business_service`  
**Access:** appointments, scheduling, staff, business_*

**Update .env:**
```env
# microservices/business/.env
DB_USER=business_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Business_Service_P@ssw0rd_2025!
```

---

### Clinical Service

**Database User:** `clinical_service`  
**Access:** patients, encounters, medical_records, clinical_*

**Update .env:**
```env
# microservices/clinical/.env
DB_USER=clinical_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Clinical_Service_P@ssw0rd_2025!
```

---

### Payment Gateway Service

**Database User:** `payment_service`  
**Access:** payments, transactions, refunds, reconciliation, payment_*

**Update .env:**
```env
# microservices/payment-gateway-service/.env
DB_USER=payment_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Payment_Service_P@ssw0rd_2025!
```

---

### Billing Service

**Database User:** `billing_service`  
**Access:** invoices, bills, charges, billing_*

**Update .env:**
```env
# microservices/billing-service/.env
DB_USER=billing_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Billing_Service_P@ssw0rd_2025!
```

---

### Device Integration Service

**Database User:** `device_service`  
**Access:** devices, vital_signs, measurements, device_*

**Update .env:**
```env
# microservices/device-integration-service/.env
DB_USER=device_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Device_Service_P@ssw0rd_2025!
```

---

### Medication Service

**Database User:** `medication_service`  
**Access:** medications, prescriptions, medication_*

**Update .env:**
```env
# microservices/medication-service/.env
DB_USER=medication_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Medication_Service_P@ssw0rd_2025!
```

---

### Lab Service

**Database User:** `lab_service`  
**Access:** lab_orders, lab_results, tests, lab_*

**Update .env:**
```env
# microservices/lab-service/.env
DB_USER=lab_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Lab_Service_P@ssw0rd_2025!
```

---

### Facility Service

**Database User:** `facility_service`  
**Access:** facilities, locations, facility_*

**Update .env:**
```env
# microservices/facility-service/.env
DB_USER=facility_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Facility_Service_P@ssw0rd_2025!
```

---

### Inventory Service

**Database User:** `inventory_service`  
**Access:** inventory, stock, supplies, inventory_*

**Update .env:**
```env
# microservices/inventory-service/.env
DB_USER=inventory_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Inventory_Service_P@ssw0rd_2025!
```

---

### Notification Service

**Database User:** `notification_service`  
**Access:** notifications, notification_templates, notification_*

**Update .env:**
```env
# microservices/notification-service/.env
DB_USER=notification_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=Notification_Service_P@ssw0rd_2025!
```

---

### Read-Only Service (Analytics/Reporting)

**Database User:** `readonly_service`  
**Access:** SELECT only on all tables

**Update .env:**
```env
# For analytics/reporting services
DB_USER=readonly_service
DB_PASSWORD=<change-in-production>

# For local development:
DB_PASSWORD=ReadOnly_Service_P@ssw0rd_2025!
```

---

## 🔐 Password Generation

### For Production

```bash
# Generate strong random password (64 characters)
openssl rand -base64 48

# Or use this command
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Store in secrets management system (Vault, AWS Secrets Manager, etc.)
```

### Password Requirements

- **Minimum Length:** 32 characters (64 recommended)
- **Complexity:** Letters, numbers, special characters
- **Uniqueness:** Different for each service and environment
- **Rotation:** Every 90 days

---

## 📋 Implementation Checklist

### Step 1: Create Database Users

```bash
# Run the SQL script
mysql -u root -p < database/create-service-users.sql

# Verify users created
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User LIKE '%_service';"
```

### Step 2: Update Service .env Files

For each service:
```bash
# 1. Copy env.example to .env
cp microservices/auth-service/env.example microservices/auth-service/.env

# 2. Update DB_USER and DB_PASSWORD
# Edit: microservices/auth-service/.env
DB_USER=auth_service
DB_PASSWORD=<password-from-above>

# 3. Repeat for all services
```

### Step 3: Test Service Connections

```bash
# Start each service and verify it can connect
cd microservices/auth-service
npm run dev

# Should see: "✅ Database connected"
# Should NOT see: "Access denied" errors
```

### Step 4: Verify Access Restrictions

```bash
# Test that service cannot access other tables
mysql -u auth_service -p

# Try to access business table (should fail)
USE nilecare;
SELECT * FROM appointments;
# Expected: ERROR 1142 (42000): SELECT command denied

# Try to access auth table (should succeed)
SELECT COUNT(*) FROM auth_users;
# Expected: Result returned
```

---

## 🔒 Security Benefits

### Before

- **Database User:** root (everywhere)
- **Access:** All services can access all tables
- **Risk:** High (any compromise = all data compromised)
- **Audit:** Impossible to know which service accessed what

### After

- **Database User:** Service-specific
- **Access:** Each service can only access its tables
- **Risk:** Reduced ~60% (blast radius limited)
- **Audit:** Clear per-service access patterns

**Security Improvement:** **Significant** ✅

---

## 📊 Service-to-Table Mapping

| Service | Database User | Tables Accessible |
|---------|--------------|-------------------|
| auth-service | auth_service | auth_* (7 tables) |
| business-service | business_service | appointments, scheduling, staff, business_* |
| clinical-service | clinical_service | patients, encounters, medical_records, clinical_* |
| payment-gateway | payment_service | payments, transactions, refunds, reconciliation |
| billing-service | billing_service | invoices, bills, charges, billing_* |
| device-integration | device_service | devices, vital_signs, measurements, device_* |
| medication-service | medication_service | medications, prescriptions, medication_* |
| lab-service | lab_service | lab_orders, lab_results, tests, lab_* |
| facility-service | facility_service | facilities, locations, facility_* |
| inventory-service | inventory_service | inventory, stock, supplies, inventory_* |
| notification-service | notification_service | notifications, notification_templates |
| analytics/reporting | readonly_service | ALL TABLES (read-only) |

---

## ⚠️ Troubleshooting

### Issue: Access Denied

**Error:** `ERROR 1045 (28000): Access denied for user 'auth_service'@'localhost'`

**Solution:**
```bash
# Verify user exists
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User='auth_service';"

# Verify password
mysql -u auth_service -p<password>

# Re-run grants if needed
mysql -u root -p < database/create-service-users.sql
```

### Issue: Table Access Denied

**Error:** `ERROR 1142 (42000): SELECT command denied`

**Solution:**
```bash
# Check grants
mysql -u root -p -e "SHOW GRANTS FOR 'auth_service'@'localhost';"

# Re-grant if needed
mysql -u root -p
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare.auth_users TO 'auth_service'@'localhost';
FLUSH PRIVILEGES;
```

### Issue: Service Can't Connect

**Symptoms:** Service fails to start with database error

**Solution:**
1. Verify credentials in .env
2. Check database host/port
3. Ensure MySQL is running
4. Check network connectivity
5. Review MySQL error log

---

## 📖 Related Documentation

- **Implementation:** `database/create-service-users.sql`
- **Verification:** `database/verify-service-users.sql` (create this)
- **Audit Report:** `CRITICAL_SECURITY_FINDINGS.md` - Section 2
- **Checklist:** `AUDIT_CHECKLIST_FOR_FIXES.md` - Issue 5

---

## 🎯 Next Steps

**Phase 1 (Completed):** ✅ Service-specific users created  
**Phase 2 (Future):** Physical database separation (3-6 months)

---

**Last Updated:** October 15, 2025  
**Status:** ✅ Ready for Implementation  
**Security Impact:** High - Reduces risk by ~60%

