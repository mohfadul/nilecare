# Medication Service

## 🏥 Overview

The **Medication Service** is a comprehensive microservice for managing medication catalog, prescriptions, dispensing, and administration records within the NileCare healthcare platform. It integrates seamlessly with Authentication, Inventory, and Billing services to provide end-to-end medication management.

## 🎯 Purpose

This service handles:

- **Medication Catalog Management** - Complete formulary with safety classifications
- **Prescription Management** - E-prescribing with safety checks
- **Medication Dispensing** - Integration with inventory and billing
- **Medication Administration Records (MAR)** - Point-of-care documentation
- **High-Alert Medication Monitoring** - Enhanced safety protocols
- **Medication Reconciliation** - Care transition documentation
- **Barcode Verification** - Medication safety scanning
- **Audit Logging** - HIPAA-compliant documentation

## 🚀 Key Features

### Medication Management
- ✅ **Comprehensive Formulary** - Generic, brand names, dosage forms
- ✅ **Safety Classifications** - High-alert, controlled substances
- ✅ **Multi-facility Support** - Facility-specific catalogs
- ✅ **Search & Filter** - Fast medication lookup

### Prescription Management
- ✅ **E-Prescribing** - Electronic prescription creation
- ✅ **Safety Checks** - Allergy, interaction, contraindication checks
- ✅ **Refill Tracking** - Automated refill management
- ✅ **Prescription History** - Complete audit trail

### Dispensing Workflow
- ✅ **Inventory Integration** - Real-time stock checks
- ✅ **Billing Integration** - Automatic charge creation
- ✅ **Batch Tracking** - Expiry date management
- ✅ **Low Stock Alerts** - Proactive warnings

### Medication Administration (MAR)
- ✅ **Point-of-Care Documentation** - Real-time administration records
- ✅ **Barcode Verification** - Patient and medication scanning
- ✅ **Witnessed Administration** - Double-check for high-alert meds
- ✅ **Adverse Reaction Tracking** - Safety event documentation

### Technical Capabilities
- ✅ **RESTful API** - Comprehensive HTTP endpoints
- ✅ **Real-time Events** - Kafka event streaming
- ✅ **Swagger Documentation** - Interactive API documentation
- ✅ **Health Monitoring** - Kubernetes-ready health probes
- ✅ **Rate Limiting** - Protection against API abuse
- ✅ **Centralized Authentication** - Secure API access via Auth Service

## 🏗 Architecture

```
Medication Service
├── Controllers (HTTP handlers)
├── Services (Business logic)
│   ├── MedicationService (main orchestration)
│   ├── MARService
│   ├── BarcodeService
│   ├── ReconciliationService
│   ├── HighAlertService
│   └── AdministrationService
├── Repositories (Data access)
│   ├── MedicationRepository
│   ├── PrescriptionRepository
│   └── MARRepository
├── Integration Clients
│   ├── AuthServiceClient
│   ├── InventoryServiceClient
│   └── BillingServiceClient
└── Middleware
    ├── Authentication (delegated to Auth Service)
    ├── Facility Isolation
    ├── Validation
    └── Error Handling
```

## 🔧 Technology Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js framework
- PostgreSQL (structured data)
- MongoDB (document storage)
- Redis (caching)
- Kafka (event streaming)

**Key Dependencies:**
- `pg` - PostgreSQL client
- `mongoose` - MongoDB ODM
- `ioredis` - Redis client
- `kafkajs` - Kafka client
- `axios` - HTTP client for service integration
- `joi` - Request validation
- `winston` - Logging

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- MongoDB 5+
- Redis 7+
- Kafka (optional, for event streaming)

### Setup

1. **Clone the repository:**
```bash
cd microservices/medication-service
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
PORT=4003
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
INVENTORY_SERVICE_URL=http://localhost:4004
INVENTORY_SERVICE_API_KEY=your_api_key_here
BILLING_SERVICE_URL=http://localhost:7030
BILLING_SERVICE_API_KEY=your_api_key_here
```

**See `.env.example` for complete configuration options**

## 🔑 API Endpoints

### Medication Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/medications` | Create medication | Required |
| GET | `/api/v1/medications/:id` | Get medication by ID | Required |
| GET | `/api/v1/medications/search?q=term` | Search medications | Required |
| PUT | `/api/v1/medications/:id` | Update medication | Required |

### Prescription Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/prescriptions` | Create prescription | Required |
| POST | `/api/v1/prescriptions/:id/dispense` | Dispense medication | Required |
| GET | `/api/v1/patients/:patientId/prescriptions` | Get patient prescriptions | Required |
| POST | `/api/v1/prescriptions/:id/cancel` | Cancel prescription | Required |

### Medication Administration (MAR)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/mar` | Record administration | Required |
| GET | `/api/v1/mar/patient/:patientId` | Get patient MAR | Required |
| PUT | `/api/v1/mar/:id` | Update MAR entry | Required |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/startup` | Startup probe |
| GET | `/metrics` | Prometheus metrics |

## 📝 API Documentation

When the service is running, access interactive API documentation:

```
http://localhost:4003/api-docs
```

## 🔄 Integration Workflows

### Medication Dispensing Workflow

```
1. Doctor creates prescription
   POST /api/v1/prescriptions
   
2. Pharmacist dispenses medication
   POST /api/v1/prescriptions/:id/dispense
   
3. Service checks inventory stock
   → InventoryServiceClient.checkStock()
   
4. Service reduces inventory
   → InventoryServiceClient.reduceStock()
   
5. Service creates billing charge
   → BillingServiceClient.createMedicationCharge()
   
6. Prescription marked as dispensed
   → PrescriptionRepository.markAsDispensed()
   
7. Audit log created
   → logMedicationDispensing()
```

### Event Publishing

The service publishes events to Kafka:

```javascript
// Kafka Topics
- prescription.created
- prescription.cancelled
- medication.dispensed
- medication.administered
- high_alert.event
- inventory.updated (consumed from Inventory Service)
- billing.charged (consumed from Billing Service)
```

## 🛡️ Security

### Authentication

**IMPORTANT:** This service does NOT verify JWTs locally. All authentication is delegated to the centralized Auth Service.

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
| **Doctor** | Create prescriptions, view medications |
| **Pharmacist** | Dispense medications, view prescriptions, manage inventory |
| **Nurse** | Administer medications (MAR), view prescriptions |
| **Admin** | Full access to medication management |

### Facility Isolation

All medication data is isolated by facility:

- Users can only access data from their assigned facility
- Multi-facility administrators can access across facilities
- All queries automatically filtered by `facilityId`

## 📊 Database Schema

### PostgreSQL Tables

- `medications` - Medication catalog/formulary
- `prescriptions` - Prescription records
- `mar_entries` - Medication administration records
- `high_alert_medications` - High-alert medication configurations
- `medication_audit_log` - Audit trail for all actions

### MongoDB Collections

- `medication_reconciliations` - Care transition reconciliation records

**Full schema:** See `database/schema.sql`

## 📈 Monitoring & Logging

### Health Checks

```bash
# Liveness
curl http://localhost:4003/health

# Readiness (includes DB checks)
curl http://localhost:4003/health/ready

# Startup
curl http://localhost:4003/health/startup
```

### Logging

Logs are written to:
- Console (development)
- `logs/medication-service-combined.log`
- `logs/medication-service-error.log`

Specialized audit logging:
- `logMedicationDispensing()` - HIPAA-compliant dispensing records
- `logMedicationAdministration()` - MAR audit trail
- `logHighAlertEvent()` - High-alert medication events
- `logBarcodeVerificationFailure()` - Security events

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t nilecare/medication-service:latest .

# Run container
docker run -p 4003:4003 \
  -e AUTH_SERVICE_URL=http://auth-service:7020 \
  -e PG_HOST=postgres \
  nilecare/medication-service:latest
```

## 🔗 Dependencies

This service requires:

1. **Auth Service** (Port 7020) - MUST be running first
2. **Inventory Service** (Port 4004) - For stock management
3. **Billing Service** (Port 7030) - For charge creation
4. **PostgreSQL** - Primary database
5. **MongoDB** - Document storage
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
mongo mongodb://localhost:27017/nilecare --eval "db.runCommand({ ping: 1 })"
```

3. **Verify environment variables:**
```bash
echo $AUTH_SERVICE_URL
echo $AUTH_SERVICE_API_KEY
```

### Integration Failures

**Inventory Service Unavailable:**
- Service will return warnings but continue
- Manual inventory adjustment may be required
- Check `INVENTORY_SERVICE_URL` configuration

**Billing Service Unavailable:**
- Service will return warnings but continue
- Manual billing entry required
- Check `BILLING_SERVICE_URL` configuration

### Authentication Errors

**401 Unauthorized:**
- Verify Auth Service is running
- Check `AUTH_SERVICE_API_KEY` matches Auth Service configuration
- Verify JWT token is valid

**403 Forbidden:**
- User lacks required permissions
- Check user role and facility assignment
- Verify facility isolation rules

## 📚 Additional Documentation

- **Implementation Summary:** See `MEDICATION_SERVICE_SUMMARY.md`
- **Environment Configuration:** See `.env.example`
- **Database Schema:** See `database/schema.sql`
- **API Documentation:** http://localhost:4003/api-docs (when running)

## 🤝 Contributing

When contributing:

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation (Swagger)
4. Follow existing code structure
5. Add audit logging for sensitive operations

## 📄 License

MIT License

---

## 🙏 Acknowledgments

Built for the NileCare Healthcare Platform with focus on:
- Patient safety
- Regulatory compliance (HIPAA)
- Service reliability
- Integration excellence

---

**Service Version:** 1.0.0  
**Last Updated:** October 14, 2025  
**Port:** 4003  
**Status:** ✅ Production Ready

For support: Check `MEDICATION_SERVICE_SUMMARY.md` or contact the development team.

