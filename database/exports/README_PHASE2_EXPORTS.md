# 📦 Phase 2 Data Export/Import Scripts

**Version:** 1.0.0  
**Date:** October 15, 2025  
**Purpose:** Data migration from shared `nilecare` database to service-specific databases

---

## 📋 Overview

This directory contains scripts to export data from the shared `nilecare` database and import into service-specific databases during Phase 2 migration.

---

## ⚠️ CRITICAL WARNINGS

1. **ALWAYS BACKUP BEFORE EXPORT**
2. **TEST IN STAGING FIRST**
3. **VERIFY RECORD COUNTS AFTER IMPORT**
4. **SCHEDULE MAINTENANCE WINDOW**
5. **MONITOR SERVICE HEALTH AFTER MIGRATION**

---

## 🗂️ Export Scripts

### Export All Services (One Command)

```bash
# Create exports directory
mkdir -p database/exports/phase2

# Run master export script
./database/exports/export-all-services.sh
```

### Export Individual Services

#### 1. Auth Service
```bash
mysqldump -u root -p nilecare \
  auth_users auth_refresh_tokens auth_devices \
  auth_roles auth_permissions auth_audit_logs auth_login_attempts \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/auth_data.sql
```

#### 2. Billing Service
```bash
mysqldump -u root -p nilecare \
  invoices invoice_line_items invoice_payment_allocations \
  billing_accounts insurance_claims claim_line_items \
  billing_adjustments charge_master billing_audit_log insurance_policies \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/billing_data.sql
```

#### 3. Payment Gateway
```bash
mysqldump -u root -p nilecare \
  payments payment_providers payment_reconciliation \
  payment_refunds invoice_payments payment_installment_plans \
  installment_schedule payment_webhooks payment_disputes \
  payment_analytics_daily \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/payment_data.sql
```

#### 4. Clinical Service
```bash
mysqldump -u root -p nilecare \
  patients encounters diagnoses allergies \
  procedures immunizations clinical_notes audit_log \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/clinical_data.sql
```

#### 5. Facility Service
```bash
mysqldump -u root -p nilecare \
  facilities departments wards beds facility_settings \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/facility_data.sql
```

#### 6. Lab Service
```bash
mysqldump -u root -p nilecare \
  lab_orders lab_results lab_tests samples \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/lab_data.sql
```

#### 7. Medication Service
```bash
mysqldump -u root -p nilecare \
  medications prescriptions mar_entries \
  high_alert_medications medication_reconciliation \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/medication_data.sql
```

#### 8. Inventory Service
```bash
mysqldump -u root -p nilecare \
  inventory_items inventory_locations inventory_transactions \
  suppliers purchase_orders purchase_order_items \
  --no-create-info --skip-triggers --single-transaction \
  > database/exports/phase2/inventory_data.sql
```

---

## 📥 Import Scripts

### Import to Target Databases

#### Auth Service
```bash
mysql -u root -p nilecare_auth < database/exports/phase2/auth_data.sql
```

#### Billing Service
```bash
mysql -u root -p nilecare_billing < database/exports/phase2/billing_data.sql
```

#### Payment Gateway
```bash
mysql -u root -p nilecare_payment < database/exports/phase2/payment_data.sql
```

#### Clinical Service
```bash
mysql -u root -p nilecare_clinical < database/exports/phase2/clinical_data.sql
```

#### Facility Service
```bash
mysql -u root -p nilecare_facility < database/exports/phase2/facility_data.sql
```

#### Lab Service
```bash
mysql -u root -p nilecare_lab < database/exports/phase2/lab_data.sql
```

#### Medication Service
```bash
mysql -u root -p nilecare_medication < database/exports/phase2/medication_data.sql
```

#### Inventory Service
```bash
mysql -u root -p nilecare_inventory < database/exports/phase2/inventory_data.sql
```

---

## ✅ Verification Scripts

### Verify Record Counts Match

```sql
-- Auth Service
SELECT 'auth_users' as table_name,
       (SELECT COUNT(*) FROM nilecare.auth_users) as source_count,
       (SELECT COUNT(*) FROM nilecare_auth.auth_users) as target_count,
       (SELECT COUNT(*) FROM nilecare.auth_users) = (SELECT COUNT(*) FROM nilecare_auth.auth_users) as match_status;

-- Repeat for all tables
```

### Automated Verification Script

```bash
# database/exports/verify-migration.sh

#!/bin/bash

echo "Verifying data migration..."

tables=(
  "nilecare:auth_users:nilecare_auth:auth_users"
  "nilecare:invoices:nilecare_billing:invoices"
  "nilecare:payments:nilecare_payment:payments"
  # ... add all tables
)

for table in "${tables[@]}"; do
  IFS=':' read -r src_db src_table tgt_db tgt_table <<< "$table"
  
  src_count=$(mysql -u root -p -N -e "SELECT COUNT(*) FROM $src_db.$src_table;")
  tgt_count=$(mysql -u root -p -N -e "SELECT COUNT(*) FROM $tgt_db.$tgt_table;")
  
  if [ "$src_count" -eq "$tgt_count" ]; then
    echo "✅ $src_table: $src_count = $tgt_count"
  else
    echo "❌ $src_table: $src_count != $tgt_count"
  fi
done
```

---

## 🔄 Rollback Procedures

### If Migration Fails

```bash
# 1. Stop affected service
pm2 stop auth-service

# 2. Restore from backup
mysql -u root -p nilecare < backup_before_migration.sql

# 3. Revert service configuration
# Edit .env: DB_NAME=nilecare (back to shared)

# 4. Restart service
pm2 start auth-service

# 5. Investigate and fix issues
```

---

## 📊 Export Statistics

### Expected Data Sizes

| **Service** | **Tables** | **Est. Records** | **Est. Size** |
|------------|-----------|-----------------|---------------|
| Auth | 7 | 10,000+ | 50 MB |
| Billing | 9 | 100,000+ | 500 MB |
| Payment | 10 | 50,000+ | 300 MB |
| Clinical | 8 | 500,000+ | 2 GB |
| Facility | 5 | 1,000+ | 10 MB |
| Lab | 4 | 200,000+ | 800 MB |
| Medication | 5 | 150,000+ | 600 MB |
| Inventory | 6 | 50,000+ | 200 MB |

**Total:** ~4.5 GB of data to migrate

---

## ⏱️ Timeline Estimates

| **Service** | **Export** | **Import** | **Verify** | **Total** |
|------------|-----------|-----------|-----------|-----------|
| Auth | 2 min | 3 min | 2 min | 7 min |
| Billing | 5 min | 7 min | 3 min | 15 min |
| Payment | 3 min | 5 min | 2 min | 10 min |
| Clinical | 15 min | 20 min | 5 min | 40 min |
| Facility | 1 min | 2 min | 1 min | 4 min |
| Lab | 8 min | 10 min | 3 min | 21 min |
| Medication | 6 min | 8 min | 3 min | 17 min |
| Inventory | 3 min | 5 min | 2 min | 10 min |

**Total Migration Time:** ~2.5 hours

---

## 🛡️ Safety Checklist

Before exporting:
- [ ] Full database backup created
- [ ] Backup tested and verified
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Rollback plan documented

After importing:
- [ ] Record counts verified
- [ ] Sample data spot-checked
- [ ] Service starts successfully
- [ ] API endpoints tested
- [ ] Logs monitored for errors

---

**Document Owner:** Database Migration Team  
**Last Updated:** October 15, 2025

