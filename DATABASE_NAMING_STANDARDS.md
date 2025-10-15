# 📛 NileCare Database Naming Standards

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Status:** ✅ **OFFICIAL STANDARD**

---

## 📋 Overview

This document defines the official naming conventions for all database objects across the NileCare Healthcare Platform. **All services MUST adhere to these standards** to ensure consistency, maintainability, and clarity.

---

## 🗄️ Database Naming

### Database Names

**Format:** `nilecare_{service_name}`

**Examples:**
```
nilecare_auth          # Auth Service
nilecare_billing       # Billing Service
nilecare_payment       # Payment Gateway Service
nilecare_clinical      # Clinical/EHR Service
nilecare_facility      # Facility Service
nilecare_lab           # Lab Service
nilecare_medication    # Medication Service
nilecare_inventory     # Inventory Service
nilecare_notification  # Notification Service
nilecare_devices       # Device Integration Service
```

**Rules:**
- ✅ All lowercase
- ✅ Underscore separator
- ✅ Singular service name
- ❌ No spaces
- ❌ No hyphens (use underscores)
- ❌ No abbreviations (unless universally recognized)

**Character Set:**
```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

---

## 📊 Table Naming

### Standard Format

**Format:** `{service_prefix}_{entity_name}`

**Examples:**
```sql
-- Auth Service (prefix: auth_)
auth_users
auth_roles
auth_permissions
auth_refresh_tokens
auth_audit_logs

-- Billing Service (prefix: billing_)
billing_invoices
billing_accounts
billing_claims
billing_adjustments

-- Payment Service (prefix: payment_)
payment_transactions
payment_providers
payment_refunds
```

### Rules

1. **Prefix Required:** All tables MUST have service prefix
2. **Plural Entity Names:** Use plural for entity tables
   ```sql
   ✅ auth_users          (plural)
   ❌ auth_user           (singular)
   ```

3. **Junction Tables:** Format `{service_prefix}_{entity1}_{entity2}`
   ```sql
   ✅ auth_user_roles
   ✅ auth_role_permissions
   ```

4. **Audit Tables:** Format `{service_prefix}_{entity}_audit` or `{service_prefix}_audit_log`
   ```sql
   ✅ auth_audit_log
   ✅ billing_invoice_audit
   ```

5. **Case:** All lowercase, underscore-separated
   ```sql
   ✅ auth_password_reset_tokens
   ❌ authPasswordResetTokens      # CamelCase
   ❌ Auth_Password_Reset_Tokens   # Pascal
   ```

---

## 🔑 Column Naming

### Primary Keys

**Standard:** Always `id`

```sql
✅ id CHAR(36) PRIMARY KEY DEFAULT (UUID())
❌ user_id CHAR(36) PRIMARY KEY     # Don't suffix PK with entity name
❌ userId CHAR(36) PRIMARY KEY      # CamelCase
```

**Type:** `CHAR(36)` for UUIDs, `BIGINT AUTO_INCREMENT` for sequential IDs

### Foreign Keys

**Format:** `{entity}_id`

```sql
✅ user_id CHAR(36) NOT NULL
✅ invoice_id CHAR(36) NOT NULL
✅ facility_id CHAR(36) NOT NULL
✅ patient_id CHAR(36) NOT NULL

❌ userId CHAR(36)          # CamelCase
❌ invoice CHAR(36)         # Missing _id suffix
❌ fk_invoice CHAR(36)      # Don't prefix with fk_
```

### Timestamp Columns

**Standard Fields:**

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL,               -- For soft deletes
```

**Related Fields:**
```sql
verified_at TIMESTAMP NULL,
expired_at TIMESTAMP NOT NULL,
confirmed_at TIMESTAMP NULL,
sent_at TIMESTAMP NULL,
processed_at TIMESTAMP NULL,
```

**Rules:**
- ✅ Always use `_at` suffix for timestamps
- ✅ Use `TIMESTAMP` type
- ✅ Use `NULL` for optional timestamps
- ❌ Don't use `date`, `time`, `datetime` suffixes redundantly

### Audit Columns

**Standard Format:**

```sql
created_by CHAR(36),              -- User ID who created
updated_by CHAR(36),              -- User ID who last updated
deleted_by CHAR(36),              -- User ID who soft deleted
```

**Rules:**
- ✅ Use `_by` suffix for user references
- ✅ Store user IDs, not usernames (for immutability)
- ❌ Don't use `creator`, `updater`, `deleter`

### Boolean Columns

**Format:** `is_{property}`

```sql
✅ is_active BOOLEAN DEFAULT TRUE
✅ is_verified BOOLEAN DEFAULT FALSE
✅ is_deleted BOOLEAN DEFAULT FALSE
✅ is_enabled BOOLEAN DEFAULT TRUE

❌ active BOOLEAN                  # Missing is_ prefix
❌ verified BOOLEAN                # Missing is_ prefix
❌ mfa_enabled BOOLEAN             # Use is_mfa_enabled
❌ has_verified BOOLEAN            # Use is_verified
```

**Exception:** Domain-specific boolean fields can use `{verb}_enabled`
```sql
⚠️ mfa_enabled BOOLEAN            # Acceptable if domain-specific
⚠️ two_factor_enabled BOOLEAN     # Acceptable if domain-specific
```

### Enum Columns

**Format:** `{property}_status` or `{property}_type`

```sql
-- Status columns
payment_status ENUM('pending', 'confirmed', 'failed', 'cancelled')
invoice_status ENUM('draft', 'sent', 'paid', 'overdue', 'voided')

-- Type columns
notification_type ENUM('email', 'sms', 'push', 'in_app')
appointment_type ENUM('consultation', 'follow_up', 'procedure', 'emergency')
```

**Enum Value Standards:**
- ✅ All lowercase
- ✅ Underscore-separated (e.g., `in_progress`, `not_found`)
- ❌ No uppercase (e.g., `PENDING`)
- ❌ No spaces (use underscores)
- ❌ No CamelCase (e.g., `inProgress`)

### JSON Columns

**Format:** Descriptive name without `_json` suffix

```sql
✅ metadata JSON
✅ settings JSON
✅ configuration JSON
✅ permissions JSON
✅ evidence_urls JSON

❌ metadata_json JSON            # Redundant suffix
❌ json_metadata JSON            # Prefix not needed
```

### Amount/Currency Columns

**Standard Pattern:**

```sql
amount DECIMAL(12, 2) NOT NULL,
currency VARCHAR(3) DEFAULT 'SDG',       -- ISO 4217 currency code
```

**For amounts in different contexts:**
```sql
total_amount DECIMAL(12, 2),
paid_amount DECIMAL(12, 2),
refund_amount DECIMAL(12, 2),
discount_amount DECIMAL(12, 2),
```

### Count/Quantity Columns

```sql
quantity INT NOT NULL,
total_items INT DEFAULT 0,
retry_count INT DEFAULT 0,
attempt_count INT DEFAULT 0,
```

**Rules:**
- ✅ Use descriptive names
- ✅ Suffix with `_count` for counters
- ✅ Use `quantity` for item counts

---

## 🔍 Index Naming

### Single-Column Indexes

**Format:** `idx_{table}_{column}`

```sql
CREATE INDEX idx_users_email ON auth_users(email);
CREATE INDEX idx_invoices_patient_id ON billing_invoices(patient_id);
CREATE INDEX idx_payments_status ON payment_transactions(status);
```

### Multi-Column Indexes

**Format:** `idx_{table}_{column1}_{column2}[_{column3}]`

```sql
CREATE INDEX idx_payments_patient_status ON payments(patient_id, status);
CREATE INDEX idx_invoices_facility_date ON invoices(facility_id, created_at);
CREATE INDEX idx_appointments_provider_date_status ON appointments(provider_id, appointment_date, status);
```

**Rule:** Maximum 3 columns in index name, even if index has more

### Unique Constraints

**Format:** `uk_{table}_{column}` or `uq_{table}_{column}`

```sql
UNIQUE KEY uk_users_email (email);
UNIQUE KEY uk_invoices_invoice_number (invoice_number);
UNIQUE KEY uk_user_role_facility (user_id, role_id, facility_id);
```

### Foreign Key Constraints

**Format:** `fk_{table}_{column}`

```sql
CONSTRAINT fk_refresh_tokens_user_id 
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

CONSTRAINT fk_invoices_patient_id
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT;
```

**Note:** In microservice architecture with separate databases, **avoid cross-service foreign key constraints**.

### Full-Text Indexes

**Format:** `ftidx_{table}_{column}` or `fulltext_{table}_{column}`

```sql
CREATE FULLTEXT INDEX ftidx_patients_name ON patients(first_name, last_name);
CREATE FULLTEXT INDEX ftidx_medications_name ON medications(medication_name);
```

---

## 🔐 View Naming

**Format:** `v_{description}` or `vw_{description}`

```sql
CREATE OR REPLACE VIEW v_active_users AS ...
CREATE OR REPLACE VIEW v_outstanding_invoices AS ...
CREATE OR REPLACE VIEW v_critical_lab_results AS ...
CREATE OR REPLACE VIEW v_patient_summary AS ...
```

**Rules:**
- ✅ Prefix with `v_` or `vw_`
- ✅ Descriptive name indicating view purpose
- ✅ Lowercase with underscores

---

## ⚙️ Stored Procedure Naming

**Format:** `sp_{action}_{entity}` or `proc_{action}_{entity}`

```sql
DELIMITER //

CREATE PROCEDURE sp_get_patient_summary(IN p_patient_id CHAR(36)) ...
CREATE PROCEDURE sp_process_payment(IN p_invoice_id CHAR(36), ...) ...
CREATE PROCEDURE sp_archive_old_audit_logs() ...

DELIMITER ;
```

**Rules:**
- ✅ Prefix with `sp_` or `proc_`
- ✅ Verb indicating action (get, create, update, delete, process, calculate)
- ✅ Lowercase with underscores

### Parameter Naming

**Format:** `p_{parameter_name}` (prefix with `p_`)

```sql
CREATE PROCEDURE sp_create_invoice(
  IN p_patient_id CHAR(36),
  IN p_amount DECIMAL(12, 2),
  IN p_currency VARCHAR(3),
  OUT p_invoice_id CHAR(36)
)
```

---

## 🔔 Trigger Naming

**Format:** `trg_{table}_{timing}_{event}`

```sql
CREATE TRIGGER trg_patients_after_insert
AFTER INSERT ON patients
FOR EACH ROW ...

CREATE TRIGGER trg_invoices_before_update
BEFORE UPDATE ON billing_invoices
FOR EACH ROW ...

CREATE TRIGGER trg_users_after_delete
AFTER DELETE ON auth_users
FOR EACH ROW ...
```

**Timing:** `before` or `after`  
**Event:** `insert`, `update`, `delete`

---

## 🔄 Sequence/Auto-Increment Naming

**Format:** `seq_{table}_{column}` (PostgreSQL)

```sql
CREATE SEQUENCE seq_audit_log_id START 1;
CREATE SEQUENCE seq_transaction_number START 1000;
```

**MySQL Auto Increment:**
```sql
id BIGINT AUTO_INCREMENT PRIMARY KEY
```

---

## 🏷️ Migration File Naming

**Format:** `V{version}__{description}.sql` (Flyway standard)

**Version Format:** `YYYYMMDD_HHMMSS` or sequential `1, 2, 3`

```
V1__Initial_schema.sql
V2__Add_mfa_support.sql
V3__Add_audit_logging.sql
V4__Add_payment_refunds.sql

OR (timestamp-based):

V20251015_100000__Initial_schema.sql
V20251015_110000__Add_mfa_support.sql
V20251015_120000__Add_audit_logging.sql
```

**Rules:**
- ✅ Prefix with `V` (uppercase)
- ✅ Version number
- ✅ Double underscore `__` separator
- ✅ Descriptive name with underscores (not spaces)
- ✅ `.sql` extension

**Repeatable Migrations:**
```
R__Create_views.sql
R__Seed_reference_data.sql
```

---

## 📝 Comment Standards

### Table Comments

```sql
CREATE TABLE auth_users (
  ...
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='User accounts and authentication data';
```

### Column Comments

```sql
sudan_national_id VARCHAR(20) COMMENT 'Sudan National ID (encrypted for PHI compliance)',
phone VARCHAR(20) COMMENT 'Sudan mobile format: +249xxxxxxxxx',
timezone VARCHAR(50) DEFAULT 'Africa/Khartoum' COMMENT 'User timezone',
```

**Rules:**
- ✅ Use comments for domain-specific or business context
- ✅ Explain format requirements (e.g., phone number format)
- ✅ Note encryption, PHI, or security requirements
- ❌ Don't state the obvious (e.g., "User's email address" for `email` column)

---

## 🌍 Internationalization & Localization

### Sudan-Specific Naming

```sql
-- Currency
currency VARCHAR(3) DEFAULT 'SDG'     -- Sudanese Pound

-- Timezone
timezone VARCHAR(50) DEFAULT 'Africa/Khartoum'

-- Language
locale VARCHAR(10) DEFAULT 'ar_SD'    -- Arabic (Sudan)
primary_language VARCHAR(50) DEFAULT 'Arabic'

-- Phone format
phone VARCHAR(20) COMMENT 'Sudan mobile format: +249xxxxxxxxx'

-- Geographic
state VARCHAR(50) COMMENT 'Sudan State (e.g., Khartoum, Gezira, Red Sea)'
country VARCHAR(100) DEFAULT 'Sudan'
```

---

## ✅ Validation Checklist

Before implementing any database schema, verify:

- [ ] Database name follows `nilecare_{service}` format
- [ ] All tables have service prefix (e.g., `auth_`, `billing_`)
- [ ] Primary key is named `id`
- [ ] Foreign keys follow `{entity}_id` format
- [ ] Timestamps use `_at` suffix
- [ ] Audit fields use `_by` suffix
- [ ] Boolean fields use `is_` prefix
- [ ] Indexes use `idx_` prefix
- [ ] Unique constraints use `uk_` prefix
- [ ] Views use `v_` prefix
- [ ] Stored procedures use `sp_` prefix
- [ ] All names are lowercase with underscores
- [ ] No spaces, hyphens, or special characters
- [ ] Character set is `utf8mb4` with `utf8mb4_unicode_ci` collation

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't Use

```sql
-- CamelCase
❌ authUsers
❌ paymentTransactions

-- Spaces
❌ "auth users"
❌ "payment transactions"

-- Hyphens
❌ auth-users
❌ payment-transactions

-- Singular table names
❌ auth_user
❌ billing_invoice

-- Mixed naming
❌ AuthUsers       (Pascal)
❌ auth_Users      (mixed)
❌ AUTH_USERS      (UPPER)

-- Abbreviated names
❌ auth_usr
❌ pmt_txn

-- Missing prefixes
❌ users           (in shared database)
❌ invoices        (in shared database)

-- Redundant suffixes
❌ metadata_json
❌ created_at_timestamp

-- Wrong boolean format
❌ active          (use is_active)
❌ verified        (use is_verified)
❌ enabled         (use is_enabled)
```

---

## 📚 References

- [MySQL Naming Conventions](https://dev.mysql.com/doc/refman/8.0/en/identifier-case-sensitivity.html)
- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Flyway Naming Convention](https://flywaydb.org/documentation/concepts/migrations#naming)
- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html)

---

**Approved By:** Database Architecture Team  
**Effective Date:** October 15, 2025  
**Next Review:** January 15, 2026

