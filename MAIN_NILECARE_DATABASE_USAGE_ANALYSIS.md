# 🔍 Main-NileCare Database Usage Analysis

**Date:** October 15, 2025  
**Service:** Main-NileCare (Port 7000)  
**Status:** ⚠️ **HAS DATABASE ACCESS - NEEDS REMOVAL**

---

## 🎯 FINDINGS

### Database Usage Found In:

| File | Database Queries | Status |
|------|------------------|--------|
| **src/routes/data.routes.ts** | Multiple SELECT COUNT queries | ⚠️ FOUND |
| **src/routes/health.routes.ts** | Database health check | ⚠️ FOUND |
| **src/routes/audit.routes.ts** | Audit logging queries | ⚠️ FOUND |
| **src/routes/search.routes.ts** | Patient search queries | ⚠️ FOUND |
| **src/middleware/audit-logger.ts** | Audit trail writes | ⚠️ FOUND |
| **src/routes/bulk.routes.ts** | Bulk operations | ⚠️ FOUND |

### GraphQL Resolvers:
- **src/graphql/resolvers.ts**: ✅ **ALREADY USING SERVICE APIS!**
- Good example of how it should be done

---

## 📊 SPECIFIC QUERIES FOUND

### Dashboard Stats (data.routes.ts):

```typescript
// ❌ CURRENT: Direct database queries
SELECT COUNT(*) as count FROM patients
SELECT COUNT(*) as count FROM users
SELECT COUNT(*) as count FROM lab_orders WHERE status = 'pending'
SELECT COUNT(*) as count FROM medications WHERE status = 'active'
SELECT COUNT(*) as count FROM inventory WHERE status = 'low_stock'
SELECT COUNT(*) as count FROM appointments WHERE appointment_date = CURDATE()
```

### Services That Should Provide This Data:

| Query | Target Service | Endpoint Needed |
|-------|----------------|-----------------|
| `FROM patients` | Clinical Service | `GET /api/v1/stats/patients/count` |
| `FROM users` | Auth Service | `GET /api/v1/stats/users/count` |
| `FROM lab_orders` | Lab Service | `GET /api/v1/stats/orders?status=pending` |
| `FROM medications` | Medication Service | `GET /api/v1/stats/prescriptions?status=active` |
| `FROM inventory` | Inventory Service | `GET /api/v1/stats/stock?status=low` |
| `FROM appointments` | Appointment Service | `GET /api/v1/stats/appointments/today` |

---

## ✅ GOOD NEWS

### GraphQL Already Correct!

The GraphQL resolvers in `src/graphql/resolvers.ts` are **already using service APIs** via `proxyToService`:

```typescript
// ✅ CORRECT PATTERN (from GraphQL resolvers)
patient: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
  const data = await context.proxyToService(
    'clinical-service',
    `/api/v1/patients/${id}`,
    'GET',
    context.req
  );
  return data.data;
},
```

**This is the pattern we need to replicate everywhere!**

---

## 🛠️ FIX STRATEGY

### Phase 1: Create Stats Endpoints in Services

Each service needs to add statistics endpoints:

#### Clinical Service:
```typescript
// Add to clinical-service
GET /api/v1/stats/patients/count
GET /api/v1/stats/encounters/today
GET /api/v1/stats/diagnoses/recent
```

#### Lab Service:
```typescript
// Add to lab-service
GET /api/v1/stats/orders?status=pending
GET /api/v1/stats/results/critical
```

#### Medication Service:
```typescript
// Add to medication-service
GET /api/v1/stats/prescriptions?status=active
GET /api/v1/stats/alerts/high-risk
```

#### Inventory Service:
```typescript
// Add to inventory-service
GET /api/v1/stats/stock?status=low
GET /api/v1/stats/expiring
```

### Phase 2: Replace Queries in Main-NileCare

**File: src/routes/data.routes.ts**

**Before:**
```typescript
const [totalPatients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
```

**After:**
```typescript
const patientsStats = await proxyToService(
  'clinical-service',
  '/api/v1/stats/patients/count',
  'GET',
  req
);
const totalPatients = patientsStats.data.count;
```

### Phase 3: Remove Database Dependencies

1. Remove MySQL imports
2. Remove connection pool
3. Remove database config files
4. Update env.example (remove DB_ variables)
5. Update README (document as stateless)

---

## 📋 IMPLEMENTATION CHECKLIST

### ✅ COMPLETED:
- [x] Analyzed database usage
- [x] Identified all queries
- [x] Mapped to services
- [x] Created implementation guide

### ⏳ TO DO:

#### Week 1 - Days 1-2: Create Service Endpoints
- [ ] Add stats endpoints to Clinical Service
- [ ] Add stats endpoints to Lab Service
- [ ] Add stats endpoints to Medication Service
- [ ] Add stats endpoints to Inventory Service
- [ ] Add stats endpoints to Appointment Service (if needed)
- [ ] Test all new endpoints

#### Week 1 - Days 3-4: Replace Queries
- [ ] Replace dashboard stats queries
- [ ] Replace health check queries
- [ ] Replace search queries
- [ ] Replace audit queries
- [ ] Test each replacement

#### Week 1 - Day 5: Remove Database
- [ ] Remove MySQL imports
- [ ] Remove database connection
- [ ] Remove database config
- [ ] Update tests
- [ ] Update documentation
- [ ] Final testing

---

## 🎯 ESTIMATED EFFORT

| Task | Time | Priority |
|------|------|----------|
| Create stats endpoints | 2 days | HIGH |
| Replace queries | 2 days | HIGH |
| Remove database | 1 day | HIGH |
| **TOTAL** | **5 days** | **CRITICAL** |

---

## 💡 QUICK WIN OPTION

Instead of full removal, we could:

1. **Add stats endpoints to services** (2 days)
2. **Replace dashboard queries only** (1 day)
3. **Keep minimal database for now** (search, audit)
4. **Complete removal later** (Phase 2)

**Result:** Main routes working via APIs in 3 days instead of 5

---

## 🚀 READY TO START?

**Next Action:**
```bash
# Option 1: Full fix (5 days)
# Start creating stats endpoints in services

# Option 2: Quick win (3 days)
# Just fix dashboard routes first

# Option 3: Different fix
# Move to Fix #3 (auth delegation) - 3 days
```

**Your call! What do you want to tackle next?**

---

**Status:** 🟡 IN PROGRESS  
**Analysis:** COMPLETE  
**Implementation:** READY TO BEGIN  
**Timeline:** 3-5 days depending on approach

