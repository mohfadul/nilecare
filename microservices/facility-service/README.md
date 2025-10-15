# Facility Service

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Port:** 5001  
**Last Updated:** October 14, 2025

## 🏥 Overview

The **Facility Service** is the central microservice for managing healthcare facilities, departments, wards, and beds within the NileCare platform. It provides complete facility hierarchy management with real-time bed tracking, capacity monitoring, and multi-tenant support.

## 🎯 Purpose

This service is the **single source of truth** for:

- **Facility Management** - Hospitals, clinics, labs, pharmacies
- **Organizational Structure** - Facility → Department → Ward → Bed hierarchy
- **Bed Management** - Real-time bed status, patient assignments, occupancy tracking
- **Capacity Monitoring** - Real-time availability and occupancy rates
- **Multi-Facility Support** - Complete facility isolation and multi-tenant architecture
- **Settings Management** - Facility-specific configuration and preferences

## 🚀 Key Features

### Facility Management
- ✅ **Complete Facility CRUD** - Create, read, update, delete facilities
- ✅ **Multi-Type Support** - Hospital, clinic, lab, pharmacy, rehabilitation, etc.
- ✅ **Search & Filter** - Advanced search by name, type, location
- ✅ **Organization Linking** - Connect facilities to organizations
- ✅ **Licensing Tracking** - License numbers, expiry dates, accreditations

### Hierarchical Structure
- ✅ **Departments** - Medical, surgical, emergency, etc.
- ✅ **Wards** - General, ICU, maternity, pediatric, isolation
- ✅ **Beds** - Standard, ICU, pediatric, maternity, isolation
- ✅ **Equipment Tracking** - Oxygen, monitors, ventilators per bed

### Real-Time Bed Management
- ✅ **Live Bed Status** - Available, occupied, cleaning, maintenance
- ✅ **Patient Assignment** - Assign/release beds with full history
- ✅ **Occupancy Tracking** - Real-time ward and facility occupancy
- ✅ **WebSocket Updates** - Instant status changes
- ✅ **Bed History** - Complete audit trail of assignments

### Integration
- ✅ **Auth Service Integration** - Centralized authentication and facility-based access control
- ✅ **Business Service Integration** - Organization management
- ✅ **Event Publishing** - Kafka events for real-time updates
- ✅ **Facility Isolation** - Complete data isolation per facility

## 🏗 Architecture

```
Facility Service (Port 5001)
├── Controllers (HTTP handlers)
│   ├── FacilityController
│   ├── DepartmentController
│   ├── WardController
│   └── BedController
├── Services (Business logic)
│   ├── FacilityService
│   ├── DepartmentService
│   ├── WardService
│   ├── BedService
│   └── SettingsService
├── Repositories (Data access)
│   ├── FacilityRepository
│   ├── DepartmentRepository
│   ├── WardRepository
│   └── BedRepository
├── Integration Clients
│   ├── AuthServiceClient
│   └── BusinessServiceClient
├── Event Publisher
│   └── EventPublisher (Kafka)
└── Middleware
    ├── Authentication (delegated to Auth Service)
    ├── Facility Isolation (self-referential)
    ├── Validation
    └── Error Handling
```

## 🔧 Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js framework
- PostgreSQL 15+ (primary database)
- Redis 7+ (caching)
- Socket.IO (real-time updates)
- Kafka (event streaming)

**Key Dependencies:**
- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `kafkajs` - Kafka client
- `socket.io` - WebSocket server
- `express-validator` - Request validation
- `winston` - Logging

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Kafka (optional)

### Setup

1. **Navigate to service:**
```bash
cd microservices/facility-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
# Create .env file with required variables
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

### Required Environment Variables

```env
# Service
PORT=5001
NODE_ENV=development

# Authentication Service (REQUIRED!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<64-char-hex-key>

# Business Service
BUSINESS_SERVICE_URL=http://localhost:7010
BUSINESS_SERVICE_API_KEY=<api-key>

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=nilecare
PG_USER=postgres
PG_PASSWORD=your_secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka (Optional)
KAFKA_ENABLED=false
KAFKA_BROKERS=localhost:9092
```

## 🔑 API Endpoints

### Facility Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/facilities` | List facilities | Required |
| POST | `/api/v1/facilities` | Create facility | Required |
| GET | `/api/v1/facilities/:id` | Get facility | Required |
| PUT | `/api/v1/facilities/:id` | Update facility | Required |
| DELETE | `/api/v1/facilities/:id` | Delete facility | Required |
| GET | `/api/v1/facilities/:id/departments` | Get departments | Required |
| GET | `/api/v1/facilities/:id/capacity` | Get capacity | Required |
| GET | `/api/v1/facilities/:id/analytics` | Get analytics | Required |

### Department Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/departments` | List departments | Required |
| POST | `/api/v1/departments` | Create department | Required |
| GET | `/api/v1/departments/:id` | Get department | Required |
| PUT | `/api/v1/departments/:id` | Update department | Required |
| DELETE | `/api/v1/departments/:id` | Delete department | Required |
| GET | `/api/v1/departments/:id/wards` | Get wards | Required |

### Ward Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/wards` | List wards | Required |
| POST | `/api/v1/wards` | Create ward | Required |
| GET | `/api/v1/wards/:id` | Get ward | Required |
| PUT | `/api/v1/wards/:id` | Update ward | Required |
| DELETE | `/api/v1/wards/:id` | Delete ward | Required |
| GET | `/api/v1/wards/:id/beds` | Get beds | Required |
| GET | `/api/v1/wards/:id/occupancy` | Get occupancy | Required |

### Bed Management (Critical for Admissions)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/beds` | List beds | Required |
| POST | `/api/v1/beds` | Create bed | Required |
| GET | `/api/v1/beds/:id` | Get bed | Required |
| PUT | `/api/v1/beds/:id` | Update bed | Required |
| PUT | `/api/v1/beds/:id/status` | Update status | Required |
| POST | `/api/v1/beds/:id/assign` | Assign to patient | Required |
| POST | `/api/v1/beds/:id/release` | Release from patient | Required |
| GET | `/api/v1/beds/available` | Get available beds | Required |
| GET | `/api/v1/beds/:id/history` | Get history | Required |

### Settings Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/settings/facility/:facilityId` | Get settings | Required |
| PUT | `/api/v1/settings/facility/:facilityId` | Update settings | Required |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/startup` | Startup probe |
| GET | `/metrics` | Prometheus metrics |

## 📝 API Documentation

Interactive API documentation (Swagger):
```
http://localhost:5001/api-docs
```

## 🔄 Integration Workflows

### Create Facility Workflow

```
1. Admin creates facility
   POST /api/v1/facilities
   
2. Service validates organization ownership
   → AuthServiceClient.validateToken()
   → BusinessServiceClient.getOrganizationById()
   
3. Service creates facility
   → FacilityRepository.create()
   
4. Service publishes event
   → EventPublisher.publishFacilityCreated()
   
5. Service notifies Business Service
   → BusinessServiceClient.notifyFacilityCreated()
   
6. Facility created
   → Returns facility object
```

### Bed Assignment Workflow

```
1. Admission staff assigns bed
   POST /api/v1/beds/:id/assign
   
2. Service validates bed availability
   → BedRepository.findById()
   → Check bedStatus === 'available'
   
3. Service assigns bed (transaction)
   → Update bed status to 'occupied'
   → Set patient_id
   → Create bed_history record
   
4. Service updates ward occupancy
   → WardRepository.updateOccupancy()
   
5. Service publishes event
   → EventPublisher.publishBedStatusChanged()
   
6. Real-time update via WebSocket
   → io.emit('bed-status-changed')
```

### Event Publishing

The service publishes events to Kafka:

**facility-events topic:**
```javascript
facility.created → { facilityId, name, organizationId, type }
facility.updated → { facilityId, changes }
department.created → { departmentId, facilityId, name }
ward.created → { wardId, facilityId, capacity }
```

**facility-alerts topic:**
```javascript
bed.status_changed → { bedId, wardId, status, patientId }
ward.capacity_updated → { wardId, totalBeds, occupiedBeds, availableBeds }
facility.capacity_critical → { facilityId, availableBeds, threshold }
```

## 🛡️ Security

### Authentication

**IMPORTANT:** This service does NOT verify JWTs locally. All authentication is delegated to the Auth Service.

```typescript
// Authentication Flow
1. Client sends request with JWT token
2. Shared middleware extracts token
3. AuthServiceClient.validateToken() called
4. Auth Service validates and returns user info
5. Request proceeds if valid, rejected if invalid
```

### Authorization

Role-based access control:

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to all facilities |
| **Organization Admin** | Manage facilities in their organization |
| **Facility Admin** | Manage their assigned facility |
| **Department Head** | View facility structure, manage department |
| **Nurse** | View beds, update bed status |

### Facility Isolation

Critical security feature:
- All data is isolated by `facility_id`
- Users can only access their assigned facility
- Multi-facility admins can access multiple facilities
- Organization admins can access all organization facilities

## 📊 Database Schema

### PostgreSQL Tables

- `facilities` - Healthcare facilities (hospitals, clinics, etc.)
- `departments` - Departments within facilities
- `wards` - Wards within departments
- `beds` - Hospital beds with real-time status
- `facility_settings` - Facility-specific configuration
- `bed_history` - Audit trail of bed assignments
- `facility_audit_log` - Comprehensive audit trail

### Views

- `v_facility_summary` - Facility statistics with counts
- `v_ward_occupancy` - Ward occupancy details
- `v_available_beds` - Available beds with details

**Full schema:** See `database/schema.sql`

## 📈 Monitoring & Logging

### Specialized Audit Logging

- `logFacilityCreation()` - Facility creation events
- `logBedAssignment()` - Bed assignments and releases
- `logCapacityUpdate()` - Capacity changes
- `logFacilityAccess()` - Facility access attempts
- `logDepartmentCreation()` - Department creation
- `logWardStatusChange()` - Ward status changes

### Health Checks

```bash
# Liveness
curl http://localhost:5001/health

# Readiness (includes DB check)
curl http://localhost:5001/health/ready

# Startup
curl http://localhost:5001/health/startup
```

## 🔗 Dependencies

This service requires:

1. **Auth Service** (Port 7020) - MUST be running first
2. **Business Service** (Port 7010) - For organization management
3. **PostgreSQL** - Primary database
4. **Redis** - Caching (optional but recommended)
5. **Kafka** - Event streaming (optional)

## 🚨 Troubleshooting

### Service Won't Start

1. **Check Auth Service is running:**
```bash
curl http://localhost:7020/health
```

2. **Check database connection:**
```bash
psql -U postgres -d nilecare -c "SELECT 1"
```

3. **Verify environment variables:**
```bash
echo $AUTH_SERVICE_URL
echo $AUTH_SERVICE_API_KEY
```

### Integration Failures

**Auth Service Unavailable:**
- Service will reject all authenticated requests
- Verify `AUTH_SERVICE_URL` is correct
- Check `AUTH_SERVICE_API_KEY` matches Auth Service configuration

**Business Service Unavailable:**
- Organization validation will be skipped
- Facility creation may proceed without organization validation
- Check `BUSINESS_SERVICE_URL` configuration

## 📚 Additional Documentation

- **Implementation Summary:** See `FACILITY_SERVICE_SUMMARY.md`
- **Database Schema:** See `database/schema.sql`
- **API Documentation:** http://localhost:5001/api-docs (when running)
- **Environment Configuration:** See `.env.example`

## 🐳 Docker Deployment

```bash
# Build image
docker build -t nilecare/facility-service:latest .

# Run container
docker run -p 5001:5001 \
  -e AUTH_SERVICE_URL=http://auth-service:7020 \
  -e PG_HOST=postgres \
  nilecare/facility-service:latest
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🔔 Real-Time Features

### WebSocket Events

The service provides real-time updates via Socket.IO:

**Client-side connection:**
```javascript
const socket = io('http://localhost:5001');

// Join facility room
socket.emit('join-facility', facilityId);

// Listen for bed status changes
socket.on('bed-status-changed', (data) => {
  console.log('Bed status updated:', data);
});

// Listen for department updates
socket.on('department-updated', (data) => {
  console.log('Department updated:', data);
});
```

## 📊 Use Cases

### 1. Create Multi-Facility Organization

```bash
# 1. Create Facility
POST /api/v1/facilities
{
  "organizationId": "org-uuid",
  "facilityCode": "KTH-001",
  "name": "Khartoum Teaching Hospital",
  "type": "hospital",
  "address": {
    "street": "University Avenue",
    "city": "Khartoum",
    "state": "Khartoum",
    "zipCode": "11111",
    "country": "Sudan"
  },
  "contact": {
    "phone": "+249123456789",
    "email": "info@kth.sd"
  },
  "capacity": {
    "totalBeds": 200,
    "icuBeds": 20,
    "emergencyBeds": 30
  }
}
```

### 2. Patient Admission - Find Available Bed

```bash
# 1. Get available beds
GET /api/v1/beds/available?facilityId={facilityId}&bedType=icu&hasVentilator=true

# 2. Assign bed to patient
POST /api/v1/beds/{bedId}/assign
{
  "patientId": "patient-uuid",
  "expectedDischargeDate": "2025-10-20"
}

# 3. Real-time update broadcast to all connected clients
```

### 3. Monitor Facility Capacity

```bash
# Get real-time capacity
GET /api/v1/facilities/{facilityId}/capacity

# Response:
{
  "totalBeds": 200,
  "availableBeds": 45,
  "occupiedBeds": 145,
  "occupancyRate": 72.5,
  "icuBeds": 20,
  "icuAvailable": 3
}
```

## ⚠️ Important Notes

### What This Service Does

✅ Manages facility hierarchical structure  
✅ Tracks bed availability and assignments  
✅ Provides real-time occupancy data  
✅ Enforces facility isolation  
✅ Publishes facility events  

### What This Service Does NOT Do

❌ Does NOT manage patient clinical data (Clinical Service)  
❌ Does NOT handle appointments (Appointment Service)  
❌ Does NOT process billing (Billing Service)  
❌ Does NOT manage inventory (Inventory Service)  
❌ Does NOT authenticate users (Auth Service does that)  

### Separation of Concerns

| Service | Responsibility |
|---------|----------------|
| **Facility** | Physical structure, beds, capacity |
| **Auth** | User authentication and facility assignments |
| **Business** | Organizations, scheduling, billing |
| **Appointment** | Appointment scheduling and reminders |
| **Clinical** | Patient medical records and encounters |

## 📄 License

MIT License

---

**Service Version:** 1.0.0  
**Last Updated:** October 14, 2025  
**Port:** 5001  
**Status:** ✅ Production Ready

For support: Check `FACILITY_SERVICE_SUMMARY.md` or contact the development team.

