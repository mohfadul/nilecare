# 🔍 HL7 + FHIR INTEGRATION & FACILITY SERVICES - COMPREHENSIVE REVIEW

**Date:** October 14, 2025  
**Reviewer:** Senior Backend Engineer & System Architect  
**Services Analyzed:** HL7 Service, FHIR Service, Facility Service

---

## 📋 Executive Summary

This document provides a comprehensive analysis of two critical NileCare microservices:

1. **HL7 + FHIR Integration Microservice** (combining HL7 v2.x and FHIR R4)
2. **Facility Service Microservice**

Both services are in **early/skeleton state** and require significant development to reach production readiness at the same standard as the Medication, Lab, and Inventory services.

---

## 🏥 SERVICE #1: HL7 + FHIR INTEGRATION SERVICE

### 📊 Current Status

| Component | HL7 Service | FHIR Service | Combined Status |
|-----------|-------------|--------------|-----------------|
| **HTTP Server** | ✅ Complete | ✅ Complete | ✅ Ready |
| **Authentication** | ✅ Centralized | ✅ Centralized | ✅ Ready |
| **Routes** | ❌ Missing | 🟡 Partial | 🟡 30% |
| **Controllers** | ❌ Missing | 🟡 Partial | 🟡 20% |
| **Services** | ❌ Missing | 🟡 Partial | 🟡 30% |
| **Middleware** | ❌ Missing | ❌ Missing | ❌ 0% |
| **Models** | ❌ Missing | 🟡 Partial | 🟡 40% |
| **Database Schema** | ❌ Missing | ❌ Missing | ❌ 0% |
| **Tests** | ❌ Missing | ❌ Missing | ❌ 0% |
| **Documentation** | ❌ Missing | ❌ Missing | ❌ 0% |
| **Overall** | 🔴 **~10%** | 🟡 **~25%** | 🟠 **~15%** |

---

## 🎯 HL7 SERVICE ANALYSIS

### Port & Configuration
- **Port:** 6002 (HTTP)
- **MLLP Port:** 2575 (HL7 v2.x protocol)
- **Dependencies:** simple-hl7, hl7v2, hl7parser, net (TCP/IP)

### ✅ What's Implemented

1. **HTTP Server Setup** ✅
   - Express with middleware (helmet, cors, compression)
   - Health checks (/health, /health/ready, /health/startup)
   - Swagger configuration
   - Rate limiting (1500 req/15min)

2. **MLLP Server** ✅
   - TCP server on port 2575
   - MLLP protocol handling (VT/FS/CR frame markers)
   - ACK generation
   - Basic message parsing

3. **WebSocket Support** ✅
   - Socket.IO configured
   - send-hl7-message event
   - parse-hl7-message event

4. **Authentication** ✅
   - Uses centralized auth middleware

### ❌ What's MISSING (Critical)

1. **All Route Implementations** ❌
   ```typescript
   // Referenced but not created:
   - src/routes/adt.ts (ADT messages: Admissions, Discharges, Transfers)
   - src/routes/orm.ts (Order messages: Lab orders, prescriptions)
   - src/routes/oru.ts (Result messages: Lab results)
   - src/routes/messages.ts (Generic message handling)
   - src/routes/mllp.ts (MLLP connection management)
   ```

2. **All Service Implementations** ❌
   ```typescript
   // Referenced but not created:
   - src/services/HL7Service.ts (Core HL7 parsing)
   - src/services/MLLPService.ts (MLLP protocol)
   - src/services/ADTService.ts (ADT message processing)
   - src/services/ORMService.ts (Order message processing)
   - src/services/ORUService.ts (Result message processing)
   - src/services/MessageProcessorService.ts (Message routing)
   - src/services/EventService.ts (Kafka events)
   ```

3. **All Middleware** ❌
   ```typescript
   // Referenced but not created:
   - src/middleware/errorHandler.ts
   - src/middleware/logger.ts
   - src/middleware/validation.ts
   ```

4. **Database Schema** ❌
   - No schema for HL7 message storage
   - No audit logging table
   - No message queue table

5. **Models** ❌
   - No HL7 message models
   - No segment parsers
   - No data type handlers

### 🚨 Syntax Errors Found

**File:** `src/index.ts`
```typescript
// Line 133: Missing closing brace for /health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({...});
  // ❌ MISSING: });

// Line 162: Extra closing brace
});
```

---

## 🔗 FHIR SERVICE ANALYSIS

### Port & Configuration
- **Port:** 6001 (HTTP)
- **FHIR Version:** R4
- **Dependencies:** fhir, fhir-kit-client, @asymmetrik/node-fhir-server-core

### ✅ What's Implemented

1. **HTTP Server Setup** ✅
   - Express with middleware
   - Health checks
   - Swagger configuration
   - Rate limiting (2000 req/15min - higher for FHIR)

2. **FHIRService.ts** 🟡 **Partially Implemented**
   ```typescript
   ✓ Patient CRUD operations
   ✓ Sudan-specific extensions (National ID, State)
   ✓ FHIR Bundle processing (batch/transaction)
   ✓ OperationOutcome creation
   ✓ DTO ↔ FHIR conversion
   ✓ Event emitters
   ```

3. **Patient Routes** ✅
   - Complete Swagger documentation
   - CRUD endpoints (POST, GET, PUT, DELETE)
   - History endpoint (_history)

4. **WebSocket Support** ✅
   - Resource subscriptions
   - Real-time updates
   - Create/update events

### ❌ What's MISSING (High Priority)

1. **Most Route Implementations** ❌
   ```typescript
   // Referenced but not created:
   - src/routes/observations.ts (Vital signs, labs)
   - src/routes/conditions.ts (Diagnoses)
   - src/routes/medications.ts (MedicationRequest)
   - src/routes/encounters.ts (Encounters)
   - src/routes/bulk-data.ts ($export operations)
   - src/routes/smart.ts (SMART on FHIR OAuth)
   - src/routes/capability.ts (Capability Statement)
   ```

2. **Service Implementations** ❌
   ```typescript
   // Referenced but not created:
   - src/services/ResourceService.ts (Generic FHIR resources)
   - src/services/BulkDataService.ts (Bulk export)
   - src/services/SMARTService.ts (SMART on FHIR auth)
   - src/services/EventService.ts (Kafka integration)
   ```

3. **All Middleware** ❌
   ```typescript
   - src/middleware/errorHandler.ts
   - src/middleware/logger.ts
   - src/middleware/validation.ts
   - src/middleware/fhirValidator.ts (FHIR schema validation)
   ```

4. **Database Schema** ❌
   - No schema for FHIR resource storage
   - No versioning table
   - No audit logging

5. **FHIRController.ts** ❌
   - Referenced in routes but not created

### 🚨 Syntax Errors Found

**File:** `src/index.ts`
```typescript
// Line 152: Missing closing brace for /health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({...});
  // ❌ MISSING: });

// Line 181: Extra closing brace
});
```

---

## 🏥 SERVICE #2: FACILITY SERVICE

### Port & Configuration
- **Port:** 5001
- **Purpose:** Multi-tenant facility management
- **Dependencies:** Standard (express, pg, redis, socket.io)

### ✅ What's Implemented

1. **HTTP Server Setup** ✅
   - Express with middleware
   - Health checks
   - Swagger configuration
   - Rate limiting (1000 req/15min)

2. **Routes Defined** 🟡
   - `src/routes/facilities.ts` - Complete route definitions
   - References to other routes (departments, wards, beds, settings)

3. **WebSocket Support** ✅
   - Facility-specific rooms
   - Bed status updates
   - Department updates

4. **Authentication** ✅
   - Centralized auth middleware

### ❌ What's MISSING (Critical)

1. **All Service Implementations** ❌
   ```typescript
   // Referenced but not created:
   - src/services/FacilityService.ts (Core facility management)
   - src/services/NotificationService.ts (Notifications)
   - src/services/EventService.ts (Kafka integration)
   ```

2. **All Controllers** ❌
   ```typescript
   // Referenced but missing:
   - src/controllers/FacilityController.ts
   ```

3. **Most Routes** ❌
   ```typescript
   // Referenced but not created:
   - src/routes/departments.ts
   - src/routes/wards.ts
   - src/routes/beds.ts
   - src/routes/settings.ts
   ```

4. **All Middleware** ❌
   ```typescript
   - src/middleware/errorHandler.ts
   - src/middleware/logger.ts
   - src/middleware/validation.ts
   ```

5. **Database Schema** ❌
   - No schema for facilities
   - No departments table
   - No wards/beds table
   - No audit logging

6. **Models** ❌
   - No facility models
   - No department/ward/bed models

### 🚨 Syntax Errors Found

**File:** `src/index.ts`
```typescript
// Line 124: Missing closing brace for /health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({...});
  // ❌ MISSING: });

// Line 153: Extra closing brace
});
```

---

## 🎯 INTEGRATION ANALYSIS

### HL7 + FHIR Service Integration Requirements

**Should Integrate With:**

| Service | Purpose | Status |
|---------|---------|--------|
| **Clinical Service** | Export EHR data as FHIR | ❌ Not implemented |
| **Lab Service** | HL7 ORU^R01 for lab results | ❌ Not implemented |
| **Appointment Service** | HL7 ADT messages | ❌ Not implemented |
| **Medication Service** | FHIR MedicationRequest | ❌ Not implemented |
| **Patient Service** | FHIR Patient resources | 🟡 Partial (FHIR only) |
| **External EHRs** | HL7 v2.x interface | ❌ Not implemented |
| **External Labs** | HL7 ORU messages | ❌ Not implemented |

### Facility Service Integration Requirements

**Should Integrate With:**

| Service | Purpose | Status |
|---------|---------|--------|
| **Authentication** | User facility assignments | ✅ Auth ready |
| **All Services** | Facility context validation | ❌ Service missing |
| **Business Service** | Organization management | ❌ Not implemented |
| **Inventory Service** | Facility stock locations | ❌ Not implemented |
| **Appointment Service** | Facility scheduling | ❌ Not implemented |

---

## 📐 ARCHITECTURE REQUIREMENTS

### HL7 + FHIR Service Architecture (Target)

```
┌────────────────────────────────────────────────────────────┐
│      HL7 + FHIR Integration Service (Ports 6001, 6002)     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  HTTP Server │  │ MLLP Server  │  │  WebSocket   │    │
│  │  (6001/6002) │  │   (2575)     │  │  (Socket.IO) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              HL7 v2.x Processing Layer              │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ • ADT Service (Admissions/Discharges/Transfers)     │  │
│  │ • ORM Service (Order Messages - Lab, Meds)          │  │
│  │ • ORU Service (Observation Results - Labs)          │  │
│  │ • MLLP Protocol Handler (TCP/IP framing)            │  │
│  │ • ACK Generator (Application Acknowledgments)       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              FHIR R4 API Layer                       │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ • Patient Resource (CRUD + Search)                  │  │
│  │ • Observation Resource (Vitals, Labs)               │  │
│  │ • Condition Resource (Diagnoses)                    │  │
│  │ • MedicationRequest Resource                        │  │
│  │ • Encounter Resource                                │  │
│  │ • Bundle Processor (Batch/Transaction)              │  │
│  │ • Capability Statement (Metadata)                   │  │
│  │ • SMART on FHIR (OAuth2)                            │  │
│  │ • Bulk Data Export ($export)                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            HL7 ↔ FHIR Transformation                │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ • ADT → Patient/Encounter                           │  │
│  │ • ORM → MedicationRequest/ServiceRequest            │  │
│  │ • ORU → Observation/DiagnosticReport                │  │
│  │ • Patient → ADT                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Data Storage                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ • PostgreSQL (FHIR resources + HL7 message log)     │  │
│  │ • MongoDB (Large FHIR documents - optional)         │  │
│  │ • Redis (Message queue + caching)                   │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 🔑 Key Features Needed

**HL7 v2.x Processing:**
1. **ADT Messages** (Admission, Discharge, Transfer)
   - ADT^A01 - Patient Admission
   - ADT^A02 - Transfer
   - ADT^A03 - Discharge
   - ADT^A04 - Registration
   - ADT^A08 - Update Patient Info

2. **ORM Messages** (Orders)
   - ORM^O01 - Lab Order
   - ORM^O01 - Medication Order

3. **ORU Messages** (Results)
   - ORU^R01 - Observation Result

4. **ACK Messages**
   - AA - Application Accept
   - AE - Application Error
   - AR - Application Reject

**FHIR R4 Resources:**
1. **Core Resources** (Must Have)
   - Patient (🟡 Partial)
   - Observation (❌ Missing)
   - Condition (❌ Missing)
   - MedicationRequest (❌ Missing)
   - Encounter (❌ Missing)
   - Procedure (❌ Missing)
   - DiagnosticReport (❌ Missing)
   - AllergyIntolerance (❌ Missing)

2. **Administrative Resources**
   - Organization (❌ Missing)
   - Practitioner (❌ Missing)
   - Location (❌ Missing)

3. **Operations**
   - $export (Bulk Data) (❌ Missing)
   - $everything (Patient data) (❌ Missing)
   - $validate (Resource validation) (❌ Missing)

4. **SMART on FHIR**
   - OAuth2 authorization (❌ Missing)
   - Scope-based access control (❌ Missing)
   - .well-known/smart-configuration (❌ Missing)

### 🏗️ Recommended Implementation Approach

**Phase 1: Foundation (Week 1-2)**
1. Fix syntax errors in index.ts
2. Create core utilities (logger, database)
3. Create middleware (error handler, validation, FHIR validator)
4. Create base models (HL7 segment parsers, FHIR resource interfaces)

**Phase 2: HL7 v2.x Implementation (Week 3-4)**
1. Implement HL7Service (message parsing, segment extraction)
2. Implement MLLPService (protocol, ACK generation)
3. Implement ADTService (patient admission/discharge)
4. Implement ORMService (order processing)
5. Implement ORUService (result processing)
6. Create database schema for message logging

**Phase 3: FHIR R4 Implementation (Week 5-6)**
1. Complete remaining FHIR resource endpoints
2. Implement Bulk Data Export
3. Implement SMART on FHIR authentication
4. Implement Capability Statement
5. Create FHIR validation middleware

**Phase 4: Integration & Transformation (Week 7-8)**
1. HL7 → FHIR transformation services
2. FHIR → HL7 transformation services
3. Integration with Clinical/Lab/Medication services
4. Event publishing (Kafka)

**Phase 5: Testing & Documentation (Week 9-10)**
1. Unit tests for parsers and transformations
2. Integration tests with external systems
3. Comprehensive documentation
4. Performance testing (MLLP throughput)

---

## 🏥 FACILITY SERVICE ANALYSIS

### Port & Configuration
- **Port:** 5001
- **Purpose:** Multi-tenant facility, department, ward, and bed management

### ✅ What's Implemented

1. **HTTP Server Setup** ✅
   - Express with middleware
   - Health checks
   - Swagger configuration

2. **Facility Routes Defined** ✅
   - Complete Swagger documentation
   - Validation rules with express-validator
   - CRUD endpoints defined

3. **WebSocket Support** ✅
   - Facility-specific rooms
   - Bed status updates
   - Department updates

### ❌ What's MISSING (Critical)

1. **All Service Implementations** ❌
   ```typescript
   - src/services/FacilityService.ts
   - src/services/DepartmentService.ts
   - src/services/WardService.ts
   - src/services/BedService.ts
   - src/services/NotificationService.ts
   - src/services/EventService.ts
   ```

2. **All Controllers** ❌
   ```typescript
   - src/controllers/FacilityController.ts
   - src/controllers/DepartmentController.ts
   - src/controllers/WardController.ts
   - src/controllers/BedController.ts
   ```

3. **Most Routes** ❌
   ```typescript
   - src/routes/departments.ts
   - src/routes/wards.ts
   - src/routes/beds.ts
   - src/routes/settings.ts
   ```

4. **All Middleware** ❌
   ```typescript
   - src/middleware/errorHandler.ts
   - src/middleware/logger.ts
   - src/middleware/validation.ts
   ```

5. **Database Schema** ❌
   - No facilities table
   - No departments table
   - No wards table
   - No beds table
   - No facility_settings table
   - No audit logging

6. **All Models** ❌
   - No facility models
   - No department models
   - No ward/bed models

### 🔑 Key Features Needed

1. **Facility Management**
   - CRUD operations for facilities
   - Facility types (hospital, clinic, lab, pharmacy)
   - Operating hours and schedules
   - License and accreditation tracking
   - Contact information management

2. **Department Management**
   - Departments per facility
   - Department services and specialties
   - Staff assignments
   - Equipment inventory

3. **Ward & Bed Management**
   - Ward tracking per facility
   - Bed inventory and status
   - Real-time bed availability
   - Admission/discharge tracking
   - Bed assignments

4. **Facility Settings**
   - Configurable settings per facility
   - Appointment scheduling rules
   - Billing configurations
   - Notification preferences

5. **Multi-Tenancy**
   - Organization → Facilities relationship
   - Data isolation
   - Cross-facility access control

### 🏗️ Recommended Implementation Approach

**Phase 1: Foundation (Week 1)**
1. Fix syntax errors
2. Create utilities (logger, database)
3. Create middleware (error handler, validation)
4. Create database schema

**Phase 2: Core Services (Week 2-3)**
1. Implement FacilityService (CRUD, search)
2. Implement DepartmentService
3. Implement WardService
4. Implement BedService

**Phase 3: Controllers & Routes (Week 4)**
1. Implement FacilityController
2. Create all missing routes
3. Implement WebSocket handlers

**Phase 4: Integration (Week 5)**
1. Integrate with Authentication Service
2. Integrate with Business Service (organizations)
3. Integrate with Inventory Service (locations)
4. Event publishing (Kafka)

**Phase 5: Testing & Documentation (Week 6)**
1. Unit tests
2. Integration tests
3. Comprehensive documentation
4. API documentation

---

## 🚨 CRITICAL ISSUES TO FIX IMMEDIATELY

### Issue #1: Syntax Errors in All Services

**All three index.ts files have the same error:**
```typescript
// Health endpoint missing closing brace
app.get('/health', (req, res) => {
  res.status(200).json({...});
  // ❌ MISSING: });
// Extra closing brace later in file
});
```

**Fix Required:** Add closing braces to health endpoints

### Issue #2: Undefined References

**All services reference undefined variables:**
```typescript
// Line 138 (hl7-service)
// Line 157 (fhir-service)
// Line 129 (facility-service)
if (typeof dbPool !== 'undefined' && dbPool) {
  await dbPool.query('SELECT 1'); // ❌ dbPool not defined
}
```

**Fix Required:** Either import dbPool from database utility or comment out until implemented

### Issue #3: Missing Route/Service Imports

**All services import non-existent files:**
```typescript
// HL7 Service
import adtRoutes from './routes/adt'; // ❌ File doesn't exist
import { HL7Service } from './services/HL7Service'; // ❌ File doesn't exist

// FHIR Service
import observationRoutes from './routes/observations'; // ❌ File doesn't exist
import { ResourceService } from './services/ResourceService'; // ❌ File doesn't exist

// Facility Service
import departmentRoutes from './routes/departments'; // ❌ File doesn't exist
import { FacilityService } from './services/FacilityService'; // ❌ File doesn't exist
```

**Fix Required:** Create files or comment out imports until implemented

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

### Priority 1: CRITICAL (Blocks Other Services)

1. **Facility Service** - Needed for facility context in all services
   - Estimated effort: 2-3 weeks
   - Complexity: Medium
   - Dependencies: Authentication, Business (organizations)
   - Impact: Blocks full multi-facility support

### Priority 2: HIGH (Clinical Interoperability)

2. **FHIR Service** - External EHR integration
   - Estimated effort: 4-6 weeks
   - Complexity: High
   - Dependencies: Clinical, Patient, Lab, Medication services
   - Impact: Enables data exchange with external systems

3. **HL7 Service** - Legacy system integration
   - Estimated effort: 4-6 weeks
   - Complexity: High
   - Dependencies: Lab, Medication, Patient services
   - Impact: Enables integration with hospital systems (ADT, lab instruments)

### Priority 3: MEDIUM (Future Enhancements)

4. **Advanced FHIR Features** - Bulk export, SMART on FHIR
   - Estimated effort: 2-3 weeks
   - Complexity: Medium
   - Dependencies: Complete FHIR service
   - Impact: Enables advanced use cases (research, EHR apps)

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

Based on dependencies and business impact:

### 1️⃣ **FIRST: Facility Service** (Highest Priority)

**Why First:**
- Required by ALL services for facility context
- Relatively simple to implement
- Blocks full multi-facility rollout
- Foundation for data isolation

**Implementation Timeline:** 2-3 weeks

**Deliverables:**
- Complete facility CRUD
- Department/ward/bed management
- Real-time bed status updates
- Integration with Auth Service
- Multi-tenancy support

### 2️⃣ **SECOND: FHIR Service** (High Priority)

**Why Second:**
- Modern standard for healthcare data exchange
- Required for external EHR integration
- Enables mobile app development (SMART on FHIR)
- Better for API-first clients

**Implementation Timeline:** 4-6 weeks

**Deliverables:**
- Complete FHIR R4 resource endpoints (Patient, Observation, Condition, etc.)
- Bundle processing (batch/transaction)
- FHIR search parameters
- Capability Statement
- Integration with Clinical/Lab/Medication services

### 3️⃣ **THIRD: HL7 v2.x Service** (Medium Priority)

**Why Third:**
- Needed for legacy hospital system integration
- Lab instrument integration
- ADT feed from hospital systems
- More complex (older protocol)

**Implementation Timeline:** 4-6 weeks

**Deliverables:**
- Complete HL7 v2.x message processing
- MLLP protocol implementation
- ADT/ORM/ORU message handlers
- HL7 ↔ FHIR transformation
- Integration with Lab and Medication services

---

## 🛠️ FACILITY SERVICE - DETAILED IMPLEMENTATION PLAN

### 🎯 What to Build

**1. Database Schema**
```sql
-- Facilities table
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50) CHECK (facility_type IN ('hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation')),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Capacity
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  emergency_beds INTEGER DEFAULT 0,
  
  -- Licensing
  license_number VARCHAR(100),
  license_expiry DATE,
  accreditation VARCHAR(100),
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  language VARCHAR(10) DEFAULT 'ar',
  currency VARCHAR(10) DEFAULT 'SDG',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_24_hours BOOLEAN DEFAULT false,
  
  -- Operating hours
  operating_hours JSONB,
  services JSONB,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_facility_code UNIQUE (facility_code)
);

CREATE INDEX idx_facilities_org ON facilities (organization_id);
CREATE INDEX idx_facilities_type ON facilities (facility_type);
CREATE INDEX idx_facilities_active ON facilities (is_active) WHERE is_active = true;

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  department_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  specialty VARCHAR(100),
  
  -- Staff
  head_of_department_id UUID,
  staff_count INTEGER DEFAULT 0,
  
  -- Location
  floor_number INTEGER,
  wing VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  services JSONB,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_dept_code_per_facility UNIQUE (facility_id, department_code)
);

-- Wards table
CREATE TABLE wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  department_id UUID REFERENCES departments(id),
  ward_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ward_type VARCHAR(50) CHECK (ward_type IN ('general', 'icu', 'emergency', 'maternity', 'pediatric', 'isolation')),
  
  -- Capacity
  total_beds INTEGER NOT NULL DEFAULT 0,
  occupied_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  
  -- Location
  floor_number INTEGER,
  building VARCHAR(100),
  
  -- Staff
  nurse_station_phone VARCHAR(20),
  head_nurse_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_ward_code_per_facility UNIQUE (facility_id, ward_code)
);

-- Beds table
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  ward_id UUID NOT NULL REFERENCES wards(id),
  bed_number VARCHAR(50) NOT NULL,
  bed_type VARCHAR(50) CHECK (bed_type IN ('standard', 'icu', 'isolation', 'maternity', 'pediatric', 'bariatric')),
  
  -- Status
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved', 'blocked')),
  
  -- Current patient
  current_patient_id UUID,
  admission_id UUID,
  admission_date TIMESTAMP,
  expected_discharge_date TIMESTAMP,
  
  -- Equipment
  has_oxygen BOOLEAN DEFAULT false,
  has_monitor BOOLEAN DEFAULT false,
  has_ventilator BOOLEAN DEFAULT false,
  
  -- Location
  room_number VARCHAR(50),
  position VARCHAR(50), -- window, center, corner
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_cleaned_at TIMESTAMP,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_bed_per_ward UNIQUE (ward_id, bed_number)
);

-- Facility Settings table
CREATE TABLE facility_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  
  -- Appointment settings
  appointment_duration_default INTEGER DEFAULT 30,
  appointment_buffer_time INTEGER DEFAULT 15,
  advance_booking_days INTEGER DEFAULT 90,
  same_day_booking_allowed BOOLEAN DEFAULT true,
  
  -- Billing settings
  default_currency VARCHAR(10) DEFAULT 'SDG',
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  
  -- Notification settings
  sms_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  reminder_hours_before INTEGER DEFAULT 24,
  
  -- Custom fields
  custom_settings JSONB,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_settings_per_facility UNIQUE (facility_id)
);

-- Audit log
CREATE TABLE facility_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**2. Core Services**
```typescript
// src/services/FacilityService.ts
class FacilityService {
  async createFacility(data): Promise<Facility>
  async getFacilityById(id): Promise<Facility>
  async getAllFacilities(filters, pagination): Promise<{ facilities, total }>
  async updateFacility(id, data): Promise<Facility>
  async deleteFacility(id): Promise<boolean>
  async getFacilityDepartments(facilityId): Promise<Department[]>
  async getFacilityCapacity(facilityId): Promise<CapacityInfo>
  async getAvailableBeds(facilityId, wardId?): Promise<Bed[]>
  async assignBed(bedId, patientId, admissionId): Promise<Bed>
  async releaseBed(bedId, dischargeReason): Promise<Bed>
  async updateBedStatus(bedId, status): Promise<Bed>
  async getFacilityStatistics(facilityId): Promise<Statistics>
}

// src/services/DepartmentService.ts
class DepartmentService {
  async createDepartment(facilityId, data): Promise<Department>
  async getDepartmentById(id): Promise<Department>
  async updateDepartment(id, data): Promise<Department>
  async deleteDepartment(id): Promise<boolean>
  async getDepartmentWards(departmentId): Promise<Ward[]>
  async getDepartmentStaff(departmentId): Promise<Staff[]>
}

// src/services/WardService.ts
class WardService {
  async createWard(facilityId, data): Promise<Ward>
  async getWardById(id): Promise<Ward>
  async updateWard(id, data): Promise<Ward>
  async getWardBeds(wardId): Promise<Bed[]>
  async getWardOccupancy(wardId): Promise<OccupancyStats>
}

// src/services/BedService.ts
class BedService {
  async createBed(wardId, data): Promise<Bed>
  async getBedById(id): Promise<Bed>
  async updateBedStatus(id, status, reason): Promise<Bed>
  async assignBed(bedId, patientId, admissionId): Promise<Bed>
  async releaseBed(bedId): Promise<Bed>
  async getBedHistory(bedId): Promise<BedHistory[]>
}
```

**3. Integration Points**
```typescript
// With Authentication Service
- Validate facility assignments
- Check user facility access
- Enforce facility isolation

// With Business Service
- Link facilities to organizations
- Hierarchical management

// With Inventory Service
- Map facility locations to inventory locations
- Stock tracking per facility

// With All Services
- Provide facility context
- Validate facility ownership
```

---

## 📈 EFFORT ESTIMATION

### Facility Service

| Component | Effort | Complexity |
|-----------|--------|------------|
| Foundation (utils, middleware) | 1 week | Low |
| Database schema | 3 days | Low |
| Core services (4 services) | 2 weeks | Medium |
| Controllers & routes | 1 week | Low |
| Integration & testing | 1 week | Medium |
| **TOTAL** | **5-6 weeks** | **Medium** |

### FHIR Service

| Component | Effort | Complexity |
|-----------|--------|------------|
| Foundation | 1 week | Low |
| Complete FHIRService | 2 weeks | High |
| All FHIR resources (7+) | 3 weeks | High |
| SMART on FHIR | 1 week | High |
| Bulk Data Export | 1 week | Medium |
| Integration & testing | 2 weeks | High |
| **TOTAL** | **10-12 weeks** | **High** |

### HL7 Service

| Component | Effort | Complexity |
|-----------|--------|------------|
| Foundation | 1 week | Low |
| HL7 parsers (ADT, ORM, ORU) | 3 weeks | High |
| MLLP protocol refinement | 1 week | Medium |
| HL7 ↔ FHIR transformation | 2 weeks | High |
| Integration & testing | 2 weeks | High |
| **TOTAL** | **9-11 weeks** | **High** |

---

## 🎯 NEXT STEPS RECOMMENDATION

### Immediate Actions (This Week)

1. **Fix Syntax Errors**
   - Fix missing closing braces in all index.ts files
   - Comment out undefined dbPool references
   - Comment out missing imports

2. **Document Current State**
   - Create README.md for each service
   - Document intended features
   - Create implementation TODO lists

### Short Term (Next 2-4 Weeks)

3. **Implement Facility Service**
   - Highest priority (blocks other features)
   - Medium complexity
   - Clear requirements
   - Immediate business value

### Medium Term (Next 1-3 Months)

4. **Implement FHIR Service**
   - Complete remaining FHIR resources
   - FHIR validation
   - Integration with clinical services

5. **Implement HL7 Service**
   - Complete HL7 message processing
   - MLLP protocol
   - Transformation services

---

## 📚 COMPARISON TO COMPLETED SERVICES

### Standards Established by Medication/Lab/Inventory

| Feature | Med/Lab/Inv Services | HL7 Service | FHIR Service | Facility Service |
|---------|---------------------|-------------|--------------|------------------|
| **Utilities (logger, database)** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Middleware (error, validation, facility)** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Models** | ✅ Complete | ❌ Missing | 🟡 Partial | ❌ Missing |
| **Repositories** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Services** | ✅ Complete | ❌ Missing | 🟡 Partial | ❌ Missing |
| **Controllers** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Routes** | ✅ Complete | ❌ Missing | 🟡 Partial | 🟡 Partial |
| **Integration Clients** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Event Publishing** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Database Schema** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |
| **Tests** | ✅ Structure | ❌ Missing | ❌ Missing | ❌ Missing |
| **Documentation** | ✅ Complete | ❌ Missing | ❌ Missing | ❌ Missing |

**Gap:** All three services need to be brought up to the same standard as Medication/Lab/Inventory!

---

## 🎊 FINAL RECOMMENDATIONS

### Recommendation #1: Prioritize Facility Service

**Rationale:**
- Foundation for multi-facility data isolation
- Relatively simple to implement (2-3 weeks)
- Unblocks other services
- Clear business requirements

**Action Plan:**
1. Fix syntax errors
2. Implement complete foundation (utils, middleware)
3. Create database schema
4. Implement all services (Facility, Department, Ward, Bed)
5. Create controllers and routes
6. Add comprehensive documentation
7. Write tests

### Recommendation #2: Defer HL7/FHIR to Later Phase

**Rationale:**
- High complexity (4-6 weeks each)
- Requires completed Clinical/Lab/Medication services
- Not blocking current NileCare workflows
- Can be implemented as Phase 2 after core platform stable

**Action Plan:**
1. Document requirements comprehensively
2. Create architecture diagrams
3. Define integration contracts
4. Implement when core services are production-ready

### Recommendation #3: Follow Established Patterns

**Use Same Architecture as Medication/Lab/Inventory:**
```
✓ Layered: Controller → Service → Repository
✓ Utilities: logger.ts, database.ts
✓ Middleware: errorHandler, validation, facilityMiddleware
✓ Integration clients for other services
✓ Event publishing (Kafka)
✓ Atomic operations with transactions
✓ Comprehensive audit logging
✓ Complete Swagger documentation
✓ Unit and integration tests
```

---

## 📋 DELIVERABLES REQUIRED FOR PRODUCTION

### Facility Service (To Match Med/Lab/Inv Standard)

**Code:**
- [ ] src/utils/logger.ts (Winston with HIPAA compliance)
- [ ] src/utils/database.ts (PostgreSQL + Redis)
- [ ] src/middleware/errorHandler.ts
- [ ] src/middleware/rateLimiter.ts
- [ ] src/middleware/validation.ts
- [ ] src/middleware/facilityMiddleware.ts (self-referential isolation)
- [ ] src/models/Facility.ts
- [ ] src/models/Department.ts
- [ ] src/models/Ward.ts
- [ ] src/models/Bed.ts
- [ ] src/repositories/FacilityRepository.ts
- [ ] src/repositories/DepartmentRepository.ts
- [ ] src/repositories/WardRepository.ts
- [ ] src/repositories/BedRepository.ts
- [ ] src/services/FacilityService.ts
- [ ] src/services/DepartmentService.ts
- [ ] src/services/WardService.ts
- [ ] src/services/BedService.ts
- [ ] src/services/integrations/AuthServiceClient.ts
- [ ] src/services/integrations/BusinessServiceClient.ts
- [ ] src/controllers/FacilityController.ts
- [ ] src/controllers/DepartmentController.ts
- [ ] src/controllers/WardController.ts
- [ ] src/controllers/BedController.ts
- [ ] src/routes/facilities.ts (enhance existing)
- [ ] src/routes/departments.ts
- [ ] src/routes/wards.ts
- [ ] src/routes/beds.ts
- [ ] src/routes/settings.ts
- [ ] src/events/EventPublisher.ts
- [ ] database/schema.sql

**Documentation:**
- [ ] README.md
- [ ] FACILITY_SERVICE_SUMMARY.md
- [ ] IMPLEMENTATION_GUIDE.md
- [ ] API_DOCUMENTATION.md
- [ ] .env.example

**Tests:**
- [ ] Unit tests for all services
- [ ] Integration tests
- [ ] Test setup and utilities

**Estimated Total:** 30-40 files, ~5,000-7,000 lines of code

---

## 🎉 CONCLUSION

### Current State Summary

| Service | Completion | Status | Priority |
|---------|------------|--------|----------|
| **Facility Service** | ~10% | 🔴 Skeleton | 🔥 CRITICAL |
| **FHIR Service** | ~25% | 🟡 Partial | 🟠 HIGH |
| **HL7 Service** | ~10% | 🔴 Skeleton | 🟡 MEDIUM |

### Required Actions

1. **IMMEDIATE**: Fix syntax errors in all three services
2. **SHORT TERM**: Implement Facility Service (2-3 weeks)
3. **MEDIUM TERM**: Complete FHIR Service (4-6 weeks after Facility)
4. **LONG TERM**: Complete HL7 Service (4-6 weeks after FHIR)

### Quality Standards

All three services must be brought to the same A+ standard as:
- ✅ Medication Service v1.0
- ✅ Lab Service v1.0
- ✅ Inventory Service v2.0 (Pharmacy-Aware)

This means:
- Complete layered architecture
- Comprehensive error handling
- Full audit logging
- Integration with all services
- Event-driven communication
- Complete documentation
- Test coverage
- Production-ready infrastructure

---

**Review Date:** October 14, 2025  
**Next Review:** After Facility Service implementation  
**Reviewer:** Senior Backend Engineer  
**Status:** 📋 **COMPREHENSIVE REVIEW COMPLETE**

**Next Steps:** 
1. Present findings to team
2. Prioritize Facility Service implementation
3. Create detailed implementation plan
4. Begin development with same standards as Med/Lab/Inv services

---

*This review strictly follows the NileCare platform standards and best practices established by the successfully completed Medication, Lab, and Inventory microservices.*

