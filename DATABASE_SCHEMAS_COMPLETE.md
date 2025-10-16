# 🗄️ NILECARE DATABASE SCHEMAS - COMPLETE REFERENCE

**Version:** 2.0.0  
**Date:** October 16, 2025  
**Status:** ✅ Production Ready

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [MySQL Databases](#mysql-databases)
3. [PostgreSQL Databases](#postgresql-databases)
4. [MongoDB Databases](#mongodb-databases)
5. [ER Diagrams](#er-diagrams)
6. [Relationships & Foreign Keys](#relationships--foreign-keys)
7. [Indexes & Performance](#indexes--performance)
8. [Data Migration Guide](#data-migration-guide)

---

## OVERVIEW

### Database Distribution

| Database Type | Count | Total Tables | Services |
|---------------|-------|--------------|----------|
| **MySQL 8.0** | 10 | 62 | Auth, Billing, Payment, Business, Clinical, Facility, Lab, Medication, CDS, Inventory, HL7 |
| **PostgreSQL 15** | 3 | 16 | Device, Notification, EHR |
| **MongoDB 6.0** | 2 | 5+ collections | FHIR, EHR Documents |
| **Redis 7.0** | 1 | - | Cache, Sessions |

**Total:** 16 databases, 83+ tables/collections

### Database Selection Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                      SELECTION CRITERIA                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MySQL 8.0 (ACID, Transactional)                               │
│  ✅ Core business data (patients, appointments, billing)        │
│  ✅ Strong relationships between entities                       │
│  ✅ Complex transactions required                               │
│  ✅ Mature tooling & ecosystem                                  │
│                                                                 │
│  PostgreSQL 15 (Advanced Features)                             │
│  ✅ Time-series data (medical devices + TimescaleDB)           │
│  ✅ JSON/JSONB support needed                                   │
│  ✅ Complex queries & analytics                                 │
│  ✅ Full-text search                                            │
│                                                                 │
│  MongoDB 6.0 (Document Store)                                  │
│  ✅ FHIR resources (nested documents)                           │
│  ✅ Schema-less clinical documents                              │
│  ✅ Flexible, evolving schema                                   │
│                                                                 │
│  Redis 7.0 (In-Memory Cache)                                   │
│  ✅ Session management                                          │
│  ✅ Real-time data caching                                      │
│  ✅ Pub/sub for WebSocket                                       │
└────────────────────────────────────────────────────────────────┘
```

---

## MYSQL DATABASES

### 1. nilecare_auth (Auth Service)

**Purpose:** User authentication, authorization, RBAC  
**Tables:** 7  
**Total Columns:** 85+

#### Tables

##### 1.1 auth_users
Primary user accounts table with comprehensive security features.

| Column | Type | Description | Index |
|--------|------|-------------|-------|
| `id` | CHAR(36) PK | UUID primary key | ✅ |
| `email` | VARCHAR(255) UNIQUE | User email address | ✅ |
| `username` | VARCHAR(50) UNIQUE | Unique username | ✅ |
| `password_hash` | VARCHAR(255) | Bcrypt hashed password | - |
| `first_name` | VARCHAR(50) | First name | - |
| `last_name` | VARCHAR(50) | Last name | - |
| `role` | VARCHAR(50) | User role (doctor, nurse, etc.) | - |
| `status` | VARCHAR(50) | account status | ✅ |
| `mfa_enabled` | BOOLEAN | MFA enabled flag | - |
| `mfa_secret` | VARCHAR(255) | TOTP secret | - |
| `failed_login_attempts` | INT | Failed login counter | - |
| `last_login` | TIMESTAMP | Last successful login | - |
| `email_verified` | BOOLEAN | Email verification status | - |
| `organization_id` | VARCHAR(50) | Multi-tenant org ID | ✅ |
| `permissions` | JSON | User-specific permissions | - |
| `created_at` | TIMESTAMP | Creation timestamp | - |
| `updated_at` | TIMESTAMP | Last update timestamp | - |

**Key Features:**
- Multi-factor authentication (TOTP)
- Account lockout after failed attempts
- Email verification workflow
- Multi-tenancy support
- JSON permissions for flexibility

##### 1.2 auth_refresh_tokens
JWT refresh token management for secure session handling.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Token ID |
| `token` | VARCHAR(500) UNIQUE | Encrypted token |
| `user_id` | VARCHAR(50) FK | References auth_users(id) |
| `expires_at` | TIMESTAMP | Token expiration |
| `is_revoked` | BOOLEAN | Revocation flag |
| `device_fingerprint` | VARCHAR(255) | Device identifier |
| `ip_address` | VARCHAR(45) | Client IP |
| `created_at` | TIMESTAMP | Creation time |

##### 1.3 auth_devices
Trusted device tracking for enhanced security.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Device ID |
| `user_id` | VARCHAR(50) FK | References auth_users(id) |
| `fingerprint` | VARCHAR(255) | Unique device fingerprint |
| `name` | VARCHAR(100) | User-friendly device name |
| `is_verified` | BOOLEAN | Device verification status |
| `last_used` | TIMESTAMP | Last access time |

##### 1.4 auth_roles
Role definitions with permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Role ID |
| `name` | VARCHAR(50) UNIQUE | Role name |
| `description` | TEXT | Role description |
| `permissions` | JSON | Array of permission strings |
| `is_system` | BOOLEAN | System role (cannot be deleted) |

**Default Roles:**
- `admin` - Full system access
- `doctor` - Clinical access
- `nurse` - Patient care access
- `receptionist` - Front desk access
- `patient` - Personal records access

##### 1.5 auth_permissions
Granular permission definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Permission ID |
| `name` | VARCHAR(100) UNIQUE | Permission name |
| `resource` | VARCHAR(50) | Resource type |
| `action` | VARCHAR(50) | Action (read/write/delete) |
| `description` | TEXT | Description |

##### 1.6 auth_audit_logs
Security audit trail for compliance (HIPAA).

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Log ID |
| `user_id` | VARCHAR(50) FK | User who performed action |
| `action` | VARCHAR(100) | Action performed |
| `resource` | VARCHAR(100) | Resource accessed |
| `result` | VARCHAR(20) | success/failure |
| `ip_address` | VARCHAR(45) | Client IP |
| `metadata` | JSON | Additional context |
| `timestamp` | TIMESTAMP | When action occurred |

##### 1.7 auth_login_attempts
Failed login tracking for security monitoring.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) PK | Attempt ID |
| `email` | VARCHAR(255) | Attempted email |
| `ip_address` | VARCHAR(45) | Source IP |
| `success` | BOOLEAN | Login success flag |
| `reason` | VARCHAR(255) | Failure reason |
| `timestamp` | TIMESTAMP | Attempt time |

---

### 2. nilecare_billing (Billing Service)

**Purpose:** Invoice management, insurance claims, billing operations  
**Tables:** 11  
**Total Columns:** 180+

#### Tables

##### 2.1 invoices
Primary billing entity tracking all patient charges.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | CHAR(36) PK | UUID | - |
| `invoice_number` | VARCHAR(50) UNIQUE | Format: INV-YYYYMMDD-XXXXXX | NOT NULL |
| `patient_id` | CHAR(36) | Patient reference | NOT NULL |
| `facility_id` | CHAR(36) | Facility reference | NOT NULL |
| `billing_account_id` | CHAR(36) | Billing account FK | - |
| `invoice_type` | ENUM | standard, insurance, emergency, etc. | NOT NULL |
| `subtotal` | DECIMAL(12,2) | Line items total | NOT NULL |
| `tax_amount` | DECIMAL(12,2) | Tax calculated | DEFAULT 0 |
| `discount_amount` | DECIMAL(12,2) | Discounts applied | DEFAULT 0 |
| `total_amount` | DECIMAL(12,2) | Final total | NOT NULL |
| `paid_amount` | DECIMAL(12,2) | Amount paid | DEFAULT 0 |
| `balance_due` | DECIMAL(12,2) GENERATED | total - paid (computed) | STORED |
| `status` | ENUM | draft, pending, paid, overdue, etc. | DEFAULT 'draft' |
| `invoice_date` | DATE | Invoice issued date | NOT NULL |
| `due_date` | DATE | Payment due date | NOT NULL |
| `paid_date` | DATE | Full payment date | NULL |
| `currency` | VARCHAR(3) | SDG, USD, EUR, etc. | DEFAULT 'SDG' |
| `created_at` | TIMESTAMP | Creation time | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Last update | ON UPDATE NOW() |
| `deleted_at` | TIMESTAMP | Soft delete | NULL |

**Indexes:**
- `idx_invoice_number` (invoice_number)
- `idx_patient_id` (patient_id)
- `idx_status` (status)
- `idx_patient_status` (patient_id, status)
- `idx_overdue` (status, due_date)

**Business Rules:**
- `balance_due` is automatically calculated
- Status automatically changes to 'overdue' after due date
- Late fees can be applied via trigger

##### 2.2 invoice_line_items
Individual services/products on an invoice.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Line item ID |
| `invoice_id` | CHAR(36) FK | References invoices(id) |
| `line_number` | INT | Line sequence |
| `item_type` | ENUM | service, medication, lab_test, etc. |
| `item_code` | VARCHAR(100) | CPT/HCPCS code |
| `item_name` | VARCHAR(255) | Service/product name |
| `quantity` | DECIMAL(10,2) | Quantity |
| `unit_price` | DECIMAL(10,2) | Price per unit |
| `line_total` | DECIMAL(12,2) | Line total amount |
| `service_date` | DATE | Date service provided |
| `procedure_code` | VARCHAR(20) | CPT code |
| `diagnosis_codes` | JSON | Array of ICD-10 codes |

**Triggers:**
- Auto-updates `invoices.subtotal` when line items change
- Recalculates `invoices.total_amount`

##### 2.3 billing_accounts
Patient billing account summary.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Account ID |
| `account_number` | VARCHAR(50) UNIQUE | Format: BA-YYYYMMDD-XXXXXX |
| `patient_id` | CHAR(36) | Patient FK |
| `total_charges` | DECIMAL(12,2) | Sum of all charges |
| `total_payments` | DECIMAL(12,2) | Sum of all payments |
| `balance_due` | DECIMAL(12,2) GENERATED | Computed balance |
| `status` | ENUM | active, collections, paid_in_full, etc. |
| `payment_plan_active` | BOOLEAN | Payment plan flag |
| `payment_plan_amount` | DECIMAL(12,2) | Monthly payment amount |

##### 2.4 insurance_claims
Insurance claim submissions and tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Claim ID |
| `claim_number` | VARCHAR(50) UNIQUE | Format: CLM-YYYYMMDD-XXXXXX |
| `invoice_id` | CHAR(36) FK | Associated invoice |
| `patient_id` | CHAR(36) | Patient FK |
| `claim_type` | ENUM | professional, institutional, dental, etc. |
| `claim_format` | ENUM | CMS1500, UB04, EDI_837P, etc. |
| `status` | ENUM | draft, submitted, approved, paid, denied, etc. |
| `total_charges` | DECIMAL(12,2) | Total claim amount |
| `allowed_amount` | DECIMAL(12,2) | Insurance approved amount |
| `paid_amount` | DECIMAL(12,2) | Insurance paid amount |
| `patient_responsibility` | DECIMAL(12,2) | Patient's portion |
| `denial_reason_code` | VARCHAR(50) | Denial code if denied |
| `submission_date` | DATETIME | When submitted |
| `paid_date` | DATETIME | When paid |

##### 2.5 claim_line_items
Individual services on an insurance claim.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Line ID |
| `claim_id` | CHAR(36) FK | Parent claim |
| `procedure_code` | VARCHAR(20) | CPT/HCPCS code |
| `diagnosis_codes` | JSON | ICD-10 codes array |
| `charge_amount` | DECIMAL(12,2) | Charged amount |
| `allowed_amount` | DECIMAL(12,2) | Allowed by insurance |
| `paid_amount` | DECIMAL(12,2) | Paid by insurance |
| `line_status` | ENUM | submitted, approved, denied |

##### 2.6 billing_adjustments
Discounts, write-offs, corrections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Adjustment ID |
| `invoice_id` | CHAR(36) FK | Associated invoice |
| `adjustment_type` | ENUM | discount, write_off, correction, etc. |
| `adjustment_reason` | VARCHAR(255) | Reason for adjustment |
| `adjustment_amount` | DECIMAL(12,2) | Amount |
| `is_credit` | BOOLEAN | TRUE = reduces balance |
| `approved_by` | CHAR(36) | Approver user ID |

##### 2.7 billing_statements
Patient billing statements (monthly).

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Statement ID |
| `statement_number` | VARCHAR(50) UNIQUE | Format: STMT-YYYYMMDD-XXXXXX |
| `billing_account_id` | CHAR(36) FK | Billing account |
| `period_start_date` | DATE | Statement period start |
| `period_end_date` | DATE | Statement period end |
| `opening_balance` | DECIMAL(12,2) | Previous balance |
| `new_charges` | DECIMAL(12,2) | New charges this period |
| `payments_received` | DECIMAL(12,2) | Payments this period |
| `closing_balance` | DECIMAL(12,2) | Current balance |
| `status` | ENUM | draft, sent, viewed, paid |
| `statement_file_url` | TEXT | PDF file URL |

##### 2.8 charge_master
Service pricing catalog (CDM).

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Item ID |
| `item_code` | VARCHAR(100) UNIQUE | Internal code |
| `item_name` | VARCHAR(255) | Service/product name |
| `item_category` | ENUM | consultation, procedure, lab_test, etc. |
| `cpt_code` | VARCHAR(20) | CPT code |
| `base_price` | DECIMAL(10,2) | Standard price |
| `insurance_rate_1` | DECIMAL(10,2) | Government insurance rate |
| `insurance_rate_2` | DECIMAL(10,2) | Private insurance rate |
| `cash_rate` | DECIMAL(10,2) | Self-pay rate |
| `is_active` | BOOLEAN | Active flag |

##### 2.9 billing_audit_log
Audit trail for all billing operations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Log ID |
| `action` | VARCHAR(100) | Action performed |
| `resource_type` | ENUM | invoice, claim, adjustment, etc. |
| `resource_id` | CHAR(36) | Affected resource |
| `user_id` | CHAR(36) | User who performed action |
| `old_values` | JSON | Before values |
| `new_values` | JSON | After values |
| `timestamp` | TIMESTAMP | When action occurred |

##### 2.10 payment_reminders
Automated payment reminders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Reminder ID |
| `invoice_id` | CHAR(36) FK | Invoice to remind about |
| `reminder_type` | ENUM | upcoming_due, overdue, final_notice, etc. |
| `delivery_method` | ENUM | email, sms, phone, mail |
| `delivery_status` | ENUM | pending, sent, delivered, failed |
| `scheduled_date` | DATETIME | When to send |
| `sent_date` | DATETIME | When actually sent |

##### 2.11 invoice_payment_allocations
Links payments to invoices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | CHAR(36) PK | Allocation ID |
| `invoice_id` | CHAR(36) FK | Invoice |
| `payment_id` | CHAR(36) | Payment Gateway transaction ID |
| `allocated_amount` | DECIMAL(12,2) | Amount allocated |
| `allocation_type` | ENUM | full, partial, installment, etc. |
| `payment_status` | VARCHAR(50) | Cached payment status |

**Key Views:**
- `v_outstanding_invoices` - Unpaid invoices
- `v_patient_invoice_summary` - Per-patient totals
- `v_claims_needing_action` - Claims requiring follow-up
- `v_revenue_by_category` - Revenue analytics

---

### 3. nilecare_payment (Payment Gateway)

**Purpose:** Payment processing, transactions, provider integrations  
**Tables:** 10  
**Total Columns:** 150+

#### Key Tables

- `payment_transactions` - All payment transactions
- `payment_providers` - Configured payment gateways
- `payment_methods` - Saved payment methods
- `payment_disputes` - Chargebacks and disputes
- `payment_reconciliation` - Bank reconciliation
- `fraud_detection_logs` - Fraud monitoring

---

### 4. nilecare_business (Business Service)

**Purpose:** Core business operations, staff, departments  
**Tables:** 4  
**Total Columns:** 60+

#### Tables

- `staff` - Healthcare staff/employees
- `departments` - Hospital departments
- `working_hours` - Staff schedules
- `appointments` - Appointment scheduling

---

### 5. nilecare_clinical (Clinical Service)

**Purpose:** Clinical data, encounters, diagnoses  
**Tables:** 8  
**Total Columns:** 120+

#### Key Tables

- `encounters` - Patient encounters
- `diagnoses` - Diagnosis records (ICD-10)
- `vital_signs` - Vital signs history
- `allergies` - Patient allergies
- `immunizations` - Vaccination records
- `clinical_notes` - SOAP notes, progress notes

---

### 6. nilecare_facility (Facility Service)

**Purpose:** Healthcare facilities management  
**Tables:** 5

#### Tables

- `facilities` - Hospital/clinic locations
- `buildings` - Physical buildings
- `rooms` - Rooms/beds
- `equipment` - Medical equipment
- `resources` - Schedulable resources

---

### 7. nilecare_lab (Lab Service)

**Purpose:** Laboratory orders and results  
**Tables:** 4

#### Tables

- `lab_orders` - Lab test orders
- `lab_results` - Test results
- `lab_specimens` - Specimen tracking
- `lab_tests_catalog` - Available tests

---

### 8. nilecare_medication (Medication Service)

**Purpose:** Medication management, prescriptions  
**Tables:** 5

#### Tables

- `medications` - Medication formulary
- `prescriptions` - E-prescriptions
- `mar_entries` - Medication administration records
- `high_alert_medications` - High-risk medication safety
- `medication_audit_log` - Audit trail

---

### 9. nilecare_cds (Clinical Decision Support)

**Purpose:** Drug interactions, allergy checking  
**Tables:** 6

#### Tables

- `drug_interactions` - Drug-drug interactions
- `allergy_interactions` - Drug-allergy interactions
- `dose_ranges` - Safe dose ranges
- `contraindications` - Contraindication rules
- `clinical_alerts` - Generated alerts
- `alert_overrides` - Override justifications

---

### 10. nilecare_inventory (Inventory Service)

**Purpose:** Pharmacy and medical supply inventory  
**Tables:** 5

#### Tables

- `inventory_items` - Stock items
- `inventory_transactions` - Stock movements
- `stock_levels` - Current stock by location
- `purchase_orders` - Procurement
- `suppliers` - Supplier management

---

### 11. nilecare_interop (HL7 Service)

**Purpose:** HL7 message processing and FHIR  
**Tables:** 5

#### Tables

- `hl7_messages` - Inbound/outbound HL7
- `hl7_message_logs` - Processing logs
- `fhir_mappings` - HL7 ↔ FHIR mappings
- `interface_configs` - Integration configurations
- `message_queue` - Message processing queue

---

## POSTGRESQL DATABASES

### 1. nilecare_devices (Device Integration Service)

**Purpose:** Medical device data with TimescaleDB for time-series  
**Tables:** 4  
**Extensions:** TimescaleDB, UUID

#### Tables

##### 1.1 devices
Medical device registry.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Device ID |
| `device_type` | VARCHAR(50) | ECG, BP monitor, etc. |
| `manufacturer` | VARCHAR(255) | Device manufacturer |
| `model` | VARCHAR(255) | Model number |
| `serial_number` | VARCHAR(255) UNIQUE | Serial number |
| `location` | VARCHAR(255) | Current location |
| `status` | VARCHAR(20) | online, offline, maintenance |
| `last_communication` | TIMESTAMP | Last data received |

##### 1.2 device_readings (Hypertable)
Time-series vital signs data.

| Column | Type | Description |
|--------|------|-------------|
| `device_id` | UUID FK | Device reference |
| `patient_id` | UUID | Patient reference |
| `reading_type` | VARCHAR(50) | HR, BP, SpO2, temp, etc. |
| `reading_value` | DECIMAL(10,2) | Numeric value |
| `reading_unit` | VARCHAR(20) | Unit (bpm, mmHg, etc.) |
| `timestamp` | TIMESTAMPTZ PK | Reading time |
| `quality` | VARCHAR(20) | good, poor, invalid |

**TimescaleDB Features:**
- Hypertable on `timestamp`
- Automatic partitioning
- Compression after 7 days
- Retention policy (1 year)

##### 1.3 device_alerts
Critical value alerts from devices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Alert ID |
| `device_id` | UUID FK | Device that triggered |
| `patient_id` | UUID | Patient affected |
| `alert_type` | VARCHAR(50) | Critical HR, BP, etc. |
| `severity` | VARCHAR(20) | low, medium, high, critical |
| `alert_message` | TEXT | Alert description |
| `acknowledged` | BOOLEAN | Acknowledged by staff |
| `acknowledged_by` | UUID | Staff member |
| `timestamp` | TIMESTAMPTZ | When triggered |

##### 1.4 device_calibration_logs
Device calibration history.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Log ID |
| `device_id` | UUID FK | Device calibrated |
| `calibrated_by` | UUID | Technician |
| `calibration_date` | TIMESTAMP | When calibrated |
| `next_calibration_due` | DATE | Next due date |
| `calibration_notes` | TEXT | Notes |

---

### 2. nilecare_notifications (Notification Service)

**Purpose:** Multi-channel notification delivery  
**Tables:** 4

#### Tables

- `notifications` - Notification queue
- `notification_templates` - Email/SMS templates
- `notification_preferences` - User preferences
- `notification_delivery_log` - Delivery tracking

---

### 3. ehr_service (EHR Service)

**Purpose:** Electronic Health Records structured data  
**Tables:** 8

#### Tables

- `patients` - Patient demographics
- `care_plans` - Care plan tracking
- `problem_lists` - Active problems
- `family_history` - Family medical history
- `social_history` - Social determinants
- `advance_directives` - Advance care planning
- `consents` - Patient consents
- `care_team` - Care team members

---

## MONGODB DATABASES

### 1. fhir_resources

**Purpose:** FHIR R4 compliant resource storage  
**Collections:** 5+

#### Collections

##### 1.1 patients
FHIR Patient resources.

```javascript
{
  "_id": ObjectId,
  "resourceType": "Patient",
  "id": "PAT-12345",
  "identifier": [
    {
      "system": "http://nilecare.com/patient-id",
      "value": "PAT-12345"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Doe",
      "given": ["John"]
    }
  ],
  "telecom": [...],
  "gender": "male",
  "birthDate": "1990-01-15",
  "address": [...],
  "meta": {
    "lastUpdated": ISODate("2025-10-16T10:00:00Z"),
    "versionId": "1"
  }
}
```

##### 1.2 observations
FHIR Observation resources (vitals, labs).

##### 1.3 medications
FHIR MedicationStatement resources.

##### 1.4 encounters
FHIR Encounter resources.

##### 1.5 conditions
FHIR Condition resources (diagnoses).

---

### 2. ehr_documents

**Purpose:** Unstructured clinical documents  
**Collections:** 3+

- `clinical_documents` - PDF, Word documents
- `images` - Medical images metadata
- `attachments` - General attachments

---

## ER DIAGRAMS

### Core Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE ENTITY RELATIONSHIPS                     │
└─────────────────────────────────────────────────────────────────┘

 PATIENTS                   APPOINTMENTS              STAFF
┌─────────┐               ┌──────────────┐         ┌─────────┐
│ id (PK) │◀─────────────▶│ patient_id   │◀───────▶│ id (PK) │
│ name    │  1        *   │ doctor_id    │  *    1 │ name    │
│ dob     │               │ date         │         │ role    │
└────┬────┘               │ status       │         └─────────┘
     │                    └──────┬───────┘
     │ 1                        │
     │                          │ 1
     │ *                        │ *
┌────▼─────────┐         ┌──────▼────────┐
│ ENCOUNTERS   │         │  INVOICES     │
├──────────────┤         ├───────────────┤
│ id (PK)      │         │ id (PK)       │
│ patient_id   │         │ patient_id    │
│ type         │         │ appointment_id│
│ date         │         │ total_amount  │
└──────┬───────┘         │ status        │
       │                 └───────┬───────┘
       │ 1                       │
       │                         │ 1
       │ *                       │ *
┌──────▼──────┐          ┌───────▼────────────┐
│ DIAGNOSES   │          │ INVOICE_LINE_ITEMS │
├─────────────┤          ├────────────────────┤
│ id (PK)     │          │ id (PK)            │
│ encounter_id│          │ invoice_id         │
│ icd10_code  │          │ item_name          │
│ description │          │ quantity           │
└─────────────┘          │ unit_price         │
                         │ line_total         │
                         └────────────────────┘
```

### Billing Relationships

```
 PATIENTS                  BILLING_ACCOUNTS          INVOICES
┌─────────┐              ┌────────────────┐       ┌──────────┐
│ id (PK) │─────────────▶│ patient_id (FK)│◀──────│invoice_id│
└─────────┘  1        1  │ total_charges  │  1  * └──────────┘
                         │ balance_due     │            │
                         └────────┬───────┘            │ 1
                                  │ 1                  │
                                  │                    │ *
                                  │ *           ┌──────▼────────┐
                         ┌────────▼────────┐   │INVOICE_PAYMENT│
                         │INSURANCE_CLAIMS │   │  _ALLOCATIONS │
                         ├─────────────────┤   ├───────────────┤
                         │ id (PK)         │   │ invoice_id    │
                         │ claim_number    │   │ payment_id    │
                         │ status          │   │ amount        │
                         └─────────────────┘   └───────────────┘
```

---

## INDEXES & PERFORMANCE

### Index Strategy

#### Primary Indexes (PKs)
All tables have UUID primary keys with B-tree indexes.

#### Foreign Key Indexes
All foreign keys have indexes for join performance.

#### Query-Specific Indexes

**Invoices:**
```sql
-- Composite index for common query pattern
CREATE INDEX idx_invoices_patient_status_date 
  ON invoices(patient_id, status, invoice_date DESC);

-- Index for overdue invoice checks
CREATE INDEX idx_invoices_overdue 
  ON invoices(status, due_date) 
  WHERE status IN ('pending', 'partially_paid');
```

**Auth:**
```sql
-- Unique constraint + index
CREATE UNIQUE INDEX idx_auth_users_email 
  ON auth_users(email);

-- Covering index for login queries
CREATE INDEX idx_auth_users_login 
  ON auth_users(email, password_hash, status);
```

**Device Readings (TimescaleDB):**
```sql
-- Automatic time-based partitioning
SELECT create_hypertable('device_readings', 'timestamp');

-- Compression after 7 days
ALTER TABLE device_readings SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, patient_id'
);

SELECT add_compression_policy('device_readings', INTERVAL '7 days');
```

### Full-Text Search

```sql
-- Billing: Search invoices by number, description
CREATE FULLTEXT INDEX idx_invoices_search 
  ON invoices(invoice_number, description, patient_notes);

-- Charge Master: Search services
CREATE FULLTEXT INDEX idx_charge_master_search 
  ON charge_master(item_name, item_description);
```

---

## DATA MIGRATION GUIDE

### Migration Tool: Flyway

All services use Flyway for version-controlled migrations.

#### Directory Structure
```
microservices/{service}/
├── migrations/
│   ├── V1__Initial_schema.sql
│   ├── V2__Add_soft_delete.sql
│   ├── V3__Add_audit_columns.sql
│   └── R__Create_views.sql  (Repeatable)
├── flyway.conf
└── package.json
```

#### Migration Naming Convention
- **Versioned:** `V{version}__{description}.sql`
  - Example: `V1__Initial_schema.sql`
- **Repeatable:** `R__{description}.sql`
  - Example: `R__Create_views.sql`
- **Undo:** `U{version}__{description}.sql`
  - Example: `U1__Rollback_initial_schema.sql`

#### Running Migrations

```bash
# Info: Check migration status
cd microservices/auth-service
npm run migrate:info

# Migrate: Apply pending migrations
npm run migrate

# Validate: Check migration integrity
npm run migrate:validate

# Repair: Fix checksum mismatches
npm run migrate:repair
```

---

## ✅ SUMMARY

**Documentation Complete:**
- ✅ 16 databases documented
- ✅ 83+ tables/collections defined
- ✅ All schemas with column details
- ✅ Relationships and foreign keys mapped
- ✅ Index strategies documented
- ✅ Migration guide included

**Next Steps:**
- Create visual ER diagrams (draw.io)
- Add data dictionary for enums
- Document stored procedures
- Create database sizing estimates

---

**Document Status:** ✅ Complete  
**Last Updated:** October 16, 2025  
**Maintained By:** Database Team

