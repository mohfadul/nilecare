# Multi-Facility Quick Reference Card

## 🚀 Quick Setup (3 Commands)

```bash
# 1. Initialize sync tables
psql -d your_database -f scripts/init-sync-tables.sql

# 2. Set facility context
export FACILITY_ID="your-facility-uuid"
export ORGANIZATION_ID="your-org-uuid"

# 3. Start services
bash scripts/start-facility-services.sh
```

---

## 🔑 Key Concepts

### Facility Isolation
- ✅ Each facility's data is completely isolated
- ✅ Users can only see their own facility's data
- ✅ Medical Directors can see all facilities
- ✅ Automatic filtering in all database queries

### Offline Support
- ✅ Save data locally when offline
- ✅ Auto-sync when connection restored
- ✅ Conflict resolution strategies
- ✅ No data loss

---

## 💻 Code Examples

### Use FacilityQueryBuilder

```typescript
import { FacilityQueryBuilder } from '../../../shared/middleware/facilityIsolation';

const qb = new FacilityQueryBuilder(
  user.facilityId,
  user.organizationId,
  true // enforce facility filter
);

qb.addCondition('patient_id', patientId)
  .addCondition('status', 'active')
  .addDateRange('created_at', fromDate, toDate);

const { query, params } = qb.buildQuery(
  'SELECT * FROM soap_notes',
  'created_at DESC',
  20
);

const result = await db.query(query, params);
```

### Track Changes for Sync

```typescript
import { SyncService } from '../../../shared/services/SyncService';

const syncService = new SyncService(centralDbConfig, localDbConfig);

// After creating/updating data
await syncService.logChange({
  entityType: 'medication',
  entityId: medication.id,
  facilityId: user.facilityId,
  organizationId: user.organizationId,
  operation: 'create',
  data: medication
});
```

### Apply Facility Middleware

```typescript
import { 
  attachFacilityContext, 
  requireFacility, 
  validateFacilityOwnership 
} from './middleware/facilityMiddleware';

// Apply to all routes
app.use('/api/v1/*', attachFacilityContext);
app.use('/api/v1/*', requireFacility);
app.use('/api/v1/*', validateFacilityOwnership);
```

---

## 🔍 Monitoring

### Check Sync Status

```bash
curl http://localhost:4002/api/v1/sync/status?facilityId=your-facility-id
```

**Response:**
```json
{
  "facilityId": "facility-a-uuid",
  "lastSyncAt": "2025-10-14T10:30:00Z",
  "pendingChanges": 0,
  "conflicts": 0,
  "failedSyncs": 0,
  "status": "healthy"
}
```

### Check Conflicts

```bash
curl http://localhost:4002/api/v1/sync/conflicts?facilityId=your-facility-id
```

### Resolve Conflicts

```bash
curl -X POST http://localhost:4002/api/v1/sync/conflicts/resolve \
  -d '{
    "conflictId": "conflict-uuid",
    "strategy": "last-write-wins"
  }'
```

---

## ⚙️ Configuration

### Required .env Variables

```env
# Facility Identification
FACILITY_ID=your-facility-uuid
ORGANIZATION_ID=your-org-uuid

# Local Database (for offline)
LOCAL_DB_HOST=localhost
LOCAL_DB_NAME=facility_local_db

# Central Database (for sync)
CENTRAL_DB_HOST=central-db.nilecare.sd
CENTRAL_DB_NAME=nilecare_central

# Enable Features
ENFORCE_FACILITY_ISOLATION=true
ENABLE_OFFLINE_SYNC=true
SYNC_INTERVAL_MS=60000
```

---

## 🐛 Troubleshooting

### Problem: Cross-Facility Access Denied

**Solution:** Check user's facility assignment
```bash
# Verify user has facilityId
curl http://localhost:7020/api/v1/users/{userId}
```

### Problem: Sync Not Working

**Solution:** Check network and database
```bash
# 1. Test connectivity
ping central-db.nilecare.sd

# 2. Check pending changes
psql -d facility_local_db -c "SELECT COUNT(*) FROM sync_log WHERE sync_status = 'pending'"

# 3. Trigger manual sync
curl -X POST http://localhost:4002/api/v1/sync/trigger
```

### Problem: Too Many Conflicts

**Solution:** Adjust sync frequency
```env
# Sync more frequently to reduce conflicts
SYNC_INTERVAL_MS=30000  # 30 seconds instead of 60
```

---

## 📊 Roles & Access

| Role | Facility Access | Can Create | Can View |
|------|-----------------|------------|----------|
| Doctor | Own facility only | ✅ Yes | Own facility |
| Nurse | Own facility only | ✅ Yes | Own facility |
| Medical Director | All facilities | ✅ Any facility | All facilities |
| Compliance Officer | All facilities | ❌ No | All facilities |
| Super Admin | All facilities | ✅ Any facility | All facilities |

---

## ✅ Checklist

### Initial Setup
- [ ] Create databases (local and central)
- [ ] Run `scripts/init-sync-tables.sql`
- [ ] Configure `.env` files
- [ ] Set FACILITY_ID and ORGANIZATION_ID
- [ ] Assign users to facilities
- [ ] Test facility isolation

### Testing
- [ ] Test single facility access
- [ ] Test cross-facility prevention
- [ ] Test multi-facility admin access
- [ ] Test offline mode
- [ ] Test automatic sync
- [ ] Test conflict resolution

### Production
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Test disaster recovery
- [ ] Train staff on offline workflows
- [ ] Document facility-specific configs

---

## 📖 More Information

- **Full Guide:** MULTI_FACILITY_SETUP_GUIDE.md
- **Implementation:** PHASE4_MULTI_FACILITY_IMPLEMENTATION.md
- **Overall Progress:** IMPLEMENTATION_PROGRESS_SUMMARY.md

---

**Quick Help:**
- 🔧 Setup Issues → MULTI_FACILITY_SETUP_GUIDE.md (Troubleshooting section)
- 💻 Code Examples → PHASE4_MULTI_FACILITY_IMPLEMENTATION.md (Usage Examples)
- 📊 Architecture → PHASE4_MULTI_FACILITY_IMPLEMENTATION.md (Architecture section)

**Status:** ✅ Phase 4 Complete | ⏳ Phase 5 Pending (Testing)

