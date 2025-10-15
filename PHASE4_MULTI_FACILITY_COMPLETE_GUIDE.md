# 🏥 PHASE 4: Multi-Facility Implementation - Complete Guide

**Date:** October 15, 2025  
**Phase:** 4 - Multi-Facility & Multi-Tenancy  
**Duration:** 2-3 weeks  
**Status:** ✅ **READY TO START**

---

## 📋 Phase 4 Overview

Phase 4 implements **multi-facility support** enabling NileCare to serve multiple healthcare facilities with proper data isolation and facility-specific configurations.

### What Phase 4 Accomplishes

1. ✅ **Multi-Tenancy Architecture** - Isolated data per facility
2. ✅ **Facility Management** - Central facility administration
3. ✅ **Data Isolation** - Secure separation between facilities
4. ✅ **Facility-Specific Config** - Custom settings per facility
5. ✅ **Cross-Facility Features** - Referrals, transfers, reporting
6. ✅ **Scalability** - Support 100+ facilities

---

## 🎯 Phase 4 Objectives

### Week 1: Foundation & Architecture
- Design multi-tenancy architecture
- Implement facility context middleware
- Database schema updates
- Facility management APIs

### Week 2: Implementation
- Facility-specific data isolation
- User-facility relationships
- Facility switching in UI
- Facility-specific permissions

### Week 3: Advanced Features
- Cross-facility transfers
- Multi-facility reporting
- Facility analytics
- Performance optimization

---

## 🏗️ Multi-Facility Architecture

### Architecture Patterns

#### Pattern 1: Shared Database with Tenant ID (Recommended)

```
All Facilities → Same Database → Separated by facility_id
```

**Pros:**
- ✅ Easy to implement
- ✅ Cost-effective
- ✅ Simpler maintenance
- ✅ Cross-facility queries possible

**Cons:**
- ⚠️ Requires careful isolation
- ⚠️ One facility can't have different DB version

**Implementation:**
```sql
-- Add facility_id to all tables
ALTER TABLE patients ADD COLUMN facility_id INT NOT NULL;
ALTER TABLE appointments ADD COLUMN facility_id INT NOT NULL;
ALTER TABLE clinical_records ADD COLUMN facility_id INT NOT NULL;

-- Add indexes
CREATE INDEX idx_patients_facility ON patients(facility_id);
CREATE INDEX idx_appointments_facility ON appointments(facility_id);

-- Add foreign keys
ALTER TABLE patients 
  ADD CONSTRAINT fk_patients_facility 
  FOREIGN KEY (facility_id) REFERENCES facilities(id);
```

#### Pattern 2: Database Per Facility

```
Facility A → Database A
Facility B → Database B
Facility C → Database C
```

**Pros:**
- ✅ Complete data isolation
- ✅ Independent scaling
- ✅ Different versions possible

**Cons:**
- ⚠️ More complex management
- ⚠️ Higher costs
- ⚠️ Cross-facility queries difficult

#### Pattern 3: Schema Per Facility (PostgreSQL)

```
All Facilities → Same Database → Different Schemas
```

**Pros:**
- ✅ Good isolation
- ✅ Shared infrastructure
- ✅ Easier than separate databases

**Cons:**
- ⚠️ PostgreSQL specific
- ⚠️ Schema management overhead

---

## 🗄️ Database Schema Changes

### 1. Facilities Table (Enhanced)

```sql
-- Facility master table
CREATE TABLE facilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  facility_code VARCHAR(50) UNIQUE NOT NULL,
  facility_name VARCHAR(200) NOT NULL,
  facility_type ENUM('hospital', 'clinic', 'lab', 'pharmacy', 'imaging') NOT NULL,
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Sudan',
  
  -- Contact
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(255),
  
  -- Configuration
  timezone VARCHAR(50) DEFAULT 'Africa/Khartoum',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(10) DEFAULT 'SDG',
  
  -- Features enabled
  features JSON, -- {"ehr": true, "lab": true, "pharmacy": false}
  settings JSON, -- Facility-specific settings
  
  -- Business
  license_number VARCHAR(100),
  license_expiry DATE,
  subscription_plan VARCHAR(50),
  subscription_status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
  
  -- Metadata
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  
  INDEX idx_facility_code (facility_code),
  INDEX idx_facility_type (facility_type),
  INDEX idx_status (status)
);
```

### 2. User-Facility Relationships

```sql
-- Users can belong to multiple facilities
CREATE TABLE user_facilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  facility_id INT NOT NULL,
  role VARCHAR(50), -- Role at this facility
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_facility (user_id, facility_id),
  INDEX idx_user_id (user_id),
  INDEX idx_facility_id (facility_id)
);
```

### 3. Update Existing Tables

```sql
-- Add facility_id to all domain tables
ALTER TABLE patients ADD COLUMN facility_id INT NOT NULL AFTER id;
ALTER TABLE appointments ADD COLUMN facility_id INT NOT NULL AFTER id;
ALTER TABLE clinical_records ADD COLUMN facility_id INT NOT NULL AFTER id;
ALTER TABLE invoices ADD COLUMN facility_id INT NOT NULL AFTER id;
ALTER TABLE lab_orders ADD COLUMN facility_id INT NOT NULL AFTER id;
ALTER TABLE prescriptions ADD COLUMN facility_id INT NOT NULL AFTER id;

-- Add foreign keys
ALTER TABLE patients ADD CONSTRAINT fk_patients_facility 
  FOREIGN KEY (facility_id) REFERENCES facilities(id);
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_facility 
  FOREIGN KEY (facility_id) REFERENCES facilities(id);
-- ... repeat for all tables

-- Add indexes for performance
CREATE INDEX idx_patients_facility ON patients(facility_id);
CREATE INDEX idx_appointments_facility ON appointments(facility_id);
CREATE INDEX idx_clinical_facility ON clinical_records(facility_id);
```

---

## 🔒 Data Isolation Implementation

### 1. Facility Context Middleware

```typescript
// middleware/facilityContext.ts
import { Request, Response, NextFunction } from 'express';

interface FacilityRequest extends Request {
  facilityId?: number;
  facilityCode?: string;
  userFacilities?: number[];
}

export const facilityContext = async (
  req: FacilityRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get facility from header or query
    const facilityId = 
      req.headers['x-facility-id'] || 
      req.query.facilityId;
    
    if (!facilityId) {
      return res.status(400).json({
        success: false,
        error: 'Facility context required'
      });
    }
    
    // Verify user has access to this facility
    const hasAccess = await verifyFacilityAccess(
      req.user.id,
      Number(facilityId)
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this facility'
      });
    }
    
    // Set facility context
    req.facilityId = Number(facilityId);
    req.facilityCode = await getFacilityCode(Number(facilityId));
    
    // Get all facilities user has access to
    req.userFacilities = await getUserFacilities(req.user.id);
    
    next();
  } catch (error) {
    next(error);
  }
};

async function verifyFacilityAccess(
  userId: number,
  facilityId: number
): Promise<boolean> {
  const result = await db.query(
    `SELECT id FROM user_facilities 
     WHERE user_id = ? AND facility_id = ? AND is_active = TRUE`,
    [userId, facilityId]
  );
  return result.length > 0;
}
```

### 2. Repository Pattern with Facility Filter

```typescript
// repositories/PatientRepository.ts
export class PatientRepository {
  async findAll(facilityId: number, filters?: any) {
    const query = `
      SELECT * FROM patients 
      WHERE facility_id = ? 
      ${filters ? this.buildFilters(filters) : ''}
      ORDER BY created_at DESC
    `;
    return db.query(query, [facilityId]);
  }
  
  async findById(id: number, facilityId: number) {
    const query = `
      SELECT * FROM patients 
      WHERE id = ? AND facility_id = ?
    `;
    const results = await db.query(query, [id, facilityId]);
    return results[0];
  }
  
  async create(data: PatientData, facilityId: number) {
    const query = `
      INSERT INTO patients (facility_id, first_name, last_name, ...)
      VALUES (?, ?, ?, ...)
    `;
    return db.query(query, [facilityId, ...data]);
  }
  
  async update(id: number, data: PatientData, facilityId: number) {
    // Verify patient belongs to facility
    const existing = await this.findById(id, facilityId);
    if (!existing) {
      throw new Error('Patient not found in this facility');
    }
    
    const query = `
      UPDATE patients 
      SET first_name = ?, last_name = ?, ...
      WHERE id = ? AND facility_id = ?
    `;
    return db.query(query, [...data, id, facilityId]);
  }
}
```

### 3. Query Builder with Automatic Facility Filter

```typescript
// utils/QueryBuilder.ts
export class FacilityAwareQueryBuilder {
  constructor(
    private table: string,
    private facilityId: number
  ) {}
  
  select(...columns: string[]) {
    this.columns = columns;
    return this;
  }
  
  where(conditions: object) {
    this.conditions = {
      ...conditions,
      facility_id: this.facilityId // Always add facility filter
    };
    return this;
  }
  
  async execute() {
    const query = this.buildQuery();
    return db.query(query, this.getParams());
  }
  
  private buildQuery() {
    return `
      SELECT ${this.columns.join(', ')}
      FROM ${this.table}
      WHERE facility_id = ?
      ${this.buildWhereClause()}
    `;
  }
}

// Usage
const patients = await new FacilityAwareQueryBuilder('patients', facilityId)
  .select('*')
  .where({ status: 'active' })
  .execute();
```

---

## 🔐 Facility-Based Authorization

### 1. Permission System

```typescript
// permissions/FacilityPermissions.ts
export enum FacilityPermission {
  // Patient Management
  PATIENTS_VIEW = 'patients:view',
  PATIENTS_CREATE = 'patients:create',
  PATIENTS_EDIT = 'patients:edit',
  PATIENTS_DELETE = 'patients:delete',
  
  // Clinical
  CLINICAL_VIEW = 'clinical:view',
  CLINICAL_CREATE = 'clinical:create',
  CLINICAL_EDIT = 'clinical:edit',
  
  // Facility Management
  FACILITY_SETTINGS = 'facility:settings',
  FACILITY_USERS = 'facility:users',
  FACILITY_REPORTS = 'facility:reports',
  
  // Billing
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',
}

export const FacilityRoles = {
  SUPER_ADMIN: [/* all permissions */],
  FACILITY_ADMIN: [
    FacilityPermission.FACILITY_SETTINGS,
    FacilityPermission.FACILITY_USERS,
    FacilityPermission.PATIENTS_VIEW,
    // ...
  ],
  DOCTOR: [
    FacilityPermission.PATIENTS_VIEW,
    FacilityPermission.CLINICAL_VIEW,
    FacilityPermission.CLINICAL_CREATE,
    // ...
  ],
  NURSE: [
    FacilityPermission.PATIENTS_VIEW,
    FacilityPermission.CLINICAL_VIEW,
    // ...
  ],
  RECEPTIONIST: [
    FacilityPermission.PATIENTS_VIEW,
    FacilityPermission.PATIENTS_CREATE,
    // ...
  ],
};
```

### 2. Permission Middleware

```typescript
// middleware/requireFacilityPermission.ts
export const requireFacilityPermission = (
  permission: FacilityPermission
) => {
  return async (req: FacilityRequest, res: Response, next: NextFunction) => {
    try {
      const hasPermission = await checkFacilityPermission(
        req.user.id,
        req.facilityId,
        permission
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions for this facility'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage in routes
router.post('/patients',
  authenticate,
  facilityContext,
  requireFacilityPermission(FacilityPermission.PATIENTS_CREATE),
  createPatient
);
```

---

## 🌐 API Endpoints

### Facility Management APIs

```typescript
// routes/facilities.ts

// GET /api/facilities - List all facilities (admin only)
router.get('/', 
  authenticate, 
  requireSuperAdmin,
  async (req, res) => {
    const facilities = await Facility.findAll();
    res.json({ success: true, data: facilities });
  }
);

// GET /api/facilities/my - Get user's facilities
router.get('/my',
  authenticate,
  async (req, res) => {
    const facilities = await getUserFacilities(req.user.id);
    res.json({ success: true, data: facilities });
  }
);

// GET /api/facilities/:id - Get facility details
router.get('/:id',
  authenticate,
  facilityContext,
  async (req, res) => {
    const facility = await Facility.findById(req.params.id);
    res.json({ success: true, data: facility });
  }
);

// POST /api/facilities - Create facility
router.post('/',
  authenticate,
  requireSuperAdmin,
  validateFacility,
  async (req, res) => {
    const facility = await Facility.create(req.body);
    res.status(201).json({ success: true, data: facility });
  }
);

// PUT /api/facilities/:id - Update facility
router.put('/:id',
  authenticate,
  facilityContext,
  requireFacilityPermission(FacilityPermission.FACILITY_SETTINGS),
  async (req, res) => {
    const facility = await Facility.update(req.params.id, req.body);
    res.json({ success: true, data: facility });
  }
);

// POST /api/facilities/:id/users - Add user to facility
router.post('/:id/users',
  authenticate,
  facilityContext,
  requireFacilityPermission(FacilityPermission.FACILITY_USERS),
  async (req, res) => {
    const { userId, role } = req.body;
    await addUserToFacility(req.params.id, userId, role);
    res.json({ success: true });
  }
);
```

---

## 🖥️ Frontend Implementation

### 1. Facility Context Provider

```typescript
// contexts/FacilityContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface FacilityContextType {
  currentFacility: Facility | null;
  userFacilities: Facility[];
  switchFacility: (facilityId: number) => void;
  loading: boolean;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const FacilityProvider: React.FC = ({ children }) => {
  const [currentFacility, setCurrentFacility] = useState<Facility | null>(null);
  const [userFacilities, setUserFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUserFacilities();
  }, []);
  
  const loadUserFacilities = async () => {
    try {
      const response = await api.get('/facilities/my');
      setUserFacilities(response.data);
      
      // Set default facility (primary or first)
      const primary = response.data.find((f: any) => f.isPrimary);
      setCurrentFacility(primary || response.data[0]);
    } catch (error) {
      console.error('Failed to load facilities', error);
    } finally {
      setLoading(false);
    }
  };
  
  const switchFacility = (facilityId: number) => {
    const facility = userFacilities.find(f => f.id === facilityId);
    if (facility) {
      setCurrentFacility(facility);
      localStorage.setItem('currentFacilityId', facilityId.toString());
    }
  };
  
  return (
    <FacilityContext.Provider value={{
      currentFacility,
      userFacilities,
      switchFacility,
      loading
    }}>
      {children}
    </FacilityContext.Provider>
  );
};

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacility must be used within FacilityProvider');
  }
  return context;
};
```

### 2. Facility Switcher Component

```typescript
// components/FacilitySwitcher.tsx
import { useFacility } from '../contexts/FacilityContext';

export const FacilitySwitcher: React.FC = () => {
  const { currentFacility, userFacilities, switchFacility } = useFacility();
  
  return (
    <div className="facility-switcher">
      <select
        value={currentFacility?.id}
        onChange={(e) => switchFacility(Number(e.target.value))}
      >
        {userFacilities.map(facility => (
          <option key={facility.id} value={facility.id}>
            {facility.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 3. API Client with Facility Header

```typescript
// utils/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add facility header to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const facilityId = localStorage.getItem('currentFacilityId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (facilityId) {
    config.headers['X-Facility-Id'] = facilityId;
  }
  
  return config;
});

export default apiClient;
```

---

## 📊 Multi-Facility Features

### 1. Cross-Facility Patient Transfers

```typescript
// services/PatientTransferService.ts
export class PatientTransferService {
  async transferPatient(
    patientId: number,
    fromFacilityId: number,
    toFacilityId: number,
    transferData: TransferData
  ) {
    // 1. Verify source facility access
    await this.verifyAccess(fromFacilityId);
    
    // 2. Verify destination facility access
    await this.verifyAccess(toFacilityId);
    
    // 3. Create transfer record
    const transfer = await this.createTransferRecord({
      patientId,
      fromFacilityId,
      toFacilityId,
      reason: transferData.reason,
      notes: transferData.notes,
      status: 'pending'
    });
    
    // 4. Copy patient data to destination
    await this.copyPatientData(patientId, toFacilityId);
    
    // 5. Mark transfer as complete
    await this.completeTransfer(transfer.id);
    
    // 6. Notify destination facility
    await this.notifyFacility(toFacilityId, transfer);
    
    return transfer;
  }
}
```

### 2. Multi-Facility Reporting

```typescript
// services/MultiF acilityReportService.ts
export class MultiFacilityReportService {
  async generateConsolidatedReport(
    facilityIds: number[],
    reportType: string,
    dateRange: DateRange
  ) {
    const reports = await Promise.all(
      facilityIds.map(id => 
        this.generateFacilityReport(id, reportType, dateRange)
      )
    );
    
    return this.consolidateReports(reports);
  }
  
  async generateFacilityComparison(
    facilityIds: number[],
    metrics: string[]
  ) {
    const data = await Promise.all(
      facilityIds.map(id =>
        this.getFacilityMetrics(id, metrics)
      )
    );
    
    return this.compareMetrics(data);
  }
}
```

### 3. Facility Analytics Dashboard

```typescript
// Dashboard showing metrics across all facilities
interface FacilityMetrics {
  facilityId: number;
  facilityName: string;
  totalPatients: number;
  totalAppointments: number;
  revenue: number;
  occupancyRate: number;
  staffCount: number;
}

// GET /api/admin/facilities/metrics
router.get('/admin/facilities/metrics',
  authenticate,
  requireSuperAdmin,
  async (req, res) => {
    const metrics = await getAllFacilitiesMetrics();
    res.json({ success: true, data: metrics });
  }
);
```

---

## 🧪 Testing Multi-Facility Features

### 1. Facility Isolation Tests

```typescript
// tests/facility-isolation.test.ts
describe('Facility Data Isolation', () => {
  it('should only return patients from current facility', async () => {
    // Create patients in different facilities
    const patient1 = await createPatient({ facilityId: 1 });
    const patient2 = await createPatient({ facilityId: 2 });
    
    // Query from facility 1
    const response = await api.get('/api/patients', {
      headers: { 'X-Facility-Id': '1' }
    });
    
    expect(response.data).toContainEqual(patient1);
    expect(response.data).not.toContainEqual(patient2);
  });
  
  it('should prevent cross-facility data access', async () => {
    const patient = await createPatient({ facilityId: 1 });
    
    // Try to access from facility 2
    const response = await api.get(`/api/patients/${patient.id}`, {
      headers: { 'X-Facility-Id': '2' }
    });
    
    expect(response.status).toBe(404);
  });
});
```

---

## 📋 Phase 4 Implementation Checklist

### Week 1: Foundation ⏳
- [ ] Design multi-tenancy architecture
- [ ] Update database schema (add facility_id)
- [ ] Create facilities table
- [ ] Create user_facilities table
- [ ] Implement facility context middleware
- [ ] Update all repositories with facility filter

### Week 2: Core Features ⏳
- [ ] Facility management APIs
- [ ] User-facility assignment
- [ ] Facility switcher UI
- [ ] Permission system per facility
- [ ] Data isolation testing
- [ ] Update all existing APIs

### Week 3: Advanced Features ⏳
- [ ] Cross-facility transfers
- [ ] Multi-facility reporting
- [ ] Facility analytics
- [ ] Performance optimization
- [ ] Documentation
- [ ] Team training

---

## 🎯 Success Criteria

**Phase 4 complete when:**
- ✅ Multiple facilities can be managed
- ✅ Data completely isolated per facility
- ✅ Users can switch between facilities
- ✅ Permissions work per facility
- ✅ Cross-facility features work
- ✅ Performance acceptable (< 500ms)
- ✅ All tests passing
- ✅ Documentation complete

---

## 📚 Documentation

**See also:**
- PHASE5_PRODUCTION_DEPLOYMENT_GUIDE.md - Next phase
- MULTI_FACILITY_SETUP_GUIDE.md - Detailed setup
- API_ENDPOINT_MAP.md - API reference

---

**Status:** ✅ Ready to Start  
**Prerequisite:** Phase 3 Complete  
**Duration:** 2-3 weeks  
**Next:** Phase 5 - Production Deployment

**🏥 LET'S BUILD MULTI-FACILITY SUPPORT! 🚀**

