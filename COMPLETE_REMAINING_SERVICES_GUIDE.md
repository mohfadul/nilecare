# 🚀 Complete Remaining 8 Services - Quick Guide

**Current:** 5/13 (38%)  
**Remaining:** 8 services  
**Time:** 6-8 hours

---

## 📋 SERVICES TO UPDATE

| # | Service | Port | Path | Status |
|---|---------|------|------|--------|
| 6 | Clinical | 7001 | microservices/clinical | ⏳ NEXT |
| 7 | Lab | 7080 | microservices/lab-service | ⏳ TODO |
| 8 | Medication | 7090 | microservices/medication-service | ⏳ TODO |
| 9 | Inventory | 7100 | microservices/inventory-service | ⏳ TODO |
| 10 | Facility | 7060 | microservices/facility-service | ⏳ TODO |
| 11 | Device | 7070 | microservices/device-integration-service | ⏳ TODO |
| 12 | Notification | 3002 | microservices/notification-service | ⏳ TODO |
| 13 | CDS | 7002 | microservices/cds-service | ⏳ TODO |

---

## ⚡ QUICK UPDATE PATTERN

For EACH service, run:

```bash
cd microservices/[service-name]

# 1. Add to package.json (manually or with editor)
# Add this line to dependencies:
# "@nilecare/response-wrapper": "file:../../packages/@nilecare/response-wrapper",

# 2. Update src/index.ts

# Add at top (after imports):
import {
  requestIdMiddleware,
  errorHandlerMiddleware,
} from '@nilecare/response-wrapper';

# Add after app creation (FIRST middleware):
app.use(requestIdMiddleware);

# Replace errorHandler with (LAST middleware):
app.use(errorHandlerMiddleware({ service: 'service-name' }));

# Add to startup logs:
logger.info('✨ Response Wrapper: ENABLED');

# 3. Install and test
npm install
npm run dev
curl -v http://localhost:[PORT]/health | grep X-Request-Id
```

**Time per service:** ~45 minutes (carefully)

---

## 🎯 TODAY'S TARGET

Complete at least 8 more services to hit **100%**!

**Schedule:**
- Clinical (1 hour)
- Lab (45 min)
- Medication (45 min)
- Inventory (45 min)
- Facility (45 min)
- Device (1 hour - more complex)
- Notification (1 hour - PostgreSQL)
- CDS (45 min)

**Total:** 7 hours  
**Result:** ALL 13 SERVICES WITH STANDARD RESPONSES! 🎉

---

**Your Call:** Continue now or resume tomorrow?

