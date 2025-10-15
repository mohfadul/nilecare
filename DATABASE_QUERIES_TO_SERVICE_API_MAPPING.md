# 📋 Database Queries → Service API Mapping

**Service:** Main-NileCare (Port 7000)  
**Goal:** Remove ALL direct database access  
**Timeline:** 5 days

---

## 🔍 COMPLETE QUERY INVENTORY

### File: `src/routes/data.routes.ts` (11 queries)

| # | Current Query | Target Service | New Endpoint | Status |
|---|---------------|----------------|--------------|--------|
| 1 | `SELECT COUNT(*) FROM patients` | Clinical | `GET /api/v1/stats/patients/count` | ⏳ CREATE |
| 2 | `SELECT COUNT(*) FROM users` | Auth | `GET /api/v1/stats/users/count` | ⏳ CREATE |
| 3 | `SELECT COUNT(*) FROM lab_orders WHERE status='pending'` | Lab | `GET /api/v1/stats/orders/pending` | ⏳ CREATE |
| 4 | `SELECT COUNT(*) FROM medications WHERE status='active'` | Medication | `GET /api/v1/stats/prescriptions/active` | ⏳ CREATE |
| 5 | `SELECT COUNT(*) FROM inventory WHERE status='low_stock'` | Inventory | `GET /api/v1/stats/stock/low` | ⏳ CREATE |
| 6 | `SELECT COUNT(*) FROM appointments WHERE appointment_date=CURDATE()` | Appointment | `GET /api/v1/stats/appointments/today` | ⏳ CREATE |
| 7 | `SELECT * FROM patients LIMIT 20` | Clinical | `GET /api/v1/patients/recent?limit=20` | ⏳ CREATE |
| 8 | `SELECT * FROM patients ORDER BY created_at DESC LIMIT ? OFFSET ?` | Clinical | `GET /api/v1/patients?page=X&limit=Y` | ✅ EXISTS |
| 9 | `SELECT * FROM inventory WHERE status='low_stock'` | Inventory | `GET /api/v1/inventory/low-stock` | ⏳ CREATE |
| 10 | `SELECT * FROM patients WHERE id=?` | Clinical | `GET /api/v1/patients/:id` | ✅ EXISTS |
| 11 | Fallback appointment query | Appointment | Remove fallback, fail gracefully | ⏳ FIX |

### File: `src/routes/search.routes.ts` (Patient search)

| Query | Target Service | New Endpoint | Status |
|-------|----------------|--------------|--------|
| Patient search with filters | Clinical | `GET /api/v1/patients/search?q=...` | ⏳ CREATE |

### File: `src/routes/audit.routes.ts` (Audit logs)

| Query | Target Service | New Endpoint | Status |
|-------|----------------|--------------|--------|
| Audit log writes | Audit Service or keep minimal | TBD | ⏳ DECIDE |

### File: `src/routes/health.routes.ts` (Database health)

| Query | Solution | Status |
|-------|----------|--------|
| Database health check | Remove or check services health | ⏳ FIX |

---

## 🛠️ ENDPOINTS TO CREATE

### Clinical Service (6 endpoints to add)

**File:** `microservices/clinical/src/routes/stats.ts` (NEW)

```typescript
import { Router } from 'express';
import { successResponse } from '@nilecare/response-wrapper';

const router = Router();

// GET /api/v1/stats/patients/count
router.get('/patients/count', async (req, res) => {
  const count = await db.query('SELECT COUNT(*) as count FROM patients');
  res.json(successResponse({ count: count[0].count }));
});

// GET /api/v1/patients/recent?limit=20
router.get('/patients/recent', async (req, res) => {
  const { limit = 20 } = req.query;
  const patients = await db.query(
    'SELECT id, first_name, last_name, phone, email FROM patients ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  res.json(successResponse({ patients }));
});

// GET /api/v1/patients/search?q=Ahmed&filter=...
router.get('/patients/search', async (req, res) => {
  const { q, filter } = req.query;
  // Implement advanced search
  const patients = await searchPatients(q, filter);
  res.json(successResponse({ patients }));
});

export default router;
```

### Lab Service (2 endpoints)

```typescript
// GET /api/v1/stats/orders/pending
router.get('/stats/orders/pending', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM lab_orders WHERE status = ?',
    ['pending']
  );
  res.json(successResponse({ count: count[0].count }));
});

// GET /api/v1/stats/results/critical
router.get('/stats/results/critical', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM lab_results WHERE is_critical = ?',
    [true]
  );
  res.json(successResponse({ count: count[0].count }));
});
```

### Medication Service (2 endpoints)

```typescript
// GET /api/v1/stats/prescriptions/active
router.get('/stats/prescriptions/active', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM medications WHERE status = ?',
    ['active']
  );
  res.json(successResponse({ count: count[0].count }));
});

// GET /api/v1/stats/alerts/high-risk
router.get('/stats/alerts/high-risk', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM medication_alerts WHERE severity = ?',
    ['high']
  );
  res.json(successResponse({ count: count[0].count }));
});
```

### Inventory Service (2 endpoints)

```typescript
// GET /api/v1/stats/stock/low
router.get('/stats/stock/low', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM inventory WHERE quantity < reorder_level'
  );
  res.json(successResponse({ count: count[0].count }));
});

// GET /api/v1/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  const items = await db.query(
    'SELECT * FROM inventory WHERE quantity < reorder_level ORDER BY quantity ASC'
  );
  res.json(successResponse({ items }));
});
```

### Appointment Service (1 endpoint)

```typescript
// GET /api/v1/stats/appointments/today
router.get('/stats/appointments/today', async (req, res) => {
  const count = await db.query(
    'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()'
  );
  res.json(successResponse({ count: count[0].count }));
});
```

### Auth Service (1 endpoint)

```typescript
// GET /api/v1/stats/users/count
router.get('/stats/users/count', async (req, res) => {
  const count = await db.query('SELECT COUNT(*) as count FROM auth_users');
  res.json(successResponse({ count: count[0].count }));
});
```

---

## 🔄 REPLACEMENT PATTERN

### Pattern to Follow:

**Step 1: Create endpoint in service**
```typescript
// In target service (e.g., clinical-service)
router.get('/stats/patients/count', async (req, res) => {
  const count = await db.query('SELECT COUNT(*) FROM patients');
  res.json(successResponse({ count: count[0].count }));
});
```

**Step 2: Test endpoint works**
```bash
curl http://localhost:7001/api/v1/stats/patients/count
```

**Step 3: Replace query in main-nilecare**
```typescript
// Before
const [totalPatients] = await connection.execute('SELECT COUNT(*) FROM patients');
const count = totalPatients[0].count;

// After
const response = await proxyToService(
  'clinical-service',
  '/api/v1/stats/patients/count',
  'GET',
  req
);
const count = response.data.count;
```

**Step 4: Test main-nilecare route still works**
```bash
curl http://localhost:7000/api/v1/data/dashboard/stats
```

---

## 📊 IMPLEMENTATION PRIORITY

### Priority 1: Dashboard Stats (Day 1-2)
Replace the 6 dashboard stat queries:
- Patients count → Clinical Service ⭐
- Users count → Auth Service ⭐
- Lab orders → Lab Service ⭐
- Medications → Medication Service ⭐
- Inventory → Inventory Service ⭐
- Appointments → Already using service! ✅

**Impact:** High (dashboard is critical)  
**Effort:** 2 days

### Priority 2: Recent Data Lists (Day 3)
Replace list queries:
- Recent patients → Clinical Service
- Low stock items → Inventory Service

**Impact:** Medium  
**Effort:** 1 day

### Priority 3: Search (Day 4)
Replace search queries:
- Patient search → Clinical Service  

**Impact:** High (search is critical)  
**Effort:** 1 day

### Priority 4: Remove Database (Day 5)
Clean up:
- Remove MySQL imports
- Remove database config
- Update tests
- Update documentation

**Impact:** Critical (completes fix)  
**Effort:** 1 day

---

## ✅ ACTION PLAN

### Today/Tomorrow: Create Stats Endpoints

**Tasks:**
1. Add `/api/v1/stats/*` routes to 5 services
2. Test each endpoint
3. Document response formats

**Time:** 2 days

### Day 3-4: Replace Queries

**Tasks:**
1. Replace dashboard stats queries
2. Replace recent data queries
3. Replace search queries
4. Test each replacement

**Time:** 2 days

### Day 5: Clean Up

**Tasks:**
1. Remove database dependencies
2. Update tests
3. Documentation
4. Final verification

**Time:** 1 day

---

## 🎯 QUICK START

**Want to start now?**

```bash
# Option 1: Create stats endpoint in clinical service
cd microservices/clinical
# Create src/routes/stats.ts
# Add stats endpoints

# Option 2: Create comprehensive service clients first
cd microservices/main-nilecare
# Create src/clients/ClinicalServiceClient.ts
# Create src/clients/LabServiceClient.ts
# etc.

# Option 3: Move to easier fix first
# Fix #3 (Auth delegation) or Fix #7 (Remove secrets)
```

**Your call! Ready to continue?**

---

**Status:** 🟡 IN PROGRESS  
**Analysis:** COMPLETE ✅  
**Plan:** CREATED ✅  
**Implementation:** READY TO BEGIN  
**Timeline:** 5 days

