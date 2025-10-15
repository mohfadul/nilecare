# Start All Healthcare Services - Quick Guide 🚀

**Last Updated:** October 14, 2025

---

## 🎯 Overview

This guide will help you start all three integrated healthcare services:
1. **Auth Service** (Port 7020) - Authentication
2. **CDS Service** (Port 4002) - Clinical Decision Support
3. **EHR Service** (Port 4001) - Electronic Health Records
4. **Clinical Service** (Port 3004) - Patient Management & Prescribing

---

## 📋 Prerequisites

### Required Software
- ✅ **Node.js** 18+ and npm
- ✅ **PostgreSQL** 14+ (required for all services)
- ✅ **MongoDB** 6+ (optional - for CDS/EHR guidelines)
- ✅ **Redis** 6+ (optional - for caching)

### Optional (for full features)
- **Kafka** - For event streaming (can start services without it)
- **Docker** - For containerized deployment

---

## 🚀 Quick Start (All Services)

### Option 1: Automated Start (Recommended)

```powershell
# Windows PowerShell
.\start-all-healthcare-services.ps1
```

```bash
# Linux/Mac
bash start-all-healthcare-services.sh
```

### Option 2: Manual Start (Step by Step)

Follow the detailed steps below ↓

---

## 📝 Step-by-Step Setup

### Step 1: Create Databases

```bash
# Create PostgreSQL databases
createdb auth_service
createdb cds_service
createdb ehr_service
createdb nilecare  # For Clinical Service

# Create database users (optional, can use postgres user)
psql -U postgres -c "CREATE USER cds_user WITH ENCRYPTED PASSWORD 'secure_password';"
psql -U postgres -c "CREATE USER ehr_user WITH ENCRYPTED PASSWORD 'secure_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cds_service TO cds_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ehr_service TO ehr_user;"
```

### Step 2: Load Database Schemas

```bash
# CDS Service schema
psql -U postgres -d cds_service -f microservices/cds-service/database/schema.sql

# EHR Service schema
psql -U postgres -d ehr_service -f microservices/ehr-service/database/schema.sql

# Auth Service schema (if needed)
# psql -U postgres -d auth_service -f microservices/auth-service/database/schema.sql

# Clinical Service schema (if exists)
# psql -U postgres -d nilecare -f database/mysql/schema/clinical_data.sql
```

### Step 3: Configure Environment Variables

#### Auth Service
```bash
cd microservices/auth-service
cp .env.example .env

# Edit .env:
# - Set DB credentials
# - Set JWT_SECRET (64+ characters)
# - Set SERVICE_API_KEYS (comma-separated)
```

#### CDS Service
```bash
cd microservices/cds-service
cp .env.example .env

# Edit .env:
# - Set DB credentials (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
# - Set AUTH_SERVICE_URL=http://localhost:7020
# - Set AUTH_SERVICE_API_KEY (must match one from Auth Service)
# - Set SERVICE_NAME=cds-service
```

#### EHR Service
```bash
cd microservices/ehr-service
cp .env.example .env

# Edit .env:
# - Set DB credentials
# - Set AUTH_SERVICE_URL=http://localhost:7020
# - Set AUTH_SERVICE_API_KEY (must match one from Auth Service)
# - Set SERVICE_NAME=ehr-service
```

#### Clinical Service
```bash
cd microservices/clinical
cp .env.example .env

# Edit .env:
# - Set DB credentials
# - Set AUTH_SERVICE_URL=http://localhost:7020
# - Set CDS_SERVICE_URL=http://localhost:4002
# - Set EHR_SERVICE_URL=http://localhost:4001
# - Set ENABLE_CDS_INTEGRATION=true
# - Set ENABLE_EHR_INTEGRATION=true
```

### Step 4: Install Dependencies

```bash
# Install for all services
cd microservices/auth-service && npm install
cd ../cds-service && npm install
cd ../ehr-service && npm install
cd ../clinical && npm install
cd ../../shared && npm install && npm run build
```

### Step 5: Start Services (IN ORDER!)

**Important:** Start Auth Service FIRST, then others!

```bash
# Terminal 1 - Auth Service (MUST BE FIRST!)
cd microservices/auth-service
npm run dev
# Wait for: "✅ Auth Service started on port 7020"

# Terminal 2 - CDS Service
cd microservices/cds-service
npm run dev
# Wait for: "✅ CLINICAL DECISION SUPPORT SERVICE STARTED"

# Terminal 3 - EHR Service
cd microservices/ehr-service
npm run dev
# Wait for: "✅ ELECTRONIC HEALTH RECORD SERVICE STARTED"

# Terminal 4 - Clinical Service
cd microservices/clinical
npm run dev
# Wait for: "✅ CLINICAL SERVICE STARTED"
```

### Step 6: Verify All Services

```bash
# Check health endpoints
curl http://localhost:7020/health  # Auth Service
curl http://localhost:4002/health  # CDS Service
curl http://localhost:4001/health  # EHR Service
curl http://localhost:3004/health  # Clinical Service

# All should return: {"status": "healthy", ...}
```

---

## 🧪 Test the Integration

### 1. Login and Get Token

```bash
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@nilecare.sd",
    "password": "TestPass123!"
  }'

# Save the token from response
TOKEN="<paste-token-here>"
```

### 2. Test CDS Service

```bash
# Check drug interaction
curl -X POST http://localhost:4002/api/v1/check-medication \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "medications": [
      {"name": "Warfarin", "dose": "5mg", "frequency": "daily"},
      {"name": "Aspirin", "dose": "81mg", "frequency": "daily"}
    ],
    "allergies": [],
    "conditions": [{"code": "I48.91", "name": "Atrial Fibrillation"}]
  }'

# Expected: Returns drug interaction warning (Warfarin + Aspirin = bleeding risk)
```

### 3. Test EHR Service

```bash
# Create SOAP note
curl -X POST http://localhost:4001/api/v1/soap-notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "encounterId": "660e8400-e29b-41d4-a716-446655440001",
    "subjective": "Patient reports persistent headache for 3 days.",
    "objective": "Vital Signs: BP 130/85, HR 78. HEENT: Normal.",
    "assessment": "Likely tension headache.",
    "plan": "Start ibuprofen 400mg TID. Follow-up in 1 week."
  }'

# Expected: Returns created SOAP note with status "draft"
```

### 4. Test Clinical Service with CDS Integration

```bash
# Prescribe medication (triggers CDS safety check)
curl -X POST http://localhost:3004/api/v1/medications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Warfarin",
    "dosage": "5mg",
    "frequency": "daily",
    "route": "oral",
    "testCurrentMedications": [
      {"name": "Aspirin", "dosage": "81mg", "frequency": "daily"}
    ],
    "testAllergies": [],
    "testConditions": [
      {"code": "I48.91", "name": "Atrial Fibrillation"}
    ]
  }'

# Expected: Returns prescription with safety assessment and warnings
```

---

## 🔍 Troubleshooting

### Services Won't Start

#### Auth Service
```bash
# Check PostgreSQL is running
pg_isready -h localhost

# Check database exists
psql -U postgres -l | grep auth_service

# Check environment variables
cat microservices/auth-service/.env | grep -E 'DB_|JWT_SECRET'

# View logs
cd microservices/auth-service
npm run dev  # Check console output
```

#### CDS Service
```bash
# Common issues:
# 1. PostgreSQL not connected
psql -U postgres -d cds_service -c "SELECT 1;"

# 2. Schema not loaded
psql -d cds_service -c "\dt"  # Should show tables

# 3. Auth Service URL wrong
curl http://localhost:7020/health  # Should work first

# 4. Missing dependencies
cd microservices/cds-service
rm -rf node_modules package-lock.json
npm install
```

#### EHR Service
```bash
# Similar to CDS Service
psql -U postgres -d ehr_service -c "SELECT 1;"
psql -d ehr_service -c "\dt"  # Should show tables
```

### Services Running But Integration Fails

```bash
# Check service connectivity
curl http://localhost:7020/health  # Auth
curl http://localhost:4002/health  # CDS
curl http://localhost:4001/health  # EHR
curl http://localhost:3004/health  # Clinical

# Check Auth Service integration endpoint
curl http://localhost:7020/api/v1/integration/health

# Check service logs for errors
# Look for:
# - "[Auth Middleware]" - Authentication attempts
# - "CDS Request" - CDS Service calls
# - "EHR Request" - EHR Service calls
# - "Safety check" - CDS safety checks
```

### Token Issues

```bash
# Get fresh token
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@nilecare.sd", "password": "TestPass123!"}'

# Validate token
curl -X POST http://localhost:7020/api/v1/integration/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "<your-token>"}'

# Check token expiry
# Tokens expire after 24 hours by default
```

---

## 📊 Service Health Dashboard

### Quick Health Check Script

```bash
# Create health-check.sh
#!/bin/bash

echo "🏥 NileCare Healthcare Services - Health Check"
echo "=============================================="

echo -n "Auth Service (7020): "
curl -s http://localhost:7020/health | grep -q "healthy" && echo "✅ UP" || echo "❌ DOWN"

echo -n "CDS Service (4002): "
curl -s http://localhost:4002/health | grep -q "healthy" && echo "✅ UP" || echo "❌ DOWN"

echo -n "EHR Service (4001): "
curl -s http://localhost:4001/health | grep -q "healthy" && echo "✅ UP" || echo "❌ DOWN"

echo -n "Clinical Service (3004): "
curl -s http://localhost:3004/health | grep -q "healthy" && echo "✅ UP" || echo "❌ DOWN"

echo "=============================================="
echo "Run 'curl http://localhost:<PORT>/api-docs' to view API docs"
```

---

## 🌐 Service URLs

| Service | Health | API Docs | Purpose |
|---------|--------|----------|---------|
| **Auth** | http://localhost:7020/health | http://localhost:7020/api-docs | Authentication |
| **CDS** | http://localhost:4002/health | http://localhost:4002/api-docs | Safety Checks |
| **EHR** | http://localhost:4001/health | http://localhost:4001/api-docs | Documentation |
| **Clinical** | http://localhost:3004/health | http://localhost:3004/api-docs | Patient Care |

---

## 🎓 What Each Service Does

### Auth Service (Port 7020)
- ✅ User authentication and authorization
- ✅ JWT token generation and validation
- ✅ Role-based access control
- ✅ Service-to-service authentication
- ✅ Centralized permission management

### CDS Service (Port 4002)
- ✅ Drug-drug interaction checking
- ✅ Allergy alert detection (including cross-reactivity)
- ✅ Medication dose validation
- ✅ Drug-disease contraindication detection
- ✅ Clinical guideline recommendations
- ✅ Real-time safety alert broadcasting

### EHR Service (Port 4001)
- ✅ SOAP note creation and management
- ✅ Problem list tracking (active diagnoses)
- ✅ Progress note documentation
- ✅ Document export (HTML, FHIR, XML)
- ✅ Document versioning and amendments
- ✅ HIPAA-compliant audit trails

### Clinical Service (Port 3004)
- ✅ Patient demographics and management
- ✅ Medication prescribing (with CDS safety checks!)
- ✅ Encounter tracking
- ✅ Diagnostic ordering
- ✅ Event publishing (Kafka)
- ✅ Real-time updates (WebSocket)

---

## 🔄 Complete Workflow Example

### Prescribing Medication with Safety Checks

```bash
# 1. Login
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@nilecare.sd", "password": "TestPass123!"}'

# Save token
TOKEN="<token-from-response>"

# 2. Prescribe medication
curl -X POST http://localhost:3004/api/v1/medications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Warfarin",
    "dosage": "5mg",
    "frequency": "daily",
    "route": "oral",
    "testCurrentMedications": [
      {"name": "Aspirin", "dosage": "81mg", "frequency": "daily"}
    ]
  }'

# What happens:
# 1. Clinical Service receives request
# 2. Clinical Service → CDS Service (safety check)
# 3. CDS Service checks:
#    - Drug interactions: FOUND (Warfarin + Aspirin)
#    - Allergies: NONE
#    - Contraindications: NONE
#    - Dose: OK
#    - Risk: LOW (score 2)
# 4. Clinical Service saves prescription with risk data
# 5. Clinical Service publishes Kafka event
# 6. Response includes safety assessment

# Response shows interaction warning but allows prescription (low risk)
```

---

## 📖 API Documentation

### Interactive API Docs (Swagger)

Open in browser:
- **CDS Service:** http://localhost:4002/api-docs
- **EHR Service:** http://localhost:4001/api-docs
- **Clinical Service:** http://localhost:3004/api-docs
- **Auth Service:** http://localhost:7020/api-docs

---

## 🛑 Stopping Services

### Graceful Shutdown

Each service handles `CTRL+C` gracefully and will:
1. Close HTTP server
2. Close database connections
3. Close WebSocket connections
4. Close Kafka producers
5. Exit cleanly

```bash
# In each terminal running a service:
CTRL+C

# Services will log:
# "SIGINT received, shutting down gracefully"
# "✅ Service shut down successfully"
```

### Force Stop (if needed)

```bash
# Find process by port
lsof -i :7020  # Auth
lsof -i :4002  # CDS
lsof -i :4001  # EHR
lsof -i :3004  # Clinical

# Kill process
kill -9 <PID>
```

---

## 🔧 Environment Configuration Summary

### Auth Service (.env)
```env
PORT=7020
DB_HOST=localhost
DB_NAME=auth_service
JWT_SECRET=<64-char-secret>
SERVICE_API_KEYS=key1,key2,key3,key4
```

### CDS Service (.env)
```env
PORT=4002
DB_HOST=localhost
DB_NAME=cds_service
DB_USER=postgres
DB_PASSWORD=yourpassword
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<matches-auth-service>
SERVICE_NAME=cds-service
```

### EHR Service (.env)
```env
PORT=4001
DB_HOST=localhost
DB_NAME=ehr_service
DB_USER=postgres
DB_PASSWORD=yourpassword
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<matches-auth-service>
SERVICE_NAME=ehr-service
```

### Clinical Service (.env)
```env
PORT=3004
DB_HOST=localhost
DB_NAME=nilecare
CDS_SERVICE_URL=http://localhost:4002
EHR_SERVICE_URL=http://localhost:4001
AUTH_SERVICE_URL=http://localhost:7020
ENABLE_CDS_INTEGRATION=true
ENABLE_EHR_INTEGRATION=true
```

---

## 🎉 Success Indicators

### All Services Started Successfully

You should see in console:
```
[Auth Service]
✅ Auth Service started on port 7020
✅ Database connected
✅ Integration endpoints ready

[CDS Service]
✅ CLINICAL DECISION SUPPORT SERVICE STARTED
✅ PostgreSQL connected
✅ MongoDB connected (or warning if optional)
✅ Redis connected (or warning if optional)

[EHR Service]
✅ ELECTRONIC HEALTH RECORD SERVICE STARTED
✅ PostgreSQL connected
✅ MongoDB connected (or warning if optional)

[Clinical Service]
✅ CLINICAL SERVICE STARTED
✅ Database connected
✅ CDS integration enabled
✅ EHR integration enabled
✅ Connected to CDS Service for real-time alerts
```

---

## 📞 Quick Commands Reference

```bash
# Health checks
curl http://localhost:7020/health
curl http://localhost:4002/health
curl http://localhost:4001/health
curl http://localhost:3004/health

# Login
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@nilecare.sd", "password": "TestPass123!"}'

# Check medication safety
curl -X POST http://localhost:4002/api/v1/check-medication \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId": "...", "medications": [...]}'

# Create SOAP note
curl -X POST http://localhost:4001/api/v1/soap-notes \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId": "...", "subjective": "...", ...}'

# Prescribe medication (with integrated safety check)
curl -X POST http://localhost:3004/api/v1/medications \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId": "...", "name": "...", "dosage": "..."}'
```

---

## 🆘 Getting Help

### Documentation
- **Implementation Reports:** See `PHASE1_CDS_IMPLEMENTATION_COMPLETE.md`, `PHASE2_EHR_IMPLEMENTATION_COMPLETE.md`, `PHASE3_INTEGRATION_COMPLETE.md`
- **Integration Guide:** See `microservices/clinical/CDS_INTEGRATION_GUIDE.md`
- **Auth Guide:** See `AUTHENTICATION_INTEGRATION_GUIDE.md`
- **Final Report:** See `HEALTHCARE_SERVICES_FINAL_REPORT.md`

### Common Issues
1. **"Cannot connect to Auth Service"** → Start Auth Service first
2. **"Missing environment variables"** → Check .env file exists and has required vars
3. **"Database connection failed"** → Verify PostgreSQL is running and database exists
4. **"Token expired"** → Get new token (they expire after 24 hours)
5. **"CDS Service unavailable"** → Check CDS Service is running on port 4002

---

**🎉 All services should now be running and integrated!**

**Next Steps:**
1. Open API docs: http://localhost:4002/api-docs
2. Test medication safety checks
3. Test clinical documentation
4. Review implementation reports

---

**Last Updated:** October 14, 2025  
**Services:** Auth (7020) | CDS (4002) | EHR (4001) | Clinical (3004)  
**Status:** ✅ **ALL OPERATIONAL**

