# 🗄️ Phase 2: Complete Microservices Database Separation

**Version:** 1.0.0  
**Start Date:** October 22, 2025  
**Target Completion:** December 3, 2025 (6 weeks)  
**Status:** 🟢 **READY TO START**  
**Scope:** **ALL 15+ Microservices**

---

## 📋 Executive Summary

Phase 2 will **physically separate** all tables from the shared `nilecare` database into dedicated service-specific databases for **all 15+ microservices** in the NileCare Healthcare Platform.

### Phase 2 Objectives

✅ Separate all 15+ microservice databases  
✅ Remove all cross-service foreign key constraints  
✅ Migrate all data from shared `nilecare` database  
✅ Update all service configurations  
✅ Replace direct database queries with API calls  
✅ Implement event-driven synchronization patterns  
✅ Test complete system with separated databases

---

## 🏗️ Complete Microservices Inventory

### 1. **Auth Service** (Port 7020)
- **Current DB:** `nilecare` (shared) ❌
- **Target DB:** `nilecare_auth` ✅
- **Tables:** 7 (auth_users, auth_roles, auth_permissions, etc.)
- **Status:** ✅ Phase 1 Complete (structure ready, needs data migration)
- **Priority:** 🔴 **CRITICAL** (Week 3)

### 2. **Business Service** (Port 7010)
- **Current DB:** `nilecare_business` ✅
- **Target DB:** `nilecare_business` ✅
- **Tables:** 4 (appointments, billings, schedules, staff)
- **Status:** ✅ Already Separate
- **Priority:** ✅ **DONE**

### 3. **Billing Service** (Port 7050)
- **Current DB:** `nilecare` (shared) ❌
- **Target DB:** `nilecare_billing` ✅
- **Tables:** 9 (invoices, billing_accounts, insurance_claims, etc.)
- **Status:** ✅ Phase 1 Complete (structure ready)
- **Priority:** 🔴 **CRITICAL** (Week 3)

### 4. **Payment Gateway Service** (Port 7030)
- **Current DB:** `nilecare` (shared) ❌
- **Target DB:** `nilecare_payment` ✅
- **Tables:** 10 (payments, payment_providers, refunds, etc.)
- **Status:** ✅ Phase 1 Complete (structure ready)
- **Priority:** 🔴 **CRITICAL** (Week 3)

### 5. **Device Integration Service** (Port 7070)
- **Current DB:** `nilecare_devices` (PostgreSQL + TimescaleDB) ✅
- **Target DB:** `nilecare_devices` ✅
- **Tables:** 4 (devices, vital_signs, device_alerts, calibration_records)
- **Status:** ✅ Already Separate
- **Priority:** ✅ **DONE**

### 6. **Notification Service** (Port 3002)
- **Current DB:** `nilecare_notifications` (PostgreSQL) ✅
- **Target DB:** `nilecare_notifications` ✅
- **Tables:** 4 (notifications, templates, subscriptions, deliveries)
- **Status:** ✅ Already Separate
- **Priority:** ✅ **DONE**

### 7. **EHR Service** (Port 4001)
- **Current DB:** `ehr_service` (PostgreSQL) + `ehr_documents` (MongoDB) ✅
- **Target DB:** Same ✅
- **Tables:** 8 (soap_notes, progress_notes, problem_lists, clinical_documents)
- **Status:** ✅ Already Separate (Multi-database)
- **Priority:** ✅ **DONE**

### 8. **Facility Service** (Port 7060)
- **Current DB:** `nilecare` (business_operations schema) ❌
- **Target DB:** `nilecare_facility` ✅
- **Tables:** 5 (facilities, departments, beds, wards, facility_settings)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟡 **HIGH** (Week 4)

### 9. **Lab Service** (Port 7080)
- **Current DB:** `nilecare` (clinical_data schema) ❌
- **Target DB:** `nilecare_lab` ✅
- **Tables:** 4 (lab_orders, lab_results, lab_tests, samples)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟡 **HIGH** (Week 4)

### 10. **Medication Service** (Port 7090)
- **Current DB:** `nilecare` (clinical_data schema) ❌
- **Target DB:** `nilecare_medication` ✅
- **Tables:** 5 (medications, prescriptions, mar_entries, high_alert_medications, medication_reconciliation)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟡 **HIGH** (Week 5)

### 11. **Inventory Service** (Port 7100)
- **Current DB:** `nilecare` (business_operations schema) ❌
- **Target DB:** `nilecare_inventory` ✅
- **Tables:** 4 (inventory_items, inventory_locations, inventory_transactions, suppliers)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟡 **HIGH** (Week 5)

### 12. **Appointment Service** (Port 7040)
- **Current DB:** `nilecare_business` (shared with business) 🟡
- **Target DB:** `nilecare_appointment` ✅
- **Tables:** 1-2 (appointments-related)
- **Status:** 🟡 Shares database with business service
- **Priority:** 🟢 **MEDIUM** (Week 6)

### 13. **CDS Service** (Clinical Decision Support)
- **Current DB:** `nilecare` (clinical_data schema) ❌
- **Target DB:** `nilecare_cds` ✅
- **Tables:** 6 (clinical_guidelines, drug_interactions, allergies, contraindications, therapeutic_ranges, alerts)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟡 **HIGH** (Week 5)

### 14. **FHIR Service**
- **Current DB:** `fhir_resources` (MongoDB) ✅
- **Target DB:** Same ✅
- **Collections:** FHIR resource collections
- **Status:** ✅ Already Separate
- **Priority:** ✅ **DONE**

### 15. **HL7 Service**
- **Current DB:** `nilecare` ❌
- **Target DB:** `nilecare_interop` ✅
- **Tables:** 4 (hl7_messages, adt_messages, orm_messages, oru_messages)
- **Status:** 🔴 Needs Migration
- **Priority:** 🟢 **MEDIUM** (Week 6)

### 16. **Main NileCare** (Port 5000 - Orchestrator)
- **Current DB:** `nilecare` (shouldn't access DB directly) ❌
- **Target DB:** None (orchestrator only) ✅
- **Tables:** 0
- **Status:** ⚠️ Should not access DB directly
- **Priority:** 🟢 **MEDIUM** - Remove DB access (Week 6)

### 17. **Clinical Service** (if separate from EHR)
- **Current DB:** `nilecare` (clinical_data schema) ❌
- **Target DB:** `nilecare_clinical` ✅
- **Tables:** 12 (patients, encounters, diagnoses, vital_signs, procedures, immunizations, etc.)
- **Status:** 🔴 Needs Migration
- **Priority:** 🔴 **CRITICAL** (Week 4)

---

## 📊 Migration Priority Matrix

### Week 3: Critical Services (Revenue & Security)
1. 🔴 **Auth Service** → `nilecare_auth`
2. 🔴 **Billing Service** → `nilecare_billing`
3. 🔴 **Payment Gateway** → `nilecare_payment`

**Why Critical:** Revenue generation, user authentication, security

---

### Week 4: Clinical Core Services
4. 🔴 **Clinical Service** → `nilecare_clinical` (patients, encounters)
5. 🟡 **Facility Service** → `nilecare_facility`
6. 🟡 **Lab Service** → `nilecare_lab`

**Why High Priority:** Core clinical operations, patient safety

---

### Week 5: Clinical Support Services
7. 🟡 **Medication Service** → `nilecare_medication`
8. 🟡 **CDS Service** → `nilecare_cds`
9. 🟡 **Inventory Service** → `nilecare_inventory`

**Why High Priority:** Clinical workflows, medication safety

---

### Week 6: Integration & Optimization
10. 🟢 **HL7 Service** → `nilecare_interop`
11. 🟢 **Appointment Service** → `nilecare_appointment`
12. 🟢 **Main NileCare** → Remove DB access
13. 🟢 **Final Testing & Validation**

**Why Medium Priority:** Interoperability, optimization

---

## 🗺️ Shared Database Table Ownership Map

### From `nilecare` Database (Shared)

#### Identity Management Schema
```sql
-- Owner: Auth Service → nilecare_auth
auth_users
auth_refresh_tokens
auth_devices
auth_roles
auth_permissions
auth_audit_logs
auth_login_attempts
```

#### Clinical Data Schema
```sql
-- Owner: Clinical Service → nilecare_clinical
patients
encounters
diagnoses
allergies
clinical_notes
audit_log

-- Owner: Lab Service → nilecare_lab
lab_orders
lab_results

-- Owner: Medication Service → nilecare_medication
medications

-- Owner: CDS Service → nilecare_cds
(clinical_guidelines, drug_interactions - if in shared DB)
```

#### Business Operations Schema
```sql
-- Owner: Facility Service → nilecare_facility
facilities
departments
beds
wards

-- Owner: Inventory Service → nilecare_inventory
inventory_items
inventory_locations
inventory_transactions
suppliers
purchase_orders
purchase_order_items

-- Owner: Business Service → nilecare_business (already separate)
appointments (in nilecare_business)
```

#### Payment/Billing Schema
```sql
-- Owner: Billing Service → nilecare_billing
invoices
invoice_line_items
invoice_payment_allocations
billing_accounts
insurance_claims
claim_line_items
billing_adjustments
billing_audit_log
charge_master
insurance_policies

-- Owner: Payment Gateway → nilecare_payment
payments
payment_providers
payment_reconciliation
payment_refunds
payment_installment_plans
installment_schedule
payment_webhooks
payment_disputes
payment_analytics_daily
```

#### Interoperability Schema
```sql
-- Owner: HL7 Service → nilecare_interop
hl7_messages
adt_messages
orm_messages
oru_messages
```

---

## 📅 Phase 2 Timeline (6 Weeks)

### Week 3: Critical Services - Auth, Billing, Payment

**Monday-Tuesday: Auth Service**
- [ ] Export auth_* tables from `nilecare` database
- [ ] Import to `nilecare_auth` database
- [ ] Remove cross-service foreign key constraints
- [ ] Update auth-service configuration (DB_NAME=nilecare_auth)
- [ ] Test auth service with new database
- [ ] Verify all auth endpoints work

**Wednesday-Thursday: Billing Service**
- [ ] Export billing tables from `nilecare` database
- [ ] Import to `nilecare_billing` database
- [ ] Remove foreign keys referencing clinical_data.patients
- [ ] Update billing-service configuration
- [ ] Replace direct patient queries with Clinical Service API
- [ ] Test billing service

**Friday: Payment Gateway Service**
- [ ] Export payment_* tables from `nilecare` database
- [ ] Import to `nilecare_payment` database
- [ ] Remove foreign keys referencing invoices
- [ ] Update payment-gateway-service configuration
- [ ] Test payment processing flow
- [ ] Verify end-to-end: Invoice → Payment → Confirmation

**Weekend: Integration Testing**
- [ ] Test Auth → Billing → Payment flow
- [ ] Verify all services communicate correctly
- [ ] Monitor logs for errors
- [ ] Performance testing

---

### Week 4: Clinical Core - Clinical, Facility, Lab

**Monday-Tuesday: Clinical Service**
- [ ] Create `nilecare_clinical` database
- [ ] Create Flyway migrations for clinical schema
- [ ] Export patients, encounters, diagnoses tables
- [ ] Import to `nilecare_clinical`
- [ ] Update clinical service configuration
- [ ] Test patient management workflows

**Wednesday: Facility Service**
- [ ] Create `nilecare_facility` database
- [ ] Create Flyway migrations
- [ ] Export facilities, departments, beds, wards
- [ ] Import to `nilecare_facility`
- [ ] Update facility service configuration
- [ ] Test facility management

**Thursday-Friday: Lab Service**
- [ ] Create `nilecare_lab` database
- [ ] Create Flyway migrations
- [ ] Export lab_orders, lab_results, lab_tests, samples
- [ ] Import to `nilecare_lab`
- [ ] Update lab service configuration
- [ ] Test lab workflows
- [ ] Verify lab order → result flow

---

### Week 5: Clinical Support - Medication, CDS, Inventory

**Monday-Tuesday: Medication Service**
- [ ] Create `nilecare_medication` database
- [ ] Create Flyway migrations
- [ ] Export medications, prescriptions, mar_entries, etc.
- [ ] Import to `nilecare_medication`
- [ ] Update medication service
- [ ] Test prescription workflows
- [ ] Verify drug interaction checks

**Wednesday: CDS Service**
- [ ] Create `nilecare_cds` database
- [ ] Create Flyway migrations
- [ ] Export clinical decision support tables
- [ ] Import to `nilecare_cds`
- [ ] Update CDS service
- [ ] Test clinical guidelines
- [ ] Verify drug interaction alerts

**Thursday-Friday: Inventory Service**
- [ ] Create `nilecare_inventory` database
- [ ] Create Flyway migrations
- [ ] Export inventory_*, suppliers tables
- [ ] Import to `nilecare_inventory`
- [ ] Update inventory service
- [ ] Test stock management
- [ ] Verify purchase order workflows

---

### Week 6: Integration Services & Final Testing

**Monday: HL7 Service**
- [ ] Create `nilecare_interop` database
- [ ] Create Flyway migrations
- [ ] Export HL7 message tables
- [ ] Import to `nilecare_interop`
- [ ] Update HL7 service
- [ ] Test HL7 message processing

**Tuesday: Appointment Service**
- [ ] Evaluate: Keep in `nilecare_business` or separate?
- [ ] If separate: Create `nilecare_appointment` database
- [ ] Migrate if needed
- [ ] Test appointment workflows

**Wednesday: Main NileCare Orchestrator**
- [ ] Remove all direct database access
- [ ] Replace with API calls to microservices
- [ ] Update orchestration logic
- [ ] Test orchestrator

**Thursday-Friday: System Integration Testing**
- [ ] End-to-end testing of all 15+ services
- [ ] Performance testing
- [ ] Load testing
- [ ] Security testing
- [ ] Failover testing

**Weekend: Deployment & Monitoring**
- [ ] Deploy to staging
- [ ] Monitor for 48 hours
- [ ] Fix any issues
- [ ] Prepare for production

---

## 🔧 Migration Scripts for All Services

Let me create Flyway configurations and migrations for the remaining services...

### Services Needing Migrations (9 services)

1. **Clinical Service** - 12 tables
2. **Facility Service** - 5 tables
3. **Lab Service** - 4 tables
4. **Medication Service** - 5 tables
5. **CDS Service** - 6 tables
6. **Inventory Service** - 4 tables
7. **HL7 Service** - 4 tables
8. **Appointment Service** - 1-2 tables (if separating)
9. **Any other discovered services**

---

## 🔄 Cross-Service Dependencies

### Critical Dependencies to Replace

#### Billing → Clinical (Patient Data)
```typescript
// ❌ BEFORE: Direct DB query
const [patients] = await db.query(
  'SELECT * FROM clinical_data.patients WHERE id = ?', 
  [patientId]
);

// ✅ AFTER: API call
const patient = await clinicalServiceClient.getPatient(patientId);
```

#### Payment → Billing (Invoice Data)
```typescript
// ❌ BEFORE: Direct DB query
const [invoices] = await db.query(
  'SELECT * FROM nilecare.invoices WHERE id = ?',
  [invoiceId]
);

// ✅ AFTER: API call
const invoice = await billingServiceClient.getInvoice(invoiceId);
```

#### Billing → Facility (Facility Info)
```typescript
// ❌ BEFORE: Direct DB query
const [facilities] = await db.query(
  'SELECT * FROM business_operations.facilities WHERE id = ?',
  [facilityId]
);

// ✅ AFTER: API call
const facility = await facilityServiceClient.getFacility(facilityId);
```

#### Clinical → Facility (Patient Location)
```typescript
// ❌ BEFORE: Direct DB query
const [beds] = await db.query(
  'SELECT * FROM business_operations.beds WHERE patient_id = ?',
  [patientId]
);

// ✅ AFTER: API call
const bed = await facilityServiceClient.getPatientBed(patientId);
```

#### Lab → Clinical (Patient Results)
```typescript
// ✅ RECOMMENDED: Event-driven
// Lab service publishes event
await eventBus.publish('lab.result.available', {
  labOrderId,
  patientId,
  results,
  isAbnormal,
  isCritical
});

// Clinical service subscribes
eventBus.subscribe('lab.result.available', async (event) => {
  await ehrService.updatePatientRecord(event.patientId, event.results);
});
```

---

## 📦 Data Export/Import Strategy

### Export Tables from Shared Database

```bash
# Create export directory
mkdir -p database/exports/phase2

# Export Auth tables
mysqldump -u root -p nilecare \
  auth_users auth_refresh_tokens auth_devices \
  auth_roles auth_permissions auth_audit_logs auth_login_attempts \
  --no-create-info --skip-triggers \
  > database/exports/phase2/auth_data.sql

# Export Billing tables
mysqldump -u root -p nilecare \
  invoices invoice_line_items invoice_payment_allocations \
  billing_accounts insurance_claims claim_line_items \
  billing_adjustments charge_master billing_audit_log \
  --no-create-info --skip-triggers \
  > database/exports/phase2/billing_data.sql

# Export Payment tables
mysqldump -u root -p nilecare \
  payments payment_providers payment_reconciliation \
  payment_refunds invoice_payments payment_installment_plans \
  installment_schedule payment_webhooks payment_disputes \
  payment_analytics_daily \
  --no-create-info --skip-triggers \
  > database/exports/phase2/payment_data.sql

# Export Clinical tables
mysqldump -u root -p nilecare \
  patients encounters diagnoses allergies clinical_notes \
  audit_log procedures immunizations vital_signs \
  --no-create-info --skip-triggers \
  > database/exports/phase2/clinical_data.sql

# Export Facility tables
mysqldump -u root -p nilecare \
  facilities departments beds wards \
  --no-create-info --skip-triggers \
  > database/exports/phase2/facility_data.sql

# Export Lab tables
mysqldump -u root -p nilecare \
  lab_orders lab_results \
  --no-create-info --skip-triggers \
  > database/exports/phase2/lab_data.sql

# Export Medication tables
mysqldump -u root -p nilecare \
  medications \
  --no-create-info --skip-triggers \
  > database/exports/phase2/medication_data.sql

# Export Inventory tables
mysqldump -u root -p nilecare \
  inventory_items inventory_locations inventory_transactions \
  suppliers purchase_orders purchase_order_items \
  --no-create-info --skip-triggers \
  > database/exports/phase2/inventory_data.sql
```

### Import to Service Databases

```bash
# Import Auth data
mysql -u root -p nilecare_auth < database/exports/phase2/auth_data.sql

# Import Billing data
mysql -u root -p nilecare_billing < database/exports/phase2/billing_data.sql

# Import Payment data
mysql -u root -p nilecare_payment < database/exports/phase2/payment_data.sql

# Import Clinical data
mysql -u root -p nilecare_clinical < database/exports/phase2/clinical_data.sql

# ... repeat for all services
```

### Verify Data Migration

```bash
# Verify record counts match
mysql -u root -p << EOF
SELECT 
  'nilecare' as source,
  'auth_users' as table_name,
  COUNT(*) as record_count
FROM nilecare.auth_users
UNION ALL
SELECT 
  'nilecare_auth' as source,
  'auth_users' as table_name,
  COUNT(*) as record_count
FROM nilecare_auth.auth_users;
EOF

# Expected: Same count in both databases
```

---

## 🔗 Foreign Key Removal Strategy

### Step 1: Document All Cross-Service FKs

```sql
-- Find all foreign keys
SELECT 
  TABLE_SCHEMA,
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_SCHEMA,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA IS NOT NULL
  AND TABLE_SCHEMA = 'nilecare'
  AND REFERENCED_TABLE_SCHEMA != TABLE_SCHEMA;
```

### Step 2: Remove Cross-Service FKs

```sql
-- Example: Remove FK from claims to patients
ALTER TABLE nilecare.claims 
  DROP FOREIGN KEY fk_claims_patient_id;

-- Keep index for performance
CREATE INDEX idx_claims_patient_id 
  ON nilecare.claims(patient_id);
```

### Step 3: Implement Application-Level Validation

```typescript
// In Billing Service
async function validatePatientExists(patientId: string): Promise<boolean> {
  try {
    const patient = await clinicalServiceClient.getPatient(patientId);
    return patient !== null;
  } catch (error) {
    return false;
  }
}

// Before creating invoice
if (!await validatePatientExists(patientId)) {
  throw new Error('Patient not found');
}
```

---

## 🎯 Service-Specific Migration Tasks

### Service 1: Clinical Service (NEW)

**Create Migration Structure:**
```bash
cd microservices/clinical-service
mkdir -p migrations
```

**Flyway Config:** (to be created)
**Migrations:** (to be created)
**Tables:** patients, encounters, diagnoses, allergies, procedures, immunizations, vital_signs, clinical_notes, audit_log

---

### Service 2: Facility Service

**Tables to Migrate:**
- facilities
- departments
- beds
- wards
- facility_settings

**Dependencies:**
- Used by: ALL services (multi-tenancy)
- Must maintain facility_id references

---

### Service 3: Lab Service

**Tables to Migrate:**
- lab_orders
- lab_results
- lab_tests
- samples

**Dependencies:**
- Needs patient_id (from Clinical Service)
- Needs facility_id (from Facility Service)
- Publishes lab results to EHR

---

### Service 4: Medication Service

**Tables to Migrate:**
- medications
- prescriptions
- mar_entries
- high_alert_medications
- medication_reconciliation

**Dependencies:**
- Needs patient_id (from Clinical Service)
- Needs prescriber_id (from Auth Service)
- Drug interactions (from CDS Service)

---

### Service 5: CDS Service

**Tables to Migrate:**
- clinical_guidelines
- drug_interactions
- allergies
- contraindications
- therapeutic_ranges
- alerts

**Dependencies:**
- Consumes data from multiple services
- Provides alerts to clinical workflows

---

### Service 6: Inventory Service

**Tables to Migrate:**
- inventory_items
- inventory_locations
- inventory_transactions
- suppliers
- purchase_orders (if not in business_operations)
- purchase_order_items

**Dependencies:**
- Needs facility_id (from Facility Service)
- Integrates with billing (for charges)

---

### Service 7: HL7 Service

**Tables to Migrate:**
- hl7_messages
- adt_messages
- orm_messages
- oru_messages

**Dependencies:**
- Receives messages from external systems
- Routes to appropriate services

---

## 🚀 Execution Strategy for Week 3 (Start Immediately)

### Day 1: Monday - Auth Service Migration

#### Morning: Preparation (2 hours)
```bash
# 1. Backup shared database
mysqldump -u root -p nilecare > backup_before_auth_migration_$(date +%Y%m%d).sql

# 2. Verify auth database structure
cd microservices/auth-service
npm run migrate:info

# 3. Export auth data
mysqldump -u root -p nilecare \
  auth_users auth_refresh_tokens auth_devices \
  auth_roles auth_permissions auth_audit_logs auth_login_attempts \
  --no-create-info --skip-triggers \
  > ../../database/exports/auth_data.sql
```

#### Afternoon: Migration (3 hours)
```bash
# 4. Import data to nilecare_auth
mysql -u root -p nilecare_auth < database/exports/auth_data.sql

# 5. Verify record counts
mysql -u root -p << EOF
SELECT COUNT(*) as source_count FROM nilecare.auth_users;
SELECT COUNT(*) as target_count FROM nilecare_auth.auth_users;
EOF

# 6. Update auth-service .env
cd microservices/auth-service
# Edit .env: DB_NAME=nilecare_auth

# 7. Test auth service
npm run dev

# 8. Test API endpoints
curl http://localhost:7020/health
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

#### Evening: Verification (1 hour)
- [ ] All auth endpoints working
- [ ] Login/logout functional
- [ ] Token validation working
- [ ] No errors in logs
- [ ] Document any issues

---

### Day 2: Tuesday - Auth Service Finalization

#### Morning: Cross-Service Testing (2 hours)
```bash
# Test services that depend on auth
# 1. Start auth service
cd microservices/auth-service && npm run dev

# 2. In another terminal, start billing service
cd microservices/billing-service && npm run dev

# 3. Test billing API (requires auth)
curl http://localhost:7050/health
```

#### Afternoon: Monitoring (2 hours)
- [ ] Monitor auth service logs
- [ ] Check database connection pool
- [ ] Verify query performance
- [ ] Check error rates
- [ ] Document baseline metrics

---

### Day 3: Wednesday - Billing Service Migration

#### Morning: Preparation
```bash
# 1. Backup
mysqldump -u root -p nilecare > backup_before_billing_migration_$(date +%Y%m%d).sql

# 2. Export billing data
mysqldump -u root -p nilecare \
  invoices invoice_line_items invoice_payment_allocations \
  billing_accounts insurance_claims claim_line_items \
  billing_adjustments charge_master billing_audit_log \
  --no-create-info --skip-triggers \
  > database/exports/billing_data.sql
```

#### Afternoon: Migration
```bash
# 3. Import to nilecare_billing
mysql -u root -p nilecare_billing < database/exports/billing_data.sql

# 4. Verify counts
# 5. Update billing-service .env: DB_NAME=nilecare_billing
# 6. Test billing service
```

---

### Day 4: Thursday - Payment Gateway Migration

#### Morning: Preparation
```bash
# Export payment data
mysqldump -u root -p nilecare \
  payments payment_providers payment_reconciliation \
  payment_refunds invoice_payments payment_installment_plans \
  installment_schedule payment_webhooks payment_disputes \
  payment_analytics_daily \
  --no-create-info --skip-triggers \
  > database/exports/payment_data.sql
```

#### Afternoon: Migration
```bash
# Import to nilecare_payment
mysql -u root -p nilecare_payment < database/exports/payment_data.sql

# Update payment-gateway-service
# Test payment processing
```

---

### Day 5: Friday - Integration Testing

```bash
# Test complete payment flow
1. Create invoice (Billing Service)
2. Process payment (Payment Gateway)
3. Update invoice status (Billing Service)
4. Send notification (Notification Service)
5. Update patient record (Clinical/EHR Service)
```

---

## 📋 Phase 2 Success Criteria

### Week 3 Success Criteria

- [ ] Auth, Billing, Payment migrated to separate databases
- [ ] All services start without errors
- [ ] All API endpoints functional
- [ ] No data loss verified
- [ ] Performance acceptable
- [ ] Integration tests passing

### Week 4 Success Criteria

- [ ] Clinical, Facility, Lab migrated
- [ ] Patient workflows functional
- [ ] Lab order/result flow working
- [ ] Facility management working
- [ ] Cross-service API calls functional

### Week 5 Success Criteria

- [ ] Medication, CDS, Inventory migrated
- [ ] Prescription workflows functional
- [ ] Drug interaction checking working
- [ ] Inventory management functional
- [ ] All 12 services with separate databases

### Week 6 Success Criteria

- [ ] HL7, Appointment services migrated
- [ ] Main orchestrator updated
- [ ] All 15+ services independent
- [ ] End-to-end testing complete
- [ ] Performance benchmarks met
- [ ] Ready for production deployment

---

## 🎯 Overall Phase 2 Goals

| **Metric** | **Current (After Phase 1)** | **Target (After Phase 2)** |
|------------|---------------------------|---------------------------|
| Services with dedicated DBs | 4/15+ (27%) | 15+/15+ (100%) |
| Cross-service DB queries | ~50+ | 0 |
| Deployment independence | None | Full |
| Database scaling | Shared only | Per-service |
| Service isolation | Partial | Complete |

---

## 💰 Phase 2 Investment

### Resources Required

- **Backend Engineers:** 4-5 (full-time, 6 weeks)
- **Database Administrator:** 1 (full-time, 6 weeks)
- **QA Engineers:** 2 (full-time, 6 weeks)
- **DevOps Engineer:** 1 (part-time, 6 weeks)

### Estimated Cost

- **Labor:** $80,000 - $100,000 (6 weeks × 8 people × $150/hr avg)
- **Infrastructure:** $5,000 (additional database instances)
- **Tools:** $0 (using existing tools)
- **Total:** **$85,000 - $105,000**

### Expected ROI

- **Annual Savings:** $74,400 (from Phase 1 analysis)
- **Payback Period:** 14 months
- **5-Year Value:** $372,000+

---

## 🚀 Let's Start Week 3!

Phase 2 is ready to begin. The first three days focus on the **critical services** (Auth, Billing, Payment).

### Your First Task (Monday Morning)

1. Review this plan
2. Assemble migration team
3. Schedule daily standups
4. Begin Auth Service migration

**Start with:** Auth Service data migration (see Week 3 plan above)

---

**Document Created By:** Senior Backend Engineer & System Architect  
**Date:** October 15, 2025  
**Status:** ✅ **READY FOR PHASE 2 EXECUTION**

