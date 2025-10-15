# Lab Service

## 🏥 Overview

The **Lab Service** is a comprehensive microservice for managing laboratory operations including test catalog, lab orders, sample tracking, result processing, and critical value alerting within the NileCare healthcare platform. It integrates seamlessly with Authentication, Appointment, and Billing services.

## 🎯 Purpose

This service handles:

- **Lab Test Catalog Management** - Complete test and panel catalog with LOINC codes
- **Lab Order Management** - Integration with appointments and clinical orders
- **Sample Tracking** - Chain of custody for specimens
- **Result Processing** - Result entry, review, and release
- **Critical Value Alerting** - Real-time alerts for critical results
- **Quality Control** - QC tracking and validation
- **HL7 Integration** - HL7 message processing (ORU, ORM)
- **FHIR Compliance** - FHIR R4 diagnostic report export
- **Audit Logging** - HIPAA-compliant documentation

## 🚀 Key Features

### Lab Operations
- ✅ **Comprehensive Test Catalog** - LOINC-coded tests with reference ranges
- ✅ **Lab Panels** - Pre-configured test panels (CBC, CMP, LFT, etc.)
- ✅ **Multi-priority Orders** - Routine, urgent, STAT
- ✅ **Sample Chain of Custody** - Complete specimen tracking

### Clinical Integration
- ✅ **Appointment Integration** - Seamless test ordering from appointments
- ✅ **Billing Integration** - Automatic charge creation for lab tests
- ✅ **Critical Value Alerts** - Real-time notifications to clinical staff
- ✅ **Result Access Control** - Role-based result viewing

### Technical Capabilities
- ✅ **RESTful API** - Comprehensive HTTP endpoints
- ✅ **Real-time Events** - Kafka event streaming
- ✅ **WebSocket Notifications** - Live updates for results
- ✅ **Swagger Documentation** - Interactive API documentation
- ✅ **Health Monitoring** - Kubernetes-ready health probes
- ✅ **Centralized Authentication** - Secure API access via Auth Service

## 🏗 Architecture

```
Lab Service
├── Controllers (HTTP handlers)
├── Services (Business logic)
│   ├── LabService (main orchestration)
│   ├── SampleTrackingService
│   ├── ResultService
│   └── QualityControlService
├── Integration Clients
│   ├── AuthServiceClient
│   ├── AppointmentServiceClient
│   └── BillingServiceClient
└── Middleware
    ├── Authentication (delegated to Auth Service)
    ├── Facility Isolation
    ├── Validation
    └── Error Handling
```

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- MongoDB 5+ (optional)
- Redis 7+
- Kafka (optional, for event streaming)

### Setup

1. **Clone the repository:**
```bash
cd microservices/lab-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
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
# Service Configuration
PORT=4005
NODE_ENV=development

# Authentication Service (REQUIRED!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your_api_key_here

# Database
PG_HOST=localhost
PG_DATABASE=nilecare
MONGO_URI=mongodb://localhost:27017/nilecare
REDIS_HOST=localhost

# Integration Services
APPOINTMENT_SERVICE_URL=http://localhost:7040
APPOINTMENT_SERVICE_API_KEY=your_api_key_here
BILLING_SERVICE_URL=http://localhost:7030
BILLING_SERVICE_API_KEY=your_api_key_here
```

**See `.env.example` for complete configuration options**

## 🔑 API Endpoints

### Lab Order Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/lab-orders` | Create lab order | Required |
| GET | `/api/v1/lab-orders/:id` | Get lab order by ID | Required |
| GET | `/api/v1/patients/:patientId/lab-orders` | Get patient lab orders | Required |
| POST | `/api/v1/lab-orders/:id/cancel` | Cancel lab order | Required |

### Sample Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/samples` | Collect sample | Required |
| GET | `/api/v1/samples/:id` | Get sample by ID | Required |
| PUT | `/api/v1/samples/:id/status` | Update sample status | Required |

### Result Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/results` | Submit result | Required |
| GET | `/api/v1/results/:id` | Get result by ID | Required |
| POST | `/api/v1/results/:id/release` | Review and release result | Required |
| GET | `/api/v1/patients/:patientId/results` | Get patient results | Required |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/startup` | Startup probe |
| GET | `/metrics` | Prometheus metrics |

## 🔄 Integration Workflows

### Lab Order Workflow

```
1. Doctor orders tests from appointment
   POST /api/v1/lab-orders
   
2. Service validates appointment
   → AppointmentServiceClient.getAppointment()
   
3. Service creates lab order
   → INSERT INTO lab_orders
   
4. Service creates billing charges
   → BillingServiceClient.createLabOrderCharge()
   
5. Service notifies appointment
   → AppointmentServiceClient.notifyLabOrderCreated()
   
6. Audit log created
   → logLabOrderCreation()
```

### Sample Collection to Result Workflow

```
1. Lab tech collects sample
   POST /api/v1/samples
   
2. Sample stored with chain of custody
   → INSERT INTO samples
   → Log custody chain
   
3. Lab tech processes and enters results
   POST /api/v1/results
   
4. System checks for critical values
   → Automatic alert if critical
   
5. Supervisor reviews results
   POST /api/v1/results/:id/release
   
6. Results released to patient/provider
   → Event: lab.result.published
   → WebSocket notification
```

### Event Publishing

The service publishes events to Kafka:

```javascript
// Kafka Topics
- lab.test.ordered
- lab.sample.collected
- lab.result.completed
- lab.result.published
- lab.critical.value
```

## 🛡️ Security

### Authentication

**IMPORTANT:** This service does NOT verify JWTs locally. All authentication is delegated to the centralized Auth Service.

### Authorization

Role-based access control:

| Role | Permissions |
|------|-------------|
| **Doctor** | Order tests, view all results |
| **Lab Technician** | Collect samples, process results, enter data |
| **Lab Supervisor** | Review and release results |
| **Patient** | View own results only (after release) |
| **Admin** | Full access to lab management |

### Facility Isolation

All lab data is isolated by facility:

- Users can only access data from their assigned facility
- Multi-facility administrators can access across facilities
- All queries automatically filtered by `facilityId`

## 📊 Database Schema

### PostgreSQL Tables

- `lab_tests` - Test catalog with LOINC codes
- `lab_panels` - Test panels/profiles
- `lab_orders` - Lab test orders
- `samples` - Specimen tracking with chain of custody
- `lab_results` - Test results with critical value tracking
- `lab_audit_log` - Audit trail for all actions

**Full schema:** See `database/schema.sql`

## 📈 Monitoring & Logging

### Health Checks

```bash
# Liveness
curl http://localhost:4005/health

# Readiness (includes DB checks)
curl http://localhost:4005/health/ready

# Startup
curl http://localhost:4005/health/startup
```

### Logging

Logs are written to:
- Console (development)
- `logs/lab-service-combined.log`
- `logs/lab-service-error.log`

Specialized audit logging:
- `logLabOrderCreation()` - HIPAA-compliant order tracking
- `logSampleCollection()` - Chain of custody
- `logResultRelease()` - Result access audit
- `logCriticalValue()` - Critical value notifications

## 🔗 Dependencies

This service requires:

1. **Auth Service** (Port 7020) - MUST be running first
2. **Appointment Service** (Port 7040) - For appointment integration
3. **Billing Service** (Port 7030) - For charge creation
4. **PostgreSQL** - Primary database
5. **MongoDB** - Document storage (optional)
6. **Redis** - Caching (optional but recommended)
7. **Kafka** - Event streaming (optional)

## 🚨 Troubleshooting

### Service Won't Start

1. **Check Auth Service is running:**
```bash
curl http://localhost:7020/health
```

2. **Check database connections:**
```bash
psql -U postgres -d nilecare -c "SELECT 1"
```

3. **Verify environment variables:**
```bash
echo $AUTH_SERVICE_URL
echo $AUTH_SERVICE_API_KEY
```

### Integration Failures

**Appointment Service Unavailable:**
- Service will return warnings but continue
- Lab order created without appointment link
- Check `APPOINTMENT_SERVICE_URL` configuration

**Billing Service Unavailable:**
- Service will return warnings but continue
- Manual billing entry required
- Check `BILLING_SERVICE_URL` configuration

## 📚 Additional Documentation

- **Implementation Summary:** See `LAB_SERVICE_SUMMARY.md`
- **Environment Configuration:** See `.env.example`
- **Database Schema:** See `database/schema.sql`
- **API Documentation:** http://localhost:4005/api-docs (when running)

## 📄 License

MIT License

---

**Service Version:** 1.0.0  
**Last Updated:** October 14, 2025  
**Port:** 4005  
**Status:** ✅ Production Ready

For support: Check `LAB_SERVICE_SUMMARY.md` or contact the development team.

