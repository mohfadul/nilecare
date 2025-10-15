# 🗺️ NileCare Service-to-Database Mapping

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Purpose:** Quick reference for database ownership and service architecture

---

## 📊 Service Database Matrix

| Service | Port | Database Type | Database Name | Status | Tables | Separation |
|---------|------|--------------|---------------|--------|--------|------------|
| **Auth Service** | 7020 | MySQL 8.0 | `nilecare_auth` | 🔴 To Migrate | 7 | ❌ Currently in `nilecare` |
| **Business Service** | 7010 | MySQL 8.0 | `nilecare_business` | ✅ Separate | 4 | ✅ Own database |
| **Billing Service** | 7050 | MySQL 8.0 | `nilecare_billing` | 🔴 To Migrate | 9 | ❌ Currently in `nilecare` |
| **Payment Gateway** | 7030 | MySQL 8.0 | `nilecare_payment` | 🔴 To Migrate | 10 | ❌ Currently in `nilecare` |
| **Device Integration** | 7070 | PostgreSQL + TimescaleDB | `nilecare_devices` | ✅ Separate | 4 | ✅ Own database |
| **Notification Service** | 3002 | PostgreSQL 13+ | `nilecare_notifications` | ✅ Separate | 4 | ✅ Own database |
| **EHR Service** | 4001 | PostgreSQL + MongoDB | `ehr_service` + `ehr_documents` | ✅ Separate | 8 | ✅ Multi-database |
| **Facility Service** | 7060 | MySQL 8.0 | `nilecare_facility` | 🔴 To Migrate | 5 | ❌ Currently in `nilecare` |
| **Lab Service** | 7080 | MySQL 8.0 | `nilecare_lab` | 🔴 To Migrate | 4 | ❌ Currently in `nilecare` |
| **Medication Service** | 7090 | MySQL 8.0 | `nilecare_medication` | 🔴 To Migrate | 5 | ❌ Currently in `nilecare` |
| **Inventory Service** | 7100 | MySQL 8.0 | `nilecare_inventory` | 🔴 To Migrate | 4 | ❌ Currently in `nilecare` |
| **Appointment Service** | 7040 | MySQL 8.0 | `nilecare_business` | 🟡 Shared | 1 | 🟡 Shares with business |
| **CDS Service** | - | MySQL 8.0 | `nilecare_clinical` | 🔴 To Migrate | 6 | ❌ Currently in `nilecare` |
| **FHIR Service** | - | MongoDB | `fhir_resources` | ✅ Separate | Collections | ✅ Own database |
| **HL7 Service** | - | MySQL 8.0 | `nilecare_interop` | 🔴 To Migrate | 4 | ❌ Currently in `nilecare` |
| **Main NileCare** | 5000 | None | - | ✅ Correct | 0 | ✅ Orchestrator only |

**Legend:**
- ✅ Separate: Service has its own dedicated database
- 🔴 To Migrate: Service uses shared `nilecare` database (needs migration)
- 🟡 Shared: Service shares database with another service
- ❌ Not Separated: Violates microservice principles

---

## 📁 Database Structure by Service

### 🔐 Auth Service → `nilecare_auth`

**Current Location:** `nilecare` (shared) ❌  
**Target Location:** `nilecare_auth` ✅  
**Technology:** MySQL 8.0  
**Connection Pool:** 20 connections

#### Tables (7)
```
auth_users                  # User accounts
auth_refresh_tokens         # JWT refresh tokens
auth_devices                # Trusted device tracking
auth_roles                  # User roles
auth_permissions            # Granular permissions
auth_audit_logs             # Security audit trail
auth_login_attempts         # Failed login tracking
```

#### Environment Variables
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=auth_service
DB_PASSWORD=${AUTH_DB_PASSWORD}
```

---

### 💼 Business Service → `nilecare_business`

**Current Location:** `nilecare_business` ✅  
**Technology:** MySQL 8.0  
**Connection Pool:** 20 connections

#### Tables (4)
```
appointments                # Appointment scheduling
billings                    # Billing records
schedules                   # Staff schedules
staff                       # Staff management
```

#### Environment Variables
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_business
DB_USER=business_service
DB_PASSWORD=${BUSINESS_DB_PASSWORD}
```

---

### 💵 Billing Service → `nilecare_billing`

**Current Location:** `nilecare` (shared) ❌  
**Target Location:** `nilecare_billing` ✅  
**Technology:** MySQL 8.0

#### Tables (9)
```
billing_accounts            # Patient billing accounts
invoices                    # Invoices
invoice_line_items          # Invoice details
invoice_payment_allocations # Payment allocations
insurance_claims            # Insurance claims
claim_line_items            # Claim details
billing_adjustments         # Billing adjustments
billing_audit_log           # Audit trail
charge_master               # Service pricing
```

---

### 💳 Payment Gateway → `nilecare_payment`

**Current Location:** `nilecare` (shared) ❌  
**Target Location:** `nilecare_payment` ✅  
**Technology:** MySQL 8.0

#### Tables (10)
```
payment_providers           # Payment provider configuration
payments                    # Payment transactions
payment_reconciliation      # Payment reconciliation
payment_refunds             # Refund records
invoice_payments            # Invoice payment mapping
payment_installment_plans   # Installment plans
installment_schedule        # Installment schedule
payment_webhooks            # Webhook logs
payment_disputes            # Payment disputes
payment_analytics_daily     # Analytics aggregation
```

---

### 📡 Device Integration → `nilecare_devices`

**Current Location:** `nilecare_devices` ✅  
**Technology:** PostgreSQL + TimescaleDB  
**Purpose:** Time-series medical device data

#### Tables (4)
```
devices                     # Device registry (PostgreSQL)
vital_signs                 # Vital signs (TimescaleDB hypertable)
device_alerts               # Device alerts (PostgreSQL)
calibration_records         # Calibration history (PostgreSQL)
```

#### TimescaleDB Configuration
```sql
-- Hypertable for time-series data
SELECT create_hypertable('vital_signs', 'recorded_at', chunk_time_interval => INTERVAL '1 day');

-- Compression after 7 days
SELECT add_compression_policy('vital_signs', INTERVAL '7 days');

-- Retention policy (1 year)
SELECT add_retention_policy('vital_signs', INTERVAL '1 year');
```

---

### 🔔 Notification Service → `nilecare_notifications`

**Current Location:** `nilecare_notifications` ✅  
**Technology:** PostgreSQL 13+  
**Additional:** Redis (queue management)

#### Tables (4)
```
notifications               # Notification records
templates                   # Notification templates
subscriptions               # User preferences
deliveries                  # Delivery tracking
```

---

### 📋 EHR Service → `ehr_service` + `ehr_documents`

**Current Location:** `ehr_service` (PostgreSQL) + `ehr_documents` (MongoDB) ✅  
**Technology:** PostgreSQL + MongoDB (multi-database)

#### PostgreSQL Tables (Structured Data)
```
soap_notes                  # SOAP clinical notes
progress_notes              # Progress notes
problem_lists               # Problem list
clinical_documents          # Document metadata
```

#### MongoDB Collections (Unstructured Data)
```
clinical_attachments        # Attachments, images
fhir_resources              # FHIR-compliant resources
clinical_narratives         # Free-text narratives
```

---

### 🏥 Facility Service → `nilecare_facility`

**Current Location:** `nilecare` (business_operations schema) ❌  
**Target Location:** `nilecare_facility` ✅  
**Technology:** MySQL 8.0

#### Tables (5)
```
facilities                  # Facility registry
departments                 # Department management
beds                        # Bed management
wards                       # Ward management
facility_settings           # Configuration
```

---

### 🔬 Lab Service → `nilecare_lab`

**Current Location:** `nilecare` (clinical_data schema) ❌  
**Target Location:** `nilecare_lab` ✅  
**Technology:** MySQL 8.0

#### Tables (4)
```
lab_orders                  # Lab test orders
lab_results                 # Lab test results
lab_tests                   # Test catalog
samples                     # Sample tracking
```

---

### 💊 Medication Service → `nilecare_medication`

**Current Location:** `nilecare` (clinical_data schema) ❌  
**Target Location:** `nilecare_medication` ✅  
**Technology:** MySQL 8.0

#### Tables (5)
```
medications                 # Medication catalog
prescriptions               # Prescriptions
mar_entries                 # Medication Administration Record
high_alert_medications      # High-alert drug tracking
medication_reconciliation   # Reconciliation records
```

---

### 📦 Inventory Service → `nilecare_inventory`

**Current Location:** `nilecare` (business_operations schema) ❌  
**Target Location:** `nilecare_inventory` ✅  
**Technology:** MySQL 8.0

#### Tables (4)
```
inventory_items             # Item catalog
inventory_locations         # Stock locations
inventory_transactions      # Stock movements
suppliers                   # Supplier management
```

---

## 🔄 Cross-Service Data Flow

### Current State (Problematic) ❌

```
┌───────────────┐
│ Shared MySQL  │
│  'nilecare'   │
│               │
│ - auth_*      │
│ - billing_*   │
│ - payment_*   │
│ - facilities  │
│ - patients    │
│ - lab_*       │
└───────────────┘
        ↑
        │ Direct DB Access (Bad)
        │
┌───────┴────────┬──────────────┬──────────────┐
│ Auth Service   │ Billing Svc  │ Payment Svc  │
└────────────────┴──────────────┴──────────────┘
```

### Target State (Recommended) ✅

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ nilecare_   │     │ Apache Kafka │     │ nilecare_   │
│ billing     │     │ Event Bus    │     │ payment     │
└─────────────┘     └──────────────┘     └─────────────┘
      ↑                     ↑                     ↑
      │ API/Events          │ Events              │ API/Events
      │                     │                     │
┌─────┴──────┐     ┌────────┴──────┐     ┌───────┴──────┐
│ Billing    │     │ Notification  │     │ Payment      │
│ Service    │     │ Service       │     │ Service      │
└────────────┘     └───────────────┘     └──────────────┘
```

---

## 📋 Migration Priority Order

### Phase 1: Critical Services (Weeks 1-2)
1. ✅ **Auth Service** → `nilecare_auth` (High priority - security)
2. ✅ **Billing Service** → `nilecare_billing` (High priority - revenue)
3. ✅ **Payment Gateway** → `nilecare_payment` (High priority - revenue)

### Phase 2: Clinical Services (Weeks 3-4)
4. ✅ **Lab Service** → `nilecare_lab`
5. ✅ **Medication Service** → `nilecare_medication`
6. ✅ **CDS Service** → `nilecare_clinical`

### Phase 3: Operational Services (Weeks 5-6)
7. ✅ **Facility Service** → `nilecare_facility`
8. ✅ **Inventory Service** → `nilecare_inventory`
9. ✅ **HL7 Service** → `nilecare_interop`

---

## 🔐 Database User Permissions

| **Database User** | **Database** | **Permissions** | **Services** |
|-------------------|-------------|-----------------|--------------|
| `auth_service` | `nilecare_auth` | SELECT, INSERT, UPDATE | Auth Service |
| `business_service` | `nilecare_business` | SELECT, INSERT, UPDATE, DELETE | Business Service, Appointment Service |
| `billing_service` | `nilecare_billing` | SELECT, INSERT, UPDATE, DELETE | Billing Service |
| `payment_service` | `nilecare_payment` | SELECT, INSERT, UPDATE | Payment Gateway |
| `device_service` | `nilecare_devices` | SELECT, INSERT, UPDATE | Device Integration |
| `notification_service` | `nilecare_notifications` | SELECT, INSERT, UPDATE | Notification Service |
| `ehr_service` | `ehr_service`, `ehr_documents` | SELECT, INSERT, UPDATE | EHR Service |
| `facility_service` | `nilecare_facility` | SELECT, INSERT, UPDATE, DELETE | Facility Service |
| `lab_service` | `nilecare_lab` | SELECT, INSERT, UPDATE | Lab Service |
| `medication_service` | `nilecare_medication` | SELECT, INSERT, UPDATE | Medication Service |
| `inventory_service` | `nilecare_inventory` | SELECT, INSERT, UPDATE, DELETE | Inventory Service |
| `readonly_service` | ALL | SELECT | Analytics, Reporting |

---

## 🔗 API Dependencies

### Auth Service APIs
- **Used By:** ALL services
- **Endpoints:** `/api/v1/auth/verify-token`, `/api/v1/auth/get-user`
- **Purpose:** Token validation, user information

### Billing Service APIs
- **Used By:** Payment Gateway, EHR, Business
- **Endpoints:** `/api/v1/billing/invoices`, `/api/v1/billing/accounts`
- **Purpose:** Invoice creation, billing queries

### Payment Gateway APIs
- **Used By:** Billing, Business, Notification
- **Endpoints:** `/api/v1/payments/process`, `/api/v1/payments/refund`
- **Purpose:** Payment processing

### Facility Service APIs
- **Used By:** ALL services
- **Endpoints:** `/api/v1/facilities`, `/api/v1/facilities/{id}/departments`
- **Purpose:** Facility information, multi-tenancy

---

## 📊 Database Size Estimates

| **Database** | **Estimated Size** | **Growth Rate** | **Backup Frequency** |
|-------------|-------------------|-----------------|---------------------|
| `nilecare_auth` | 500 MB | Low (5 MB/month) | Daily |
| `nilecare_billing` | 5 GB | Medium (200 MB/month) | Daily |
| `nilecare_payment` | 10 GB | High (500 MB/month) | Hourly |
| `nilecare_devices` | 50 GB+ | Very High (2 GB/month) | Continuous |
| `nilecare_notifications` | 2 GB | Medium (100 MB/month) | Daily |
| `ehr_service` | 20 GB | High (800 MB/month) | Daily |
| `nilecare_facility` | 100 MB | Very Low (1 MB/month) | Weekly |
| `nilecare_lab` | 10 GB | High (400 MB/month) | Daily |
| `nilecare_medication` | 5 GB | Medium (200 MB/month) | Daily |
| `nilecare_inventory` | 2 GB | Medium (80 MB/month) | Daily |

---

## ✅ Database Separation Checklist

### Pre-Migration
- [ ] Document all tables owned by service
- [ ] Identify all cross-service queries in code
- [ ] Map foreign key relationships
- [ ] Create database backup
- [ ] Review and update service code

### Migration
- [ ] Create new service-specific database
- [ ] Copy table schema to new database
- [ ] Migrate data to new database
- [ ] Remove cross-service foreign keys
- [ ] Update service database configuration
- [ ] Test service with new database

### Post-Migration
- [ ] Replace direct DB queries with API calls
- [ ] Implement event-driven patterns
- [ ] Update documentation
- [ ] Monitor service health
- [ ] Remove tables from shared database

---

**Document Owner:** Database Architecture Team  
**Last Updated:** October 15, 2025  
**Next Review:** Weekly (during migration period)

