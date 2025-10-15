# 🚨 FACILITY SERVICE - PRIORITY IMPLEMENTATION PLAN

**Date:** October 14, 2025  
**Priority Level:** 🔥 **CRITICAL - HIGHEST PRIORITY**  
**Reason:** **Blocks full multi-facility support across ALL services**

---

## 🎯 Why Facility Service is CRITICAL

### Current Problem

**ALL NileCare services have facility isolation middleware, but no central Facility Service to manage facilities!**

```
✅ Medication Service → Has facilityMiddleware.ts
✅ Lab Service → Has facilityMiddleware.ts
✅ Inventory Service → Has facilityMiddleware.ts
✅ CDS Service → Has facilityMiddleware.ts
✅ EHR Service → Has facilityMiddleware.ts

❌ NO Facility Service → Cannot manage facilities!
```

### What's Missing

1. **No Facility CRUD** - Cannot create or manage facilities
2. **No Department/Ward/Bed Tracking** - Cannot manage hospital structure
3. **No Facility Context** - Other services can't validate facility ownership
4. **No Central Registry** - Each service has facility_id but no master facility list

### Impact

**Without Facility Service:**
- ❌ Cannot onboard new facilities
- ❌ Cannot assign users to facilities
- ❌ Cannot validate facility ownership in other services
- ❌ Cannot track bed availability
- ❌ Cannot manage department structure
- ❌ Limited to single-facility deployment

**With Facility Service:**
- ✅ Complete multi-tenant support
- ✅ Facility hierarchy (Organization → Facility → Department → Ward → Bed)
- ✅ Real-time bed availability
- ✅ Centralized facility management
- ✅ Full data isolation

---

## 📊 Implementation Timeline

### Target: **3 Weeks to Production**

**Week 1: Foundation & Core**
- Fix syntax errors
- Create utilities (logger, database)
- Create middleware (error handler, validation, facility)
- Create database schema
- Implement Facility CRUD

**Week 2: Departments, Wards, Beds**
- Implement Department service
- Implement Ward service
- Implement Bed service
- Real-time bed status updates
- Capacity tracking

**Week 3: Integration & Polish**
- Integration with Auth Service
- Integration with Business Service
- Event publishing (Kafka)
- Comprehensive documentation
- Tests
- API documentation

---

## 🏗️ Implementation Checklist

### ✅ Phase 1: Foundation (Days 1-3)

**Day 1: Fix Errors & Setup**
- [ ] Fix syntax errors in index.ts
- [ ] Create src/utils/logger.ts (HIPAA-compliant Winston)
- [ ] Create src/utils/database.ts (PostgreSQL + Redis + transactions)
- [ ] Create src/middleware/errorHandler.ts (custom error classes)
- [ ] Create src/middleware/rateLimiter.ts (3 limiters)
- [ ] Create src/middleware/validation.ts (Joi schemas)

**Day 2: Database Schema**
- [ ] Create database/schema.sql
  - [ ] facilities table
  - [ ] departments table
  - [ ] wards table
  - [ ] beds table
  - [ ] facility_settings table
  - [ ] facility_audit_log table
  - [ ] Indexes and triggers
  - [ ] Sample data

**Day 3: Models**
- [ ] Create src/models/Facility.ts
- [ ] Create src/models/Department.ts
- [ ] Create src/models/Ward.ts
- [ ] Create src/models/Bed.ts
- [ ] Create src/models/FacilitySettings.ts

### ✅ Phase 2: Core Services (Days 4-10)

**Days 4-5: Facility Service**
- [ ] Create src/repositories/FacilityRepository.ts
- [ ] Create src/services/FacilityService.ts
  - [ ] createFacility()
  - [ ] getFacilityById()
  - [ ] getAllFacilities() with pagination
  - [ ] updateFacility()
  - [ ] deleteFacility() (soft delete)
  - [ ] searchFacilities()
  - [ ] getFacilityStatistics()
- [ ] Create src/controllers/FacilityController.ts
- [ ] Enhance src/routes/facilities.ts

**Days 6-7: Department Service**
- [ ] Create src/repositories/DepartmentRepository.ts
- [ ] Create src/services/DepartmentService.ts
  - [ ] createDepartment()
  - [ ] getDepartmentById()
  - [ ] getAllDepartments() by facility
  - [ ] updateDepartment()
  - [ ] deleteDepartment()
  - [ ] getDepartmentWards()
  - [ ] assignStaff()
- [ ] Create src/controllers/DepartmentController.ts
- [ ] Create src/routes/departments.ts

**Days 8-9: Ward Service**
- [ ] Create src/repositories/WardRepository.ts
- [ ] Create src/services/WardService.ts
  - [ ] createWard()
  - [ ] getWardById()
  - [ ] getAllWards() by facility/department
  - [ ] updateWard()
  - [ ] getWardBeds()
  - [ ] getWardOccupancy()
  - [ ] updateCapacity()
- [ ] Create src/controllers/WardController.ts
- [ ] Create src/routes/wards.ts

**Day 10: Bed Service**
- [ ] Create src/repositories/BedRepository.ts
- [ ] Create src/services/BedService.ts
  - [ ] createBed()
  - [ ] getBedById()
  - [ ] getAllBeds() by facility/ward
  - [ ] updateBedStatus()
  - [ ] assignBed() (patient admission)
  - [ ] releaseBed() (patient discharge)
  - [ ] getBedHistory()
  - [ ] getAvailableBeds()
- [ ] Create src/controllers/BedController.ts
- [ ] Create src/routes/beds.ts

### ✅ Phase 3: Integration & Polish (Days 11-15)

**Days 11-12: Integration Clients**
- [ ] Create src/services/integrations/AuthServiceClient.ts
- [ ] Create src/services/integrations/BusinessServiceClient.ts
- [ ] Create src/services/integrations/InventoryServiceClient.ts
- [ ] Test integration with Auth Service
- [ ] Test integration with Business Service

**Days 13: Event Publishing**
- [ ] Create src/events/EventPublisher.ts
  - [ ] facility.created
  - [ ] facility.updated
  - [ ] bed.status_changed
  - [ ] ward.capacity_updated
  - [ ] department.created

**Days 14: Settings & Configuration**
- [ ] Create src/services/SettingsService.ts
- [ ] Create src/controllers/SettingsController.ts
- [ ] Create src/routes/settings.ts
- [ ] Facility-specific configurations

**Day 15: Completion**
- [ ] Create README.md
- [ ] Create FACILITY_SERVICE_SUMMARY.md
- [ ] Create .env.example
- [ ] Create tests structure
- [ ] Final validation

---

## 📦 Detailed Deliverables

### Utilities Layer (2 files, ~500 lines)

**src/utils/logger.ts**
```typescript
- Winston logger with 3 transports (error, combined, audit)
- HIPAA-compliant (no PHI in logs)
- Specialized audit functions:
  - logFacilityCreation()
  - logBedAssignment()
  - logCapacityUpdate()
  - logFacilityAccess()
```

**src/utils/database.ts**
```typescript
- PostgreSQL connection pool
- Redis client
- withTransaction() wrapper
- Health check functions
- Graceful shutdown
```

### Middleware Layer (4 files, ~500 lines)

**src/middleware/errorHandler.ts**
```typescript
- Custom error classes:
  - FacilityNotFoundError
  - DepartmentNotFoundError
  - BedUnavailableError
  - CapacityExceededError
- Global error handler
- asyncHandler wrapper
- notFoundHandler
```

**src/middleware/rateLimiter.ts**
```typescript
- Standard limiter (1000 req/15min)
- Admin limiter (50 req/15min)
- Bed status limiter (500 req/15min)
```

**src/middleware/validation.ts**
```typescript
- Joi schemas for all entities
- validateRequest middleware
- facilitySchemas export
```

**src/middleware/facilityMiddleware.ts** (Self-Referential!)
```typescript
- attachFacilityContext()
- requireFacility()
- validateFacilityOwnership()
- logFacilityAccess()
- NOTE: Self-validates - facility service validates its own data!
```

### Model Layer (5 files, ~500 lines)

**src/models/Facility.ts**
```typescript
interface Facility {
  id, organizationId, facilityCode, name, type,
  address, contact, capacity, licensing,
  operatingHours, services, status,
  createdBy, createdAt, updatedAt
}
```

**src/models/Department.ts, Ward.ts, Bed.ts, FacilitySettings.ts**
- Similar interface definitions

### Repository Layer (4 files, ~800 lines)

**Standard pattern:**
```typescript
class FacilityRepository {
  async create(dto): Promise<Facility>
  async findById(id): Promise<Facility | null>
  async findAll(filters, pagination): Promise<Facility[]>
  async update(id, dto): Promise<Facility | null>
  async delete(id): Promise<boolean>
  async search(searchTerm): Promise<Facility[]>
  private mapRowToEntity(row): Facility
}
```

### Service Layer (4 files, ~1,200 lines)

**FacilityService.ts** (Core orchestration)
**DepartmentService.ts** (Department management)
**WardService.ts** (Ward and capacity)
**BedService.ts** (Real-time bed status)

### Controller Layer (4 files, ~800 lines)

**Standard pattern:**
```typescript
class FacilityController {
  getAllFacilities = asyncHandler(async (req, res) => {...})
  getFacilityById = asyncHandler(async (req, res) => {...})
  createFacility = asyncHandler(async (req, res) => {...})
  updateFacility = asyncHandler(async (req, res) => {...})
  deleteFacility = asyncHandler(async (req, res) => {...})
  // ... more methods
}
```

### Routes Layer (5 files, ~1,000 lines)

**All routes with:**
- Complete Swagger documentation
- Request validation
- Rate limiting
- Authentication
- Facility isolation

### Integration Layer (2 files, ~200 lines)

**AuthServiceClient.ts** - Token validation, user facility assignments  
**BusinessServiceClient.ts** - Organization linkage

### Events Layer (1 file, ~150 lines)

**EventPublisher.ts** - Kafka event publishing

### Database Layer (1 file, ~800 lines)

**database/schema.sql**
- 6 tables (facilities, departments, wards, beds, settings, audit_log)
- Indexes for performance
- Triggers for updated_at
- Sample data for testing
- Views for reporting

---

## 🔄 Integration Requirements

### Facility Service → Other Services

**Outbound:**
```typescript
// To Auth Service
- validateToken()
- getUserFacility()
- checkFacilityPermission()

// To Business Service
- getOrganization()
- validateOrganizationOwnership()

// To Inventory Service
- syncFacilityLocations()
- mapInventoryLocation()
```

### Other Services → Facility Service

**Inbound (NEW endpoints needed):**
```typescript
// FROM All Services
GET /api/v1/facilities/{id}/validate
  → Validate facility exists and is active

GET /api/v1/facilities/user/{userId}/assignment
  → Get user's assigned facility

POST /api/v1/facilities/{id}/check-ownership
  → Validate facility ownership for resource

GET /api/v1/facilities/{id}/departments
  → Get facility departments (for Clinical Service)

GET /api/v1/facilities/{id}/available-beds
  → Get bed availability (for Appointment/Admission)
```

---

## 🎊 Success Criteria

### Definition of Done

The Facility Service is **complete** when:

✅ All CRUD operations functional for:
  - Facilities
  - Departments
  - Wards
  - Beds
  - Settings

✅ Real-time updates:
  - Bed status changes via WebSocket
  - Capacity updates

✅ Integration complete:
  - Auth Service (user facilities)
  - Business Service (organizations)
  - Inventory Service (location mapping)

✅ Complete documentation:
  - README with setup guide
  - API documentation (Swagger)
  - Integration guide
  - Database schema docs

✅ Production ready:
  - Health checks
  - Comprehensive logging
  - Error handling
  - Tests structure
  - Zero linting errors

✅ **Matches quality of Medication/Lab/Inventory services (A+ grade)**

---

## 💡 Key Design Decisions

### 1. Self-Referential Facility Middleware

**Challenge:** Facility Service needs to enforce facility isolation on itself!

**Solution:**
```typescript
// src/middleware/facilityMiddleware.ts
// This middleware validates:
- User can only manage facilities they're assigned to
- Multi-facility admins can access all
- Facility creation requires organization ownership
- Facility updates require facility ownership
```

### 2. Hierarchical Data Model

**Organization → Facility → Department → Ward → Bed**

```
Organization: "Khartoum Health System"
  ├─ Facility: "Khartoum Teaching Hospital"
  │   ├─ Department: "Internal Medicine"
  │   │   ├─ Ward: "Medical Ward A"
  │   │   │   ├─ Bed: "A-101" (available)
  │   │   │   ├─ Bed: "A-102" (occupied)
  │   │   │   └─ Bed: "A-103" (maintenance)
  │   │   └─ Ward: "Medical Ward B"
  │   └─ Department: "Surgery"
  └─ Facility: "Omdurman District Clinic"
```

### 3. Real-Time Bed Management

**Critical for admissions:**
- WebSocket for instant bed status updates
- Optimistic locking for bed assignments
- Capacity tracking (total vs available)
- Bed history for audit

### 4. Multi-Tenancy Support

**Facility isolation:**
- Each facility belongs to one organization
- Users assigned to specific facilities
- Cross-facility access requires admin role
- Complete data isolation per facility

---

## 🚀 Quick Start Implementation

### Step 1: Fix Syntax Errors (30 minutes)

```typescript
// microservices/facility-service/src/index.ts

// FIX Line 117-124:
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'facility-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}); // ✅ ADD THIS

// FIX Line 126-136: (readiness probe)
app.get('/health/ready', async (req, res) => {
  try {
    // TODO: Implement DB check when database utility ready
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

// REMOVE Line 153:
}); // ❌ REMOVE EXTRA BRACE
```

### Step 2: Create Foundation Files (Day 1)

**Copy patterns from Inventory Service:**
```bash
# Copy utility files as template
cp microservices/inventory-service/src/utils/logger.ts \
   microservices/facility-service/src/utils/logger.ts

cp microservices/inventory-service/src/utils/database.ts \
   microservices/facility-service/src/utils/database.ts

# Copy middleware as template
cp microservices/inventory-service/src/middleware/errorHandler.ts \
   microservices/facility-service/src/middleware/errorHandler.ts

# Adapt for facility-specific errors and logging
```

### Step 3: Create Database Schema (Day 2)

**Use template from Lab Service, adapt for facilities:**
```sql
-- Start with facilities table (most critical)
-- Then departments, wards, beds
-- Add audit logging
-- Add sample data (1-2 test facilities)
```

### Step 4: Implement Core Services (Days 3-10)

**Follow Inventory Service pattern:**
```
Repository → Service → Controller → Routes
```

**Start with Facility, then Department, Ward, Bed in that order.**

---

## 📋 API Endpoints Required

### Facility Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/facilities | List all facilities (paginated) |
| POST | /api/v1/facilities | Create facility |
| GET | /api/v1/facilities/:id | Get facility details |
| PUT | /api/v1/facilities/:id | Update facility |
| DELETE | /api/v1/facilities/:id | Delete facility (soft) |
| GET | /api/v1/facilities/:id/departments | Get departments |
| GET | /api/v1/facilities/:id/capacity | Get capacity info |
| GET | /api/v1/facilities/:id/analytics | Get analytics |
| GET | /api/v1/facilities/:id/validate | Validate facility (for other services) |
| GET | /api/v1/facilities/user/:userId | Get user's facilities |

### Department Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/departments | List departments |
| POST | /api/v1/departments | Create department |
| GET | /api/v1/departments/:id | Get department |
| PUT | /api/v1/departments/:id | Update department |
| DELETE | /api/v1/departments/:id | Delete department |
| GET | /api/v1/departments/:id/wards | Get wards |
| GET | /api/v1/departments/:id/staff | Get staff |

### Ward Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/wards | List wards |
| POST | /api/v1/wards | Create ward |
| GET | /api/v1/wards/:id | Get ward |
| PUT | /api/v1/wards/:id | Update ward |
| GET | /api/v1/wards/:id/beds | Get beds |
| GET | /api/v1/wards/:id/occupancy | Get occupancy stats |

### Bed Endpoints (CRITICAL for Admissions)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/beds | List beds |
| POST | /api/v1/beds | Create bed |
| GET | /api/v1/beds/:id | Get bed |
| PUT | /api/v1/beds/:id/status | Update bed status |
| POST | /api/v1/beds/:id/assign | Assign bed to patient |
| POST | /api/v1/beds/:id/release | Release bed |
| GET | /api/v1/beds/available | Get available beds |
| GET | /api/v1/beds/:id/history | Get bed history |

---

## 🔔 Event Publishing Requirements

### Kafka Topics

**facility-events:**
```typescript
facility.created → { facilityId, name, organizationId, type }
facility.updated → { facilityId, changes }
facility.deleted → { facilityId, reason }
department.created → { departmentId, facilityId, name }
ward.created → { wardId, facilityId, departmentId, capacity }
```

**facility-alerts:**
```typescript
bed.status_changed → { bedId, wardId, status, patientId? }
ward.capacity_full → { wardId, totalBeds, occupiedBeds }
facility.capacity_critical → { facilityId, availableBeds, threshold }
```

**Event Subscribers:**
- **Appointment Service** - Listen for bed availability
- **Admission Service** - Listen for bed assignments
- **Business Service** - Synchronize organization/facility data
- **All Services** - Cache facility data for validation

---

## ✅ Integration Validation Matrix

### After Implementation, Facility Service Enables:

| Service | What It Can Do With Facility Service |
|---------|-------------------------------------|
| **Auth Service** | Assign users to facilities, validate facility access |
| **Business Service** | Link facilities to organizations, billing per facility |
| **Medication Service** | Validate facility for prescriptions, track pharmacy location |
| **Lab Service** | Validate facility for lab orders, track lab location |
| **Inventory Service** | Map stock locations to facility wards/departments |
| **Appointment Service** | Book appointments at specific facilities, resource scheduling |
| **Admission Service** | Assign beds, track admissions per facility |
| **Clinical Service** | Track encounters per facility, provider assignments |
| **Billing Service** | Bill per facility, facility-specific pricing |

---

## 🎯 SUCCESS METRICS

### Completion Criteria

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| **Code Coverage** | 30 files, ~5,000 lines | File count |
| **API Endpoints** | 40+ endpoints | Swagger count |
| **Database Tables** | 6 tables | Schema review |
| **Integrations** | 3 services (Auth, Business, Inventory) | Integration test |
| **Documentation** | 4 documents | Doc review |
| **Tests** | Structure + examples | Jest config |
| **Zero Errors** | No linting/compilation errors | npm run lint |
| **Grade** | A+ (matches Med/Lab/Inv) | Peer review |

---

## 🎊 FINAL RECOMMENDATION

### **START FACILITY SERVICE IMPLEMENTATION IMMEDIATELY!**

**Why:**
1. 🔥 **Highest Priority** - Blocks other features
2. ⚡ **Quick Win** - Can complete in 3 weeks
3. 🎯 **Clear Requirements** - Well-defined scope
4. 🏗️ **Foundation** - Enables full multi-facility support
5. 📊 **High Impact** - Benefits ALL services

**Next Steps:**
1. Create TODO list with all tasks
2. Fix syntax errors (30 minutes)
3. Begin foundation implementation
4. Follow Medication/Lab/Inventory patterns exactly
5. Target completion: 3 weeks

---

**Document Version:** 1.0.0  
**Created:** October 14, 2025  
**Status:** 📋 **ACTION PLAN READY**  
**Priority:** 🔥 **CRITICAL - START IMMEDIATELY**

---

*Once Facility Service is complete at A+ standard, then proceed to FHIR Service, then HL7 Service in that order.*

