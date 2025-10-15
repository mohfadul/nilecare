# Inventory Service (Pharmacy-Aware)

**Version:** 2.0.0 (Pharmacy Upgrade)  
**Status:** ✅ Production Ready  
**Last Updated:** October 14, 2025

## 🏥 Overview

The **Inventory Service** is the authoritative microservice for **pharmacy-aware stock management**, batch tracking, and inventory movements within the NileCare healthcare platform. It provides atomic reservation/commit/rollback operations critical for safe medication dispensing and integrates seamlessly with Authentication, Medication, Billing, and Purchasing services.

## 🎯 Purpose

This service is the **single source of truth** for:

- **Pharmacy Stock Management** - Medication tracking per location (pharmacy, ward, storage)
- **Stock Levels** - Real-time inventory quantities (on-hand, reserved, available)
- **Batch Tracking** - Batch numbers, lot numbers, expiry dates with FEFO support
- **Atomic Reservations** - Reserve/commit/rollback pattern for safe dispensing
- **Stock Movements** - Complete audit trail of all inventory changes
- **Multi-Location Tracking** - Pharmacy, ward, refrigerator, controlled substances
- **Smart Automation** - Auto-reserve from prescriptions, auto-alerts
- **Expiry Management** - Automatic alerts for expiring medication batches
- **Low Stock Alerts** - Automatic reorder notifications
- **Chain of Custody** - Full traceability for all stock movements

## 🚀 Key Features

### 💊 Pharmacy-Specific Features (NEW!)
- ✅ **Medication Stock Tracking** - Medication-focused inventory per location
- ✅ **Pharmacy Locations** - Main pharmacy, ward stock, refrigerator, controlled substances
- ✅ **Auto-Reserve from Prescriptions** - Automatic stock reservation when prescribed
- ✅ **Auto-Release on Cancel** - Automatic rollback when prescription canceled
- ✅ **Batch Strength & Packaging** - Track dosage form, strength, unit
- ✅ **FEFO Support** - First-Expiry-First-Out batch dispensing
- ✅ **Pharmacy Dashboard** - Medication-specific reports and analytics

### Stock Management
- ✅ **Atomic Reservations** - Reserve/commit/rollback pattern for safe dispensing
- ✅ **Real-time Availability** - Accurate stock queries with reservations
- ✅ **Batch Tracking** - Complete batch lifecycle with expiry management
- ✅ **Optimistic + Pessimistic Locking** - Concurrency control

### Integration
- ✅ **Medication Integration** - Stock checks, auto-reserve, dispensing workflow
- ✅ **Billing Integration** - Movement notifications (NO billing logic)
- ✅ **Purchasing Integration** - Stock receipt from purchase orders
- ✅ **Authentication** - Centralized auth via Auth Service

### Smart Automation (NEW!)
- ✅ **Auto-Reserve** - Prescriptions trigger automatic stock reservation
- ✅ **Auto-Release** - Canceled prescriptions auto-rollback reservations
- ✅ **Low Stock Alerts** - Automatic reorder notifications (hourly checks)
- ✅ **Expiry Alerts** - 30-day warning for expiring batches (daily checks)
- ✅ **Auto-Expire** - Old reservations automatically expired (5-minute job)

### Operations
- ✅ **Multi-location** - Track stock across locations (pharmacy, ward, storage, refrigerator)
- ✅ **Multi-facility** - Complete facility isolation
- ✅ **Event-Driven** - Kafka events for all operations
- ✅ **Comprehensive Audit** - Every stock change logged with full context

## 🏗 Architecture

```
Inventory Service (Port 5004)
├── Services
│   ├── InventoryService (reserve/commit/rollback)
│   ├── StockMovementService
│   └── ExpiryAlertService
├── Integration Clients
│   ├── AuthServiceClient
│   ├── MedicationServiceClient
│   ├── BillingServiceClient (notifications only)
│   └── PurchasingServiceClient
├── Middleware
│   ├── Authentication (delegated)
│   ├── Facility Isolation
│   ├── Validation
│   └── Error Handling
└── Database
    ├── PostgreSQL (with transactions)
    └── Redis (caching)
```

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Kafka (optional)

### Setup

1. **Navigate to service:**
```bash
cd microservices/inventory-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
# Create .env from template
# See "Configuration" section below
```

4. **Apply database schema:**
```bash
psql -U postgres -d nilecare < database/schema.sql
```

5. **Start the service:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## ⚙️ Configuration

### Critical Environment Variables

```env
# Service
PORT=5004
NODE_ENV=development

# Authentication Service (REQUIRED!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<64-char-hex-key>

# Database
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=nilecare
PG_USER=postgres
PG_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Integration Services
MEDICATION_SERVICE_URL=http://localhost:4003
MEDICATION_SERVICE_API_KEY=<api-key>
BILLING_SERVICE_URL=http://localhost:7030
BILLING_SERVICE_API_KEY=<api-key>
PURCHASING_SERVICE_URL=http://localhost:5005
PURCHASING_SERVICE_API_KEY=<api-key>
```

## 🔑 API Endpoints

### Stock Reservation (Atomic Operations)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/inventory/reserve` | Reserve stock (Step 1) | Required |
| POST | `/api/v1/inventory/commit/:reservationId` | Commit reservation (Step 2) | Required |
| POST | `/api/v1/inventory/rollback/:reservationId` | Rollback reservation | Required |
| GET | `/api/v1/inventory/check-availability` | Check stock availability | Required |

### Stock Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/inventory/receive` | Receive stock from PO | Required |
| POST | `/api/v1/inventory/adjust` | Adjust stock (damage, loss) | Required |
| POST | `/api/v1/inventory/transfer` | Transfer between locations | Required |
| GET | `/api/v1/inventory/:itemId/stock` | Get item stock levels | Required |

### Batch Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/batches/:itemId` | Get batches for item | Required |
| GET | `/api/v1/batches/expiring` | Get expiring batches | Required |
| POST | `/api/v1/batches/:batchId/quarantine` | Quarantine batch | Required |

### Reporting

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/inventory/low-stock` | Get low stock items | Required |
| GET | `/api/v1/inventory/movements` | Get stock movements | Required |
| GET | `/api/v1/inventory/valuation` | Get stock valuation | Required |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/startup` | Startup probe |
| GET | `/metrics` | Prometheus metrics |

## 🔄 Critical Workflows

### Medication Dispensing Workflow (Atomic)

```
Step 1: RESERVE
┌─────────────────────────────────────────────────┐
│ Medication Service → Inventory Service          │
│ POST /api/v1/inventory/reserve                  │
│                                                  │
│ Request: {                                      │
│   itemId, quantity, reference (prescriptionId) │
│ }                                               │
│                                                  │
│ Inventory Service:                              │
│  • Locks item row (FOR UPDATE)                 │
│  • Checks available stock                       │
│  • Creates reservation record                   │
│  • Increments quantity_reserved                 │
│  • Returns reservationId + expiresAt            │
└─────────────────────────────────────────────────┘
                     ▼
Step 2a: COMMIT (Success)
┌─────────────────────────────────────────────────┐
│ Medication Service → Inventory Service          │
│ POST /api/v1/inventory/commit/:reservationId    │
│                                                  │
│ Inventory Service:                              │
│  • Validates reservation active & not expired   │
│  • Decrements quantity_on_hand                  │
│  • Decrements quantity_reserved                 │
│  • Updates reservation status: committed        │
│  • Creates stock_movement record                │
│  • Logs audit trail                             │
│  • Emits: inventory.committed event             │
└─────────────────────────────────────────────────┘

Step 2b: ROLLBACK (Failure)
┌─────────────────────────────────────────────────┐
│ Medication Service → Inventory Service          │
│ POST /api/v1/inventory/rollback/:reservationId  │
│                                                  │
│ Inventory Service:                              │
│  • Validates reservation active                 │
│  • Decrements quantity_reserved                 │
│  • Releases stock back to available             │
│  • Updates reservation status: rolled_back      │
│  • Logs rollback reason                         │
│  • Emits: inventory.rolled_back event           │
└─────────────────────────────────────────────────┘
```

### Purchase Receipt Workflow

```
1. Purchase Order arrives
   POST /api/v1/inventory/receive
   
2. Service creates batch record
   → INSERT INTO stock_batches
   
3. Service updates stock levels
   → UPDATE inventory_items (atomic)
   
4. Service creates movement record
   → INSERT INTO stock_movements
   
5. Audit log created
   → logStockMovement()
   
6. Event published
   → inventory.received
```

## 🛡️ Security

### Authentication

**IMPORTANT:** This service does NOT verify JWTs locally. All authentication is delegated to the centralized Auth Service.

### Authorization

Role-based access control:

| Role | Permissions |
|------|-------------|
| **Stock Manager** | Full inventory management |
| **Pharmacist** | Dispense, check stock, view movements |
| **Doctor** | View stock availability only |
| **Admin** | Full access |

### Facility Isolation

Critical for security:
- Stock data isolated by `facility_id`
- Cross-facility access blocked
- Multi-facility admins can access all facilities

## 🔒 Concurrency Control

### Optimistic Locking

The `inventory_items` table uses a `version` column:

```sql
UPDATE inventory_items
SET quantity_on_hand = $1,
    version = version + 1
WHERE item_id = $2 AND version = $3
```

If `version` doesn't match, update fails and retry is required.

### Pessimistic Locking

For reservations, we use PostgreSQL row-level locks:

```sql
SELECT * FROM inventory_items
WHERE item_id = $1
FOR UPDATE -- Locks the row
```

This ensures no other transaction can modify stock during reservation.

## 📊 Database Schema

### PostgreSQL Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `inventory_items` | Stock levels | quantity_on_hand, quantity_reserved, quantity_available (computed), version |
| `stock_batches` | Batch tracking | batch_number, expiry_date, quantity tracking |
| `stock_reservations` | Reservation management | status (active/committed/rolled_back), expires_at |
| `stock_movements` | Audit trail | movement_type, quantity_change, before/after, reference |
| `locations` | Storage locations | location_type, temperature_controlled |
| `inventory_audit_log` | Comprehensive audit | All actions with old/new values |

**Views:**
- `low_stock_items` - Items below reorder level
- `expiring_batches` - Batches expiring within 30 days
- `active_reservations` - Currently active reservations
- `stock_valuation` - Total inventory value

**Full schema:** See `database/schema.sql`

## 🔄 Event Publishing (NEW!)

The service publishes events to Kafka for real-time updates:

### Kafka Topics

**`inventory-events` topic:**
```javascript
inventory.reserved → {
  reservationId, itemId, quantity, reference, expiresAt, facilityId
}

inventory.committed → {
  reservationId, itemId, quantityCommitted, reference, facilityId
}

inventory.rolled_back → {
  reservationId, itemId, quantity, reason, facilityId
}

inventory.received → {
  itemId, quantity, batchNumber, locationId, facilityId, purchaseOrderReference
}

inventory.updated → {
  itemId, itemName, quantityAvailable, lowStock, facilityId
}
```

**`inventory-alerts` topic:**
```javascript
inventory.low_stock → {
  itemId, itemName, currentStock, reorderLevel, facilityId, locationId
}

inventory.expiring → {
  batchNumber, itemId, itemName, expiryDate, daysRemaining, quantityInBatch, facilityId
}
```

### Event Subscribers

**Medication Service:**
- Listens to `inventory.updated` - Update prescription availability
- Listens to `inventory.low_stock` - Notify doctors of unavailability

**Billing Service:**
- Listens to `inventory.committed` - Link to billing charge
- Listens to `inventory.received` - Update cost records

**Purchasing Service:**
- Listens to `inventory.low_stock` - Trigger auto-reorder
- Listens to `inventory.received` - Mark PO received

**Notification Service:**
- Listens to `inventory.low_stock` - Alert stock managers
- Listens to `inventory.expiring` - Alert pharmacists

## 📈 Monitoring & Logging

### Specialized Audit Logging

- `logStockMovement()` - Every stock change
- `logStockReservation()` - Every reservation
- `logStockCommit()` - Every commit
- `logStockRollback()` - Every rollback
- `logLowStockAlert()` - Low stock notifications
- `logExpiryAlert()` - Expiry warnings

### Health Checks

```bash
# Liveness
curl http://localhost:5004/health

# Readiness (with DB check)
curl http://localhost:5004/health/ready
```

## 🔗 Dependencies

This service requires:

1. **Auth Service** (Port 7020) - MUST be running first
2. **Medication Service** (Port 4003) - For product catalog
3. **Billing Service** (Port 7030) - For movement notifications
4. **PostgreSQL** - Primary database with transaction support
5. **Redis** - Caching
6. **Kafka** - Event streaming (optional)

## ⚠️ Important Notes

### What This Service Does

✅ Manages stock levels (on-hand, reserved, available)  
✅ Tracks batches with expiry dates  
✅ Handles atomic reservations for dispensing  
✅ Records all stock movements  
✅ Provides stock availability queries  
✅ Sends low stock and expiry alerts  

### What This Service Does NOT Do

❌ Does NOT create billing charges (only notifies Billing)  
❌ Does NOT process payments (Payment Gateway handles that)  
❌ Does NOT manage medication catalog (Medication Service owns that)  
❌ Does NOT create purchase orders (Purchasing Service handles that)

### Separation of Concerns

| Service | Responsibility |
|---------|----------------|
| **Inventory** | Stock tracking, reservations, movements, batches |
| **Medication** | Medication catalog, prescriptions, dispensing workflow |
| **Billing** | Creates charges and invoices |
| **Payment Gateway** | Processes payments |
| **Purchasing** | Creates and manages purchase orders |

## 🚨 Troubleshooting

### Insufficient Stock Error

```json
{
  "error": "Insufficient stock for Amoxicillin 500mg. Available: 5, Requested: 10"
}
```

**Solution:** 
- Check stock levels: `GET /api/v1/inventory/:itemId/stock`
- Adjust quantity or receive more stock

### Reservation Expired

```json
{
  "error": "Reservation has expired"
}
```

**Solution:**
- Reservations expire after 30 minutes by default
- Create a new reservation if needed
- Adjust `expiresInMinutes` when reserving

### Integration Service Unavailable

The service handles external service failures gracefully:
- Returns warnings but continues operation
- Logs errors for investigation
- Does not block critical inventory operations

## 📚 Additional Documentation

- **Implementation Summary:** See `INVENTORY_SERVICE_SUMMARY.md`
- **Database Schema:** See `database/schema.sql`
- **API Documentation:** http://localhost:5004/api-docs (when running)

## 🎯 Pharmacy-Specific Endpoints (NEW!)

### Pharmacy Dashboard

```bash
# Get pharmacy stock report
GET /api/v1/inventory/pharmacy-report?facilityId=xxx&locationId=yyy

# Returns:
{
  "items": [
    {
      "itemName": "Amoxicillin 500mg",
      "quantityAvailable": 95,
      "locationName": "Main Pharmacy",
      "activeBatchCount": 2,
      "earliestExpiry": "2027-01-01",
      "status": "available"
    }
  ],
  "summary": {
    "totalMedications": 45,
    "lowStock": 5,
    "outOfStock": 2,
    "expiringSoon": 3
  }
}
```

### Medication Stock View

```bash
# Get all medication stock (pharmacy-specific)
GET /api/v1/inventory/medication-stock?facilityId=xxx

# Returns medications with batches, sorted by expiry (FEFO)
```

## 📊 Automated Jobs (NEW!)

The service runs automated background jobs:

| Schedule | Job | Purpose |
|----------|-----|---------|
| Every 5 minutes | `expire_old_reservations()` | Auto-expire reservations past expiry time |
| Every hour | `checkLowStockItems()` | Detect and alert low stock |
| Daily at 8 AM | `checkExpiringBatches()` | Alert for batches expiring within 30 days |

## 🔔 Alert System (NEW!)

### Low Stock Alerts

**Trigger:** `quantity_available <= reorder_level`  
**Action:**
- Log: `logLowStockAlert()`
- Emit: `inventory.low_stock` event
- Notify: Stock managers via Notification Service

### Expiry Alerts

**Trigger:** Batch expiring within 30 days  
**Action:**
- Log: `logExpiryAlert()`
- Emit: `inventory.expiring` event
- Notify: Pharmacists to prioritize FEFO

## 📈 Version History

### Version 2.0.0 (October 14, 2025) - Pharmacy Upgrade
- ✅ Added pharmacy-focused stock tracking
- ✅ Implemented auto-reserve/release for prescriptions
- ✅ Added smart automation (low stock, expiry alerts)
- ✅ Created repository and controller layers
- ✅ Implemented Kafka event publishing
- ✅ Added pharmacy dashboard reports
- ✅ Enhanced security with role-based access
- ✅ Complete Swagger documentation
- ✅ Automated background jobs

### Version 1.0.0 (October 14, 2025) - Initial Implementation
- Basic stock tracking with atomic operations
- Reserve/commit/rollback pattern
- Batch tracking with expiry
- Multi-facility support

## 📄 License

MIT License

---

**Service Version:** 2.0.0 (Pharmacy-Aware)  
**Last Updated:** October 14, 2025  
**Port:** 5004  
**Status:** ✅ Production Ready  
**Upgrade:** ✅ Pharmacy Features Complete

For support: 
- Check `INVENTORY_SERVICE_SUMMARY.md` for implementation details
- Check `INVENTORY_PHARMACY_UPGRADE_COMPLETE.md` for upgrade changelog
- Contact the development team

