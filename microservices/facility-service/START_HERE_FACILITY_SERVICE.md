# 🚀 FACILITY SERVICE - START HERE!

**Priority:** 🔥 **CRITICAL - #1 BLOCKER**  
**Timeline:** 3 weeks to A+ production-ready  
**Date:** October 14, 2025

---

## 🎯 WHY THIS IS CRITICAL

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  🚨 FACILITY SERVICE IS BLOCKING PRODUCTION DEPLOYMENT! 🚨    │
│                                                               │
│  ALL NileCare services have facility isolation but           │
│  NO central facility management service!                      │
│                                                               │
│  This blocks:                                                 │
│  • Multi-facility deployment                                 │
│  • User facility assignments                                  │
│  • Bed availability tracking                                  │
│  • Hospital structure management                              │
│  • Complete data isolation                                    │
│                                                               │
│  STATUS: Currently limited to single-facility deployment     │
│  TARGET: Full multi-facility support                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 📋 CURRENT STATE

**Port:** 5001  
**Completion:** 10%  
**Grade:** F (needs to reach A+)

**What EXISTS:**
- ✅ HTTP server with Express
- ✅ Centralized authentication
- ✅ One route file (facilities.ts) with Swagger
- ✅ WebSocket configuration

**What's MISSING (90%):**
- ❌ All utilities (logger, database)
- ❌ All middleware (error, validation, facility)
- ❌ All services (4 services)
- ❌ All controllers (4 controllers)
- ❌ Most routes (4 route files)
- ❌ All models (5 models)
- ❌ All repositories (4 repos)
- ❌ Database schema (6 tables)
- ❌ Integration clients (2 clients)
- ❌ Event publishing
- ❌ Documentation
- ❌ Tests

---

## ⚡ QUICK START (30 Minutes)

### Step 1: Fix Syntax Errors

**File:** `src/index.ts`

**Problem:** Missing/extra closing braces

**Fix:**
```typescript
// Line 117-123: ADD closing brace
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'facility-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}); // ✅ ADD THIS

// Line 126-135: ADD closing brace  
app.get('/health/ready', async (req, res) => {
  try {
    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message 
    });
  }
}); // ✅ ADD THIS

// Line 153: REMOVE extra brace
}); // ❌ DELETE THIS LINE
```

### Step 2: Test Service Starts

```bash
cd microservices/facility-service
npm install
npm run dev

# Expected: Service starts on port 5001
# Test: curl http://localhost:5001/health
```

---

## 📅 3-WEEK IMPLEMENTATION PLAN

### Week 1: Foundation & Core

**Day 1: Foundation Files**
```bash
# Create utilities (copy from Inventory Service as template)
✓ src/utils/logger.ts (Winston with HIPAA logging)
✓ src/utils/database.ts (PostgreSQL + Redis + transactions)

# Create middleware
✓ src/middleware/errorHandler.ts (custom error classes)
✓ src/middleware/rateLimiter.ts (3 limiters)
✓ src/middleware/validation.ts (Joi schemas)
```

**Day 2: Database Schema**
```sql
# Create database/schema.sql with 6 tables:
1. facilities (main table)
2. departments (per facility)
3. wards (per department)
4. beds (per ward)
5. facility_settings (configurable settings)
6. facility_audit_log (complete audit trail)

# Plus:
- Indexes for performance
- Triggers for updated_at
- Sample data (2-3 test facilities)
- Views for reporting
```

**Day 3: Models**
```typescript
✓ src/models/Facility.ts
✓ src/models/Department.ts
✓ src/models/Ward.ts
✓ src/models/Bed.ts
✓ src/models/FacilitySettings.ts
```

**Days 4-5: Facility Service**
```typescript
✓ src/repositories/FacilityRepository.ts (data access)
✓ src/services/FacilityService.ts (business logic)
✓ src/controllers/FacilityController.ts (HTTP handling)
✓ Enhance src/routes/facilities.ts
✓ Test CRUD operations
```

### Week 2: Departments, Wards, Beds

**Days 6-7: Department Service**
```typescript
✓ src/repositories/DepartmentRepository.ts
✓ src/services/DepartmentService.ts
✓ src/controllers/DepartmentController.ts
✓ src/routes/departments.ts
✓ Test department management
```

**Days 8-9: Ward Service**
```typescript
✓ src/repositories/WardRepository.ts
✓ src/services/WardService.ts
✓ src/controllers/WardController.ts
✓ src/routes/wards.ts
✓ Implement capacity tracking
✓ Test ward occupancy
```

**Day 10: Bed Service** (CRITICAL for Admissions)
```typescript
✓ src/repositories/BedRepository.ts
✓ src/services/BedService.ts
✓ src/controllers/BedController.ts
✓ src/routes/beds.ts
✓ Implement bed assignment/release
✓ Real-time bed status (WebSocket)
✓ Test bed availability
```

### Week 3: Integration & Polish

**Days 11-12: Integration**
```typescript
✓ src/services/integrations/AuthServiceClient.ts
✓ src/services/integrations/BusinessServiceClient.ts
✓ Test integration with Auth Service
✓ Test integration with Business Service
✓ Validate facility ownership checks
```

**Day 13: Event Publishing**
```typescript
✓ src/events/EventPublisher.ts
✓ facility.created event
✓ bed.status_changed event
✓ ward.capacity_updated event
✓ Test Kafka integration
```

**Days 14-15: Documentation & Completion**
```markdown
✓ README.md (complete service guide)
✓ FACILITY_SERVICE_SUMMARY.md
✓ .env.example
✓ API documentation (Swagger)
✓ Integration guide
✓ Create test structure
✓ Final validation
```

---

## 📦 REQUIRED DELIVERABLES

### Code Files (30-40 files)

**Utilities (2 files):**
- src/utils/logger.ts
- src/utils/database.ts

**Middleware (4 files):**
- src/middleware/errorHandler.ts
- src/middleware/rateLimiter.ts
- src/middleware/validation.ts
- src/middleware/facilityMiddleware.ts (self-referential!)

**Models (5 files):**
- src/models/Facility.ts
- src/models/Department.ts
- src/models/Ward.ts
- src/models/Bed.ts
- src/models/FacilitySettings.ts

**Repositories (4 files):**
- src/repositories/FacilityRepository.ts
- src/repositories/DepartmentRepository.ts
- src/repositories/WardRepository.ts
- src/repositories/BedRepository.ts

**Services (5 files):**
- src/services/FacilityService.ts
- src/services/DepartmentService.ts
- src/services/WardService.ts
- src/services/BedService.ts
- src/services/SettingsService.ts

**Integration (2 files):**
- src/services/integrations/AuthServiceClient.ts
- src/services/integrations/BusinessServiceClient.ts

**Controllers (4 files):**
- src/controllers/FacilityController.ts
- src/controllers/DepartmentController.ts
- src/controllers/WardController.ts
- src/controllers/BedController.ts

**Routes (5 files):**
- src/routes/facilities.ts (enhance existing)
- src/routes/departments.ts
- src/routes/wards.ts
- src/routes/beds.ts
- src/routes/settings.ts

**Events (1 file):**
- src/events/EventPublisher.ts

**Database (1 file):**
- database/schema.sql

**Total Code Files:** 33 files, ~5,000-7,000 lines

### Documentation (5 files)

- README.md
- FACILITY_SERVICE_SUMMARY.md
- IMPLEMENTATION_GUIDE.md
- .env.example
- database/schema-docs.md

### Tests (5+ files)

- tests/setup.ts
- tests/unit/FacilityService.test.ts
- tests/unit/BedService.test.ts
- tests/integration/facility-workflow.test.ts
- tests/integration/bed-management.test.ts

---

## 🔑 KEY FEATURES TO IMPLEMENT

### 1. Facility CRUD (Core)

```typescript
POST   /api/v1/facilities           → Create facility
GET    /api/v1/facilities           → List all (paginated)
GET    /api/v1/facilities/:id       → Get by ID
PUT    /api/v1/facilities/:id       → Update
DELETE /api/v1/facilities/:id       → Soft delete
GET    /api/v1/facilities/search    → Search by name/location
```

### 2. Department Management

```typescript
POST   /api/v1/departments                  → Create department
GET    /api/v1/departments                  → List departments
GET    /api/v1/departments/:id              → Get by ID
GET    /api/v1/facilities/:id/departments   → Get facility departments
PUT    /api/v1/departments/:id              → Update
DELETE /api/v1/departments/:id              → Delete
```

### 3. Ward & Capacity

```typescript
POST   /api/v1/wards                → Create ward
GET    /api/v1/wards/:id            → Get ward
GET    /api/v1/wards/:id/occupancy  → Get occupancy stats
GET    /api/v1/wards/:id/beds       → Get ward beds
PUT    /api/v1/wards/:id            → Update ward
```

### 4. Bed Management (CRITICAL!)

```typescript
POST   /api/v1/beds                  → Create bed
GET    /api/v1/beds/:id              → Get bed
PUT    /api/v1/beds/:id/status       → Update status
POST   /api/v1/beds/:id/assign       → Assign to patient ⭐
POST   /api/v1/beds/:id/release      → Release bed ⭐
GET    /api/v1/beds/available        → Get available beds ⭐
GET    /api/v1/beds/:id/history      → Bed assignment history
```

### 5. Facility Validation (For Other Services)

```typescript
GET    /api/v1/facilities/:id/validate         → Validate facility exists
GET    /api/v1/facilities/:id/check-ownership  → Check user ownership
GET    /api/v1/facilities/user/:userId         → Get user facilities
```

---

## 🏗️ DATABASE SCHEMA (6 Tables)

### Table 1: facilities

```sql
CREATE TABLE facilities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50) CHECK (facility_type IN ('hospital', 'clinic', 'lab', 'pharmacy', 'rehabilitation')),
  
  -- Address
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Capacity
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table 2: departments

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  department_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table 3: wards

```sql
CREATE TABLE wards (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  department_id UUID REFERENCES departments(id),
  ward_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  ward_type VARCHAR(50) CHECK (ward_type IN ('general', 'icu', 'emergency', 'maternity')),
  total_beds INTEGER DEFAULT 0,
  occupied_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table 4: beds (CRITICAL!)

```sql
CREATE TABLE beds (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  ward_id UUID NOT NULL REFERENCES wards(id),
  bed_number VARCHAR(50) NOT NULL,
  bed_type VARCHAR(50) CHECK (bed_type IN ('standard', 'icu', 'isolation')),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  current_patient_id UUID,
  admission_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_bed_per_ward UNIQUE (ward_id, bed_number)
);
```

### Table 5: facility_settings

```sql
CREATE TABLE facility_settings (
  id UUID PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id),
  appointment_duration_default INTEGER DEFAULT 30,
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  currency VARCHAR(10) DEFAULT 'SDG',
  custom_settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_settings_per_facility UNIQUE (facility_id)
);
```

### Table 6: facility_audit_log

```sql
CREATE TABLE facility_audit_log (
  id UUID PRIMARY KEY,
  facility_id UUID,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### ✅ Phase 1: Foundation (Days 1-3)

- [ ] Fix syntax errors in index.ts
- [ ] Create src/utils/logger.ts (copy from Inventory Service)
- [ ] Create src/utils/database.ts (copy from Inventory Service)
- [ ] Create src/middleware/errorHandler.ts
- [ ] Create src/middleware/rateLimiter.ts
- [ ] Create src/middleware/validation.ts
- [ ] Create src/middleware/facilityMiddleware.ts
- [ ] Create database/schema.sql (6 tables)
- [ ] Apply schema to database
- [ ] Create all 5 model files

**Validation:** Service compiles, database ready, models defined

### ✅ Phase 2: Core Implementation (Days 4-10)

**Facility (Days 4-5):**
- [ ] Create src/repositories/FacilityRepository.ts
- [ ] Create src/services/FacilityService.ts
- [ ] Create src/controllers/FacilityController.ts
- [ ] Enhance src/routes/facilities.ts
- [ ] Test: Create, read, update, delete facility

**Department (Days 6-7):**
- [ ] Create src/repositories/DepartmentRepository.ts
- [ ] Create src/services/DepartmentService.ts
- [ ] Create src/controllers/DepartmentController.ts
- [ ] Create src/routes/departments.ts
- [ ] Test: Department CRUD + facility linkage

**Ward (Days 8-9):**
- [ ] Create src/repositories/WardRepository.ts
- [ ] Create src/services/WardService.ts
- [ ] Create src/controllers/WardController.ts
- [ ] Create src/routes/wards.ts
- [ ] Test: Ward CRUD + capacity tracking

**Bed (Day 10):**
- [ ] Create src/repositories/BedRepository.ts
- [ ] Create src/services/BedService.ts (CRITICAL!)
- [ ] Create src/controllers/BedController.ts
- [ ] Create src/routes/beds.ts
- [ ] Test: Bed assign/release + real-time updates

**Validation:** All CRUD operations working, WebSocket updates functional

### ✅ Phase 3: Integration (Days 11-13)

- [ ] Create src/services/integrations/AuthServiceClient.ts
- [ ] Create src/services/integrations/BusinessServiceClient.ts
- [ ] Test: User facility assignments (Auth Service)
- [ ] Test: Organization linkage (Business Service)
- [ ] Create src/events/EventPublisher.ts
- [ ] Test: Events publishing to Kafka
- [ ] Create src/services/SettingsService.ts
- [ ] Create src/routes/settings.ts

**Validation:** Integration working, events publishing

### ✅ Phase 4: Documentation & Testing (Days 14-15)

- [ ] Create README.md (complete guide)
- [ ] Create FACILITY_SERVICE_SUMMARY.md
- [ ] Create .env.example
- [ ] Update Swagger documentation
- [ ] Create tests/setup.ts
- [ ] Create unit tests examples
- [ ] Create integration tests examples
- [ ] Final validation: All requirements met

**Validation:** A+ grade matching Med/Lab/Inv services

---

## 📚 REFERENCE SERVICES (Copy These Patterns!)

### Use as Templates

**For Utils & Middleware:**
```bash
# Copy from Inventory Service (most recent, best patterns)
microservices/inventory-service/src/utils/logger.ts
microservices/inventory-service/src/utils/database.ts
microservices/inventory-service/src/middleware/errorHandler.ts
microservices/inventory-service/src/middleware/validation.ts
```

**For Services & Repositories:**
```bash
# Copy patterns from Lab Service (clean architecture)
microservices/lab-service/src/services/LabService.ts
microservices/lab-service/src/repositories/... (if exists)
```

**For Controllers & Routes:**
```bash
# Copy patterns from Medication Service
microservices/medication-service/src/controllers/MedicationController.ts
microservices/medication-service/src/routes/medications.ts
```

**For Database Schema:**
```bash
# Copy structure from Lab or Inventory
microservices/lab-service/database/schema.sql
microservices/inventory-service/database/schema.sql
```

---

## 🎯 CRITICAL ENDPOINTS FOR OTHER SERVICES

### Most Important Endpoints (Implement First!)

**1. Facility Validation (Used by ALL services):**
```typescript
GET /api/v1/facilities/:id/validate
Response: { exists: true, isActive: true, organizationId: "..." }
```

**2. User Facilities (Used by Auth Service):**
```typescript
GET /api/v1/facilities/user/:userId
Response: { facilities: [...] }
```

**3. Available Beds (Used by Appointment/Admission):**
```typescript
GET /api/v1/beds/available?facilityId=xxx&wardType=yyy
Response: { beds: [...], count: 5 }
```

**4. Bed Assignment (Used by Admission Service):**
```typescript
POST /api/v1/beds/:id/assign
Body: { patientId, admissionId, expectedDischarge }
Response: { bed: {...}, success: true }
```

**5. Bed Release (Used by Discharge):**
```typescript
POST /api/v1/beds/:id/release
Body: { reason: "Patient discharged" }
Response: { bed: {...}, success: true }
```

---

## 🔔 EVENT PUBLISHING REQUIREMENTS

### Events to Publish

```typescript
// Kafka topic: facility-events
facility.created         → { facilityId, name, organizationId }
facility.updated         → { facilityId, changes }
facility.deleted         → { facilityId, reason }
department.created       → { departmentId, facilityId, name }
ward.created             → { wardId, facilityId, capacity }
bed.status_changed       → { bedId, wardId, status, patientId }
ward.capacity_updated    → { wardId, totalBeds, occupiedBeds, availableBeds }
facility.capacity_full   → { facilityId, availableBeds: 0 }
```

### Event Subscribers (Future)

- **Appointment Service** - Bed availability
- **Admission Service** - Bed assignments
- **Business Service** - Organization/facility sync
- **All Services** - Facility validation cache

---

## ✅ QUALITY CHECKLIST

### Before Marking Complete

- [ ] All 33 code files created
- [ ] Database schema with 6 tables applied
- [ ] 40+ API endpoints functional
- [ ] Swagger documentation complete
- [ ] Integration with Auth Service working
- [ ] Integration with Business Service working
- [ ] Event publishing to Kafka working
- [ ] Real-time WebSocket updates working
- [ ] Zero compilation errors
- [ ] Zero linting errors
- [ ] Complete README documentation
- [ ] .env.example created
- [ ] Test structure created
- [ ] Matches Medication/Lab/Inventory quality (A+)

---

## 💡 SUCCESS TIPS

### Do's ✅

✅ **Copy patterns exactly** from Medication/Lab/Inventory  
✅ **Follow layered architecture** (Controller → Service → Repository)  
✅ **Use transactions** for atomic operations  
✅ **Log everything** with HIPAA-compliant logging  
✅ **Publish events** for all state changes  
✅ **Document as you code** (inline comments + README)  
✅ **Test continuously** (don't wait until end)  
✅ **Ask for code review** at each milestone  

### Don'ts ❌

❌ **Don't skip middleware** (error handler is critical)  
❌ **Don't hardcode values** (use environment variables)  
❌ **Don't skip audit logging** (required for HIPAA)  
❌ **Don't rush** (quality over speed)  
❌ **Don't deviate from patterns** (consistency is key)  
❌ **Don't skip documentation** (document as you build)  
❌ **Don't skip tests** (add test structure from start)  

---

## 🎊 COMPLETION CRITERIA

### Facility Service is COMPLETE when:

✅ Can create, read, update, delete facilities  
✅ Can manage departments, wards, beds  
✅ Real-time bed status updates via WebSocket  
✅ Integration with Auth and Business services  
✅ Event publishing for all operations  
✅ Complete Swagger documentation  
✅ Comprehensive audit logging  
✅ Health checks functional  
✅ Zero errors (compilation, linting)  
✅ README and summary documentation  
✅ **Grade: A+ (matches Med/Lab/Inv)**  

---

## 📞 SUPPORT & RESOURCES

### Reference Documents

1. **INTEROPERABILITY_AND_FACILITY_SERVICES_REVIEW.md** - Complete analysis
2. **FACILITY_SERVICE_IMPLEMENTATION_PRIORITY.md** - Detailed plan
3. **SERVICES_REVIEW_EXECUTIVE_SUMMARY.md** - Executive summary
4. **MICROSERVICES_STATUS_DASHBOARD.md** - Platform overview

### Reference Services

- **Medication Service** - `microservices/medication-service/`
- **Lab Service** - `microservices/lab-service/`
- **Inventory Service** - `microservices/inventory-service/` (v2.0 - latest patterns)

### Reference Schemas

- `microservices/lab-service/database/schema.sql`
- `microservices/inventory-service/database/schema.sql`

---

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🚀 FACILITY SERVICE IMPLEMENTATION GUIDE             ║
║                                                              ║
║                   READY TO START!                            ║
║                                                              ║
╟──────────────────────────────────────────────────────────────╢
║                                                              ║
║  Timeline:           3 weeks                                 ║
║  Priority:           🔥 CRITICAL                             ║
║  Target Grade:       A+ (match Med/Lab/Inv)                  ║
║  Deliverables:       33 files, ~5,000 lines                  ║
║  Integration:        Auth, Business services                 ║
║  Events:             4 Kafka topics                          ║
║  Documentation:      5 comprehensive docs                    ║
║                                                              ║
║            FOLLOW THIS GUIDE STEP-BY-STEP                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Created:** October 14, 2025  
**Status:** ✅ **READY TO START**  
**First Action:** Fix syntax errors (30 minutes)  
**Next Action:** Create foundation (Day 1)  
**Target:** Production-ready in 3 weeks

---

*This implementation guide maintains the same A+ quality standard as the successfully completed Medication, Lab, and Inventory microservices. No compromises on quality!*

