# NileCare - Integration Setup Guide

**Date:** October 13, 2025  
**Purpose:** Complete setup instructions following NileCare documentation (single source of truth)

---

## 🔧 Configuration Summary

All port configurations have been corrected to match the NileCare documentation:

| Service | Port | Database | Documentation Reference |
|---------|------|----------|------------------------|
| **Main NileCare (Orchestrator)** | **7000** | MySQL | README.md, COMPREHENSIVE_REPORT.md |
| API Gateway | 7001 | - | README.md |
| Business Service | 7010 | MySQL | README.md |
| Auth Service | 7020 | PostgreSQL | README.md |
| Payment Service | 7030 | PostgreSQL | README.md |
| Appointment Service | 7040 | MySQL | APPOINTMENT_SERVICE_README.md |
| Web Dashboard | 5173 | - | README.md |

---

## ✅ Changes Applied

### 1. Frontend API Clients

**File: `clients/web-dashboard/src/services/appointment.api.ts`**
- ✅ Updated baseURL from `http://localhost:5002` → `http://localhost:7000`
- ✅ Updated all endpoints from `/api/v1/*` → `/api/appointment/*` (orchestrator routes)
- ✅ Now routes through main-nilecare orchestrator as per documentation

**File: `clients/web-dashboard/src/services/api.client.ts`**
- ✅ Updated baseURL from `http://localhost:3006` → `http://localhost:7000`
- ✅ All requests now go through orchestrator

**File: `clients/web-dashboard/src/config/api.config.ts`**
- ✅ Updated default port from 3006 → 7000
- ✅ Updated auth service port from 3001 → 7020
- ✅ Added comprehensive port documentation

### 2. Backend Configuration

**File: `microservices/main-nilecare/env.example`**
- ✅ Updated PORT from 3006 → 7000
- ✅ Updated AUTH_SERVICE_URL port from 3001 → 7020
- ✅ Updated PAYMENT_SERVICE_URL port from 3007 → 7030
- ✅ Updated APPOINTMENT_SERVICE_URL port from 5002 → 7040
- ✅ Updated BUSINESS_SERVICE_URL port from 3005 → 7010

**File: `microservices/business/docker-compose.yml`**
- ✅ Updated PORT from 3005 → 7010
- ✅ Changed database from PostgreSQL → MySQL
- ✅ Changed DB_NAME from `nilecare_business` → `nilecare` (shared database)
- ✅ Added Redis service for caching
- ✅ Updated health check port

**File: `microservices/business/ENV_CONFIG.md`**
- ✅ Updated all references to use `nilecare` database (not `nilecare_business`)
- ✅ Documented port 7010 consistently

---

## 📋 Setup Instructions

### Step 1: Create Environment Files

You need to create `.env` files for each service (they're git-ignored, so they don't exist in the repo).

#### A. Main NileCare Service

```bash
cd microservices/main-nilecare
cp env.example .env
```

The `.env` file should contain:
```env
NODE_ENV=development
PORT=7000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=
JWT_SECRET=nilecare-jwt-secret-change-in-production
AUTH_SERVICE_URL=http://localhost:7020
PAYMENT_SERVICE_URL=http://localhost:7030
APPOINTMENT_SERVICE_URL=http://localhost:7040
BUSINESS_SERVICE_URL=http://localhost:7010
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

#### B. Appointment Service

```bash
cd microservices/appointment-service
```

Create `.env` file:
```env
NODE_ENV=development
PORT=7040
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=
JWT_SECRET=nilecare-jwt-secret-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001,http://localhost:7000
AUTH_SERVICE_URL=http://localhost:7020
MAIN_SERVICE_URL=http://localhost:7000
LOG_LEVEL=info
```

#### C. Business Service

```bash
cd microservices/business
```

Create `.env` file:
```env
NODE_ENV=development
PORT=7010
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=
JWT_SECRET=nilecare-jwt-secret-change-in-production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=info
```

#### D. Auth Service

```bash
cd microservices/auth-service
```

Create `.env` file:
```env
NODE_ENV=development
PORT=7020
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=nilecare-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=nilecare-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=nilecare-session-secret
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

#### E. Payment Service

```bash
cd microservices/payment-gateway-service
```

Create `.env` file:
```env
NODE_ENV=development
PORT=7030
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=nilecare-jwt-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

#### F. Web Dashboard (Frontend)

```bash
cd clients/web-dashboard
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:7000
```

---

### Step 2: Database Setup

#### MySQL Database (for Appointment & Business services)

```bash
# Create database
mysql -u root -p
```

```sql
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nilecare;
```

**Run migrations:**
```bash
# From project root
mysql -u root -p nilecare < database/mysql/schema/identity_management.sql
mysql -u root -p nilecare < database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < database/mysql/schema/payment_system.sql
mysql -u root -p nilecare < database/mysql/schema/appointment_service.sql

# Run business service migrations
mysql -u root -p nilecare < microservices/business/migrations/001_initial_schema_mysql.sql

# Seed sample data
mysql -u root -p nilecare < database/SEED_DATABASE.sql
```

#### PostgreSQL Database (for Auth & Payment services)

```bash
# Create database
psql -U postgres
```

```sql
CREATE DATABASE nilecare;
\q
```

**Run migrations:**
```bash
psql -U postgres -d nilecare < database/postgresql/schema/auth_system.sql
psql -U postgres -d nilecare < database/postgresql/schema/payment_gateway.sql
```

---

### Step 3: Install Dependencies

```bash
# From project root

# Shared modules
cd shared && npm install && npm run build
cd ..

# Main NileCare (Orchestrator)
cd microservices/main-nilecare && npm install
cd ../..

# Appointment Service
cd microservices/appointment-service && npm install
cd ../..

# Business Service
cd microservices/business && npm install
cd ../..

# Auth Service
cd microservices/auth-service && npm install
cd ../..

# Payment Service
cd microservices/payment-gateway-service && npm install
cd ../..

# Web Dashboard
cd clients/web-dashboard && npm install
cd ../..
```

---

### Step 4: Start Services (Correct Order)

**Important:** Services must be started in dependency order!

#### Terminal 1 - Database Services (MySQL & PostgreSQL)
```bash
# If using Docker
docker-compose up mysql postgres redis -d

# OR if using local installations, ensure they're running:
# - MySQL on port 3306
# - PostgreSQL on port 5432
# - Redis on port 6379
```

#### Terminal 2 - Auth Service (Port 7020)
```bash
cd microservices/auth-service
npm run dev
```

Wait for: `✅ Auth service started on port 7020`

#### Terminal 3 - Business Service (Port 7010)
```bash
cd microservices/business
npm run dev
```

Wait for: `✅ Business service started on port 7010`

#### Terminal 4 - Payment Service (Port 7030)
```bash
cd microservices/payment-gateway-service
npm run dev
```

Wait for: `✅ Payment service started on port 7030`

#### Terminal 5 - Appointment Service (Port 7040)
```bash
cd microservices/appointment-service
npm run dev
```

Wait for: `✅ APPOINTMENT SERVICE STARTED` with port 7040

#### Terminal 6 - Main NileCare Orchestrator (Port 7000)
```bash
cd microservices/main-nilecare
npm run dev
```

Wait for: `🚀 MAIN NILECARE SERVICE STARTED` with port 7000

#### Terminal 7 - Web Dashboard (Port 5173)
```bash
cd clients/web-dashboard
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

### Step 5: Verify Everything is Running

Open browser and check health endpoints:

```bash
# Health checks
curl http://localhost:7020/health  # Auth Service ✅
curl http://localhost:7010/health  # Business Service ✅
curl http://localhost:7030/health  # Payment Service ✅
curl http://localhost:7040/health  # Appointment Service ✅
curl http://localhost:7000/health  # Main NileCare (Orchestrator) ✅

# Check orchestrator can reach appointment service
curl http://localhost:7000/api/appointment/health  # Should proxy to appointment service ✅

# Check aggregated health
curl http://localhost:7000/api/health/all  # Should show all services ✅
```

**Web Dashboard:**
- Open: http://localhost:5173
- Should now successfully load appointments without network errors ✅

---

## 🔍 Troubleshooting

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"

**Symptoms:**
```
GET http://localhost:5002/api/v1/appointments net::ERR_CONNECTION_REFUSED
```

**Solution:**
1. ✅ Frontend API configuration has been fixed
2. Ensure Main NileCare orchestrator is running on port 7000
3. Ensure Appointment Service is running on port 7040
4. Check browser console shows: `GET http://localhost:7000/api/appointment/appointments`

### Issue: "Service Unavailable" (503)

**Cause:** Orchestrator can't reach downstream service

**Solution:**
1. Check all services are running on correct ports
2. Verify `.env` files match the configuration above
3. Check service health: `curl http://localhost:7040/health`

### Issue: "UNAUTHORIZED" (401)

**Cause:** JWT_SECRET mismatch between services

**Solution:**
Ensure **ALL services use the SAME JWT_SECRET**:
```env
JWT_SECRET=nilecare-jwt-secret-change-in-production
```

This must be identical in:
- main-nilecare/.env
- appointment-service/.env
- business/.env
- auth-service/.env
- payment-gateway-service/.env

### Issue: Database Connection Failed

**For MySQL services:**
```bash
# Test connection
mysql -u root -p -e "SELECT 1 FROM appointments LIMIT 1;" nilecare

# If database doesn't exist:
mysql -u root -p -e "CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**For PostgreSQL services:**
```bash
# Test connection
psql -U postgres -d nilecare -c "SELECT 1;"

# If database doesn't exist:
psql -U postgres -c "CREATE DATABASE nilecare;"
```

---

## 📊 Architecture Flow (After Integration)

```
┌─────────────────┐
│  Web Dashboard  │  Port 5173
│   React App     │
└────────┬────────┘
         │
         │ All API requests
         ↓
┌─────────────────────────────────────┐
│  Main NileCare (Orchestrator)       │  Port 7000
│  - Routes requests to services      │
│  - JWT validation                   │
│  - Request aggregation              │
└────────┬───────────┬───────────┬────┘
         │           │           │
    ┌────┴────┐ ┌────┴────┐ ┌───┴────┐
    │  Auth   │ │Business │ │Appoint.│
    │ Port    │ │ Port    │ │ Port   │
    │ 7020    │ │ 7010    │ │ 7040   │
    └─────────┘ └─────────┘ └────────┘
```

**Request Flow Example:**
```
Frontend: GET http://localhost:7000/api/appointment/appointments
    ↓
Orchestrator: Validates JWT, forwards to appointment service
    ↓
Appointment Service: GET http://localhost:7040/api/v1/appointments
    ↓
Response flows back through orchestrator to frontend
```

---

## 🎯 Endpoint Mapping (Frontend → Orchestrator → Service)

### Appointment Endpoints

| Frontend Call | Orchestrator Route | Appointment Service |
|--------------|-------------------|-------------------|
| `GET /api/appointment/appointments` | `/api/appointment/appointments` | `/api/v1/appointments` |
| `GET /api/appointment/appointments/today` | `/api/appointment/appointments/today` | `/api/v1/appointments/today` |
| `POST /api/appointment/appointments` | `/api/appointment/appointments` | `/api/v1/appointments` |
| `PUT /api/appointment/appointments/:id` | `/api/appointment/appointments/:id` | `/api/v1/appointments/:id` |
| `DELETE /api/appointment/appointments/:id` | `/api/appointment/appointments/:id` | `/api/v1/appointments/:id` |
| `GET /api/appointment/schedules/available-slots` | `/api/appointment/schedules/available-slots` | `/api/v1/schedules/available-slots` |
| `GET /api/appointment/waitlist` | `/api/appointment/waitlist` | `/api/v1/waitlist` |
| `GET /api/appointment/reminders/pending` | `/api/appointment/reminders/pending` | `/api/v1/reminders/pending` |

### Data Endpoints (Direct to Orchestrator)

| Frontend Call | Orchestrator Handles Directly |
|--------------|------------------------------|
| `GET /api/v1/data/dashboard/stats` | Queries MySQL directly |
| `GET /api/v1/data/appointments/today` | Queries MySQL directly |
| `GET /api/v1/patients` | Queries MySQL directly |
| `POST /api/v1/patients` | Creates patient in MySQL |

### Business Service Endpoints

| Frontend Call | Orchestrator Route | Business Service |
|--------------|-------------------|-----------------|
| `GET /api/business/appointments` | `/api/business/appointments` | `/api/v1/appointments` |
| `GET /api/business/billing` | `/api/business/billing` | `/api/v1/billing` |
| `GET /api/business/staff` | `/api/business/staff` | `/api/v1/staff` |

---

## 🧪 Testing the Integration

### 1. Health Check All Services

```bash
#!/bin/bash
echo "Checking service health..."
echo ""

echo "✅ Auth Service (7020):"
curl -s http://localhost:7020/health | jq '.'

echo ""
echo "✅ Business Service (7010):"
curl -s http://localhost:7010/health | jq '.'

echo ""
echo "✅ Appointment Service (7040):"
curl -s http://localhost:7040/health | jq '.'

echo ""
echo "✅ Payment Service (7030):"
curl -s http://localhost:7030/health | jq '.'

echo ""
echo "✅ Main NileCare Orchestrator (7000):"
curl -s http://localhost:7000/health | jq '.'

echo ""
echo "✅ Aggregated Health (All Services):"
curl -s http://localhost:7000/api/health/all | jq '.'
```

### 2. Test Appointment Flow Through Orchestrator

```bash
# Get JWT token first (login)
TOKEN=$(curl -s -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@nilecare.sd","password":"TestPass123!"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Test appointment endpoints through orchestrator
echo "Testing: Get appointments through orchestrator"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7000/api/appointment/appointments?page=1&limit=5 \
  | jq '.'

echo ""
echo "Testing: Get today's appointments"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7000/api/appointment/appointments/today \
  | jq '.'

echo ""
echo "Testing: Get appointment statistics"
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:7000/api/appointment/appointments/stats \
  | jq '.'
```

### 3. Test Frontend Connection

1. Open browser: http://localhost:5173
2. Login with test credentials:
   - Email: `doctor@nilecare.sd`
   - Password: `TestPass123!`
3. Navigate to: **Appointments** page
4. **Expected:** Appointments load successfully without network errors ✅
5. **Browser Console:** Should show requests to `http://localhost:7000/api/appointment/appointments`

---

## 📝 Common Issues & Solutions

### Issue: Port Already in Use

```bash
# Check what's using a port (Windows)
netstat -ano | findstr :7000

# Kill process
taskkill /PID <process_id> /F
```

### Issue: Services Can't Connect to Each Other

**Verify environment variables:**
```bash
# In each service directory
node -e "require('dotenv').config(); console.log('PORT:', process.env.PORT); console.log('DB_NAME:', process.env.DB_NAME);"
```

### Issue: JWT Token Invalid

**All services MUST use the same JWT_SECRET!**

Check each service's .env file has:
```env
JWT_SECRET=nilecare-jwt-secret-change-in-production
```

---

## 🚀 Quick Start (All in One)

```bash
# 1. Create all .env files (follow instructions above)

# 2. Setup databases
mysql -u root -p < database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < database/SEED_DATABASE.sql

# 3. Start all services (in separate terminals)
cd microservices/auth-service && npm run dev &
cd microservices/business && npm run dev &
cd microservices/payment-gateway-service && npm run dev &
cd microservices/appointment-service && npm run dev &
cd microservices/main-nilecare && npm run dev &
cd clients/web-dashboard && npm run dev &

# 4. Open browser
open http://localhost:5173
```

---

## ✅ Success Criteria

After completing setup, you should have:

- [ ] All services running on correct ports (7000, 7010, 7020, 7030, 7040, 5173)
- [ ] Health checks returning 200 OK for all services
- [ ] Orchestrator can reach all downstream services
- [ ] Frontend loads without network errors
- [ ] Appointments page displays data successfully
- [ ] No console errors about wrong ports
- [ ] Browser console shows requests to `localhost:7000` (orchestrator)

---

## 📚 Documentation References

- **README.md** - Main project documentation (single source of truth for ports)
- **NILECARE_COMPREHENSIVE_REPORT.md** - Architecture and port specifications
- **microservices/appointment-service/IMPLEMENTATION_SUMMARY.md** - Appointment service details
- **microservices/business/ENV_CONFIG.md** - Business service configuration

---

## 🔄 Migration Notes

### What Changed?

**Before (Incorrect):**
- Main NileCare: Port 3006 ❌
- Auth Service: Port 3001 ❌
- Business Service: Port 3005 ❌, PostgreSQL ❌, Database: nilecare_business ❌
- Payment Service: Port 3007 ❌
- Appointment Service: Port 5002 ❌
- Frontend: Connecting directly to services ❌

**After (Correct - Per Documentation):**
- Main NileCare: Port 7000 ✅
- Auth Service: Port 7020 ✅
- Business Service: Port 7010 ✅, MySQL ✅, Database: nilecare ✅
- Payment Service: Port 7030 ✅
- Appointment Service: Port 7040 ✅
- Frontend: Connecting through orchestrator ✅

---

**Setup completed! Follow the steps above to get all services running correctly.**

