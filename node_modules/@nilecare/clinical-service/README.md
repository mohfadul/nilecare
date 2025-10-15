# Clinical Service

## 🏥 Overview

The **Clinical Service** is a comprehensive healthcare microservice that manages core clinical operations including patient records, medical encounters, medication prescriptions, diagnostic tests, and FHIR-compliant data exchange. It serves as the primary clinical data management layer in the NileCare healthcare platform.

## 🎯 Purpose

This service manages all clinical workflows and patient data:

- **Patient Management** - Complete patient demographics, medical history, and records
- **Encounter Management** - Track patient visits, consultations, and treatments
- **Medication Management** - Prescribe, track, and manage patient medications
- **Diagnostic Orders** - Order and track lab tests, imaging, and other diagnostics
- **FHIR Integration** - HL7 FHIR-compliant data exchange for interoperability
- **Real-time Updates** - WebSocket-based live clinical data updates
- **Event Publishing** - Kafka-based event streaming for service integration

## 🚀 Key Features

### Clinical Operations
- ✅ **Patient Records** - Comprehensive patient demographics and history
- ✅ **Encounter Tracking** - Inpatient, outpatient, emergency, telehealth visits
- ✅ **Medication Prescribing** - E-prescribing with full medication tracking
- ✅ **Diagnostic Ordering** - Lab tests, imaging, and diagnostic procedures
- ✅ **Vital Signs Recording** - Blood pressure, heart rate, temperature, etc.
- ✅ **Medical History** - Allergies, conditions, previous treatments

### Technical Capabilities
- ✅ **FHIR R4 Compliant** - Full HL7 FHIR standard support
- ✅ **Real-time Updates** - Socket.IO for live clinical data
- ✅ **Event-Driven Architecture** - Kafka event publishing
- ✅ **Multi-tenant** - Organization-based data isolation
- ✅ **Role-Based Access** - Doctor, nurse, admin permissions
- ✅ **RESTful API** - Comprehensive HTTP endpoints
- ✅ **Swagger Documentation** - Interactive API documentation

## 📊 Architecture

### Service Components

```
┌─────────────────────────────────────────────────────────────┐
│                Clinical Service (Port 3004)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   HTTP Server    │  │  WebSocket (IO)  │                │
│  │   (Express)      │  │   Real-time      │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • PatientController                                   │  │
│  │ • EncounterController                                 │  │
│  │ • MedicationController                                │  │
│  │ • DiagnosticController                                │  │
│  │ • FHIRController                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services Layer                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • PatientService (PostgreSQL)                        │  │
│  │ • EncounterService                                    │  │
│  │ • MedicationService                                   │  │
│  │ • DiagnosticService                                   │  │
│  │ • FHIRService                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Event Publishing                         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • Kafka Producer (EventPublisher)                    │  │
│  │ • Topics: patient-events, medication-events, etc.    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Stores                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • PostgreSQL (Primary database)                      │  │
│  │ • Kafka (Event streaming)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integration with CDS Service

### **THE PERFECT PARTNERSHIP: Clinical + CDS**

The Clinical Service and CDS (Clinical Decision Support) Service work together to create a comprehensive, safe healthcare system:

```
┌────────────────────────────────────────────────────────────────┐
│              INTEGRATED CLINICAL SAFETY SYSTEM                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────┐     │
│  │  Clinical Service   │◄───────►│   CDS Service        │     │
│  │  (Port 3004)        │         │   (Port 4002)        │     │
│  │                     │         │                      │     │
│  │ • Patient Data      │         │ • Drug Interactions  │     │
│  │ • Prescriptions     │────────►│ • Allergy Alerts     │     │
│  │ • Encounters        │         │ • Dose Validation    │     │
│  │ • Diagnostics       │         │ • Contraindications  │     │
│  │                     │◄────────│ • Clinical Guidelines│     │
│  └─────────────────────┘         └──────────────────────┘     │
│           │                                  │                  │
│           │ Events                          │ Alerts           │
│           ▼                                  ▼                  │
│  ┌─────────────────────┐         ┌──────────────────────┐     │
│  │      Kafka          │         │   Real-time Alerts   │     │
│  │  Event Streaming    │         │   (WebSocket)        │     │
│  └─────────────────────┘         └──────────────────────┘     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Integration Workflows

#### 1️⃣ **Medication Prescription Flow**

```
Doctor prescribes medication (Clinical Service)
         ↓
Clinical Service calls CDS Service API
         ↓
CDS Service performs safety checks:
  • Drug-drug interactions
  • Patient allergies
  • Contraindications
  • Dose validation
         ↓
CDS Service returns safety assessment
         ↓
If HIGH RISK → CDS broadcasts real-time alert
         ↓
Clinical Service shows warnings to doctor
         ↓
Doctor reviews and confirms/modifies prescription
         ↓
Clinical Service saves prescription
         ↓
Clinical Service publishes "medication.prescribed" event
         ↓
Other services react to event
```

#### 2️⃣ **Real-time Clinical Alerts**

```
CDS Service detects critical issue
         ↓
Broadcasts WebSocket alert to:
  • Patient's care team
  • Prescribing physician
  • Pharmacy
         ↓
Clinical Service UI shows alert badge
         ↓
Healthcare provider takes action
```

#### 3️⃣ **Event-Driven Integration**

```
Clinical Service Event          CDS Service Reaction
────────────────────────────────────────────────────────
patient.created          →      Cache patient allergies
patient.updated          →      Update contraindication checks
medication.prescribed    →      Analyze new prescription
medication.updated       →      Re-validate dosage
medication.discontinued  →      Clear alerts
encounter.created        →      Review active medications
diagnostic.created       →      Check for drug-test interactions
```

### API Integration Points

#### **Clinical Service → CDS Service**

```typescript
// In MedicationController (Clinical Service)
async prescribeMedication(req, res) {
  const medicationData = req.body;
  const patient = await patientService.getPatient(medicationData.patientId);
  
  // 🔍 CALL CDS SERVICE FOR SAFETY CHECK
  const safetyCheck = await axios.post('http://cds-service:4002/api/v1/check-medication', {
    patientId: patient.id,
    medications: [...patient.activeMedications, medicationData],
    allergies: patient.allergies,
    conditions: patient.conditions
  }, {
    headers: { Authorization: req.headers.authorization }
  });
  
  // ⚠️ HANDLE SAFETY WARNINGS
  if (safetyCheck.data.overallRisk.level === 'high') {
    return res.status(400).json({
      success: false,
      error: 'High-risk prescription detected',
      safetyAssessment: safetyCheck.data,
      requiresOverride: true
    });
  }
  
  // ✅ SAFE TO PRESCRIBE
  const prescription = await medicationService.create(medicationData);
  
  // 📢 PUBLISH EVENT
  await eventPublisher.publishEvent('medication.prescribed', {
    patientId: patient.id,
    medicationId: prescription.id,
    prescribedBy: req.user.userId
  });
  
  res.status(201).json({ success: true, data: prescription });
}
```

### Shared Authentication

Both services use the **same shared authentication middleware**:

```typescript
// ✅ Clinical Service
import { authenticate, requireRole } from '../../../shared/middleware/auth';

// ✅ CDS Service  
import { authenticate as authMiddleware } from '../../shared/middleware/auth';

// Both verify the same JWT tokens from auth-service
```

### Event Topics

Clinical Service publishes events that CDS Service can consume:

| Event Topic | Events | CDS Service Use |
|-------------|--------|-----------------|
| `patient-events` | patient.created, patient.updated | Update patient allergy cache |
| `medication-events` | medication.prescribed, medication.updated | Trigger interaction checks |
| `encounter-events` | encounter.created, encounter.completed | Review active treatment |
| `diagnostic-events` | diagnostic.created, diagnostic.updated | Drug-test interactions |
| `vital-signs-events` | vital.signs.recorded | Monitor medication efficacy |

## 🔌 API Endpoints

### Patient Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/patients` | GET | ✅ | List all patients (paginated) |
| `/api/v1/patients/:id` | GET | ✅ | Get patient by ID |
| `/api/v1/patients` | POST | ✅ | Create new patient |
| `/api/v1/patients/:id` | PUT | ✅ | Update patient |
| `/api/v1/patients/:id` | DELETE | ✅ | Delete patient (admin only) |
| `/api/v1/patients/:id/encounters` | GET | ✅ | Get patient encounters |

### Encounter Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/encounters` | GET | ✅ | List all encounters |
| `/api/v1/encounters/:id` | GET | ✅ | Get encounter by ID |
| `/api/v1/encounters` | POST | ✅ | Create new encounter |
| `/api/v1/encounters/:id` | PUT | ✅ | Update encounter |
| `/api/v1/encounters/:id/complete` | PATCH | ✅ | Complete encounter |

### Medication Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/medications` | GET | ✅ | List all medications |
| `/api/v1/medications/:id` | GET | ✅ | Get medication by ID |
| `/api/v1/medications` | POST | ✅ | Prescribe medication |
| `/api/v1/medications/:id` | PUT | ✅ | Update medication |
| `/api/v1/medications/:id/discontinue` | PATCH | ✅ | Discontinue medication |

### Diagnostic Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/diagnostics` | GET | ✅ | List all diagnostics |
| `/api/v1/diagnostics/:id` | GET | ✅ | Get diagnostic by ID |
| `/api/v1/diagnostics` | POST | ✅ | Order diagnostic test |
| `/api/v1/diagnostics/:id` | PUT | ✅ | Update diagnostic |
| `/api/v1/diagnostics/:id/results` | PATCH | ✅ | Add test results |

### FHIR Resources

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/fhir/Patient` | GET | ✅ | Get FHIR Patient resources |
| `/api/v1/fhir/Patient/:id` | GET | ✅ | Get FHIR Patient by ID |
| `/api/v1/fhir/Patient` | POST | ✅ | Create FHIR Patient |
| `/api/v1/fhir/Patient/:id` | PUT | ✅ | Update FHIR Patient |
| `/api/v1/fhir/Encounter` | GET | ✅ | Get FHIR Encounter resources |
| `/api/v1/fhir/Encounter/:id` | GET | ✅ | Get FHIR Encounter by ID |
| `/api/v1/fhir/metadata` | GET | ❌ | FHIR CapabilityStatement |

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe (checks DB) |
| `/health/startup` | GET | Startup probe |
| `/metrics` | GET | Prometheus metrics |
| `/api-docs` | GET | Swagger documentation |

## 📝 API Usage Examples

### Create Patient

```bash
POST /api/v1/patients
Authorization: Bearer <TOKEN>

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1980-05-15",
  "gender": "male",
  "phoneNumber": "+1-555-123-4567",
  "email": "john.doe@example.com",
  "address": {
    "street": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  },
  "allergies": ["Penicillin", "Peanuts"],
  "medicalHistory": ["Hypertension", "Type 2 Diabetes"]
}
```

### Prescribe Medication (with CDS Integration)

```bash
POST /api/v1/medications
Authorization: Bearer <TOKEN>

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "twice daily",
  "route": "oral",
  "startDate": "2025-10-14T10:00:00Z",
  "instructions": "Take with meals",
  "prescribedBy": "doctor-uuid"
}

# Clinical Service will:
# 1. Call CDS Service to check safety
# 2. Return warnings if any interactions found
# 3. Save prescription if safe
# 4. Publish "medication.prescribed" event
```

### Create Encounter

```bash
POST /api/v1/encounters
Authorization: Bearer <TOKEN>

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "providerId": "doctor-uuid",
  "encounterType": "outpatient",
  "startDate": "2025-10-14T14:00:00Z",
  "chiefComplaint": "Annual physical examination",
  "vitalSigns": {
    "bloodPressure": {
      "systolic": 120,
      "diastolic": 80
    },
    "heartRate": 72,
    "temperature": 98.6,
    "respiratoryRate": 16,
    "oxygenSaturation": 98,
    "weight": 75,
    "height": 175
  }
}
```

## 🔐 Authentication & Authorization

### JWT Authentication

All endpoints (except health checks and FHIR metadata) require JWT authentication:

```bash
Authorization: Bearer <JWT_TOKEN>
```

Token obtained from `auth-service` and includes:
- `userId` - User identifier
- `role` - User role (doctor, nurse, admin, etc.)
- `organizationId` - Organization context
- `permissions` - Granular permissions

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **doctor** | Full clinical access, prescribe medications, complete encounters |
| **nurse** | Patient care, vital signs, assist with prescriptions |
| **admin** | Full system access, patient deletion, user management |
| **pharmacist** | View medications, mark as dispensed |
| **technician** | Diagnostic tests, add results |

### Permission System

Fine-grained permissions:
- `patients:create`, `patients:read`, `patients:update`, `patients:delete`
- `encounters:create`, `encounters:update`, `encounters:complete`
- `medications:prescribe`, `medications:update`, `medications:discontinue`
- `diagnostics:order`, `diagnostics:add-results`
- `fhir:read`, `fhir:write`

## 🔄 Real-time Updates (WebSocket)

### Connect to WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3004', {
  auth: {
    token: '<JWT_TOKEN>'
  }
});

// Join patient-specific room
socket.emit('join-patient-room', 'patient-uuid');

// Listen for patient updates
socket.on('patient:updated', (data) => {
  console.log('Patient updated:', data);
});

// Listen for new encounter
socket.on('encounter:created', (data) => {
  console.log('New encounter:', data);
});

// Listen for medication prescribed
socket.on('medication:prescribed', (data) => {
  console.log('Medication prescribed:', data);
  // Could trigger CDS check here
});

// Listen for emergency alerts (from CDS)
socket.on('emergency:alert', (alert) => {
  console.log('EMERGENCY:', alert);
  // Show critical UI notification
});
```

### Available Events

| Event | Description | Data |
|-------|-------------|------|
| `patient:created` | New patient registered | Patient object |
| `patient:updated` | Patient info changed | Updated patient |
| `encounter:created` | New encounter started | Encounter object |
| `encounter:updated` | Encounter modified | Updated encounter |
| `medication:prescribed` | New medication | Medication object |
| `medication:updated` | Medication changed | Updated medication |
| `diagnostic:created` | Test ordered | Diagnostic object |
| `vital:signs:recorded` | Vitals recorded | Vital signs data |
| `emergency:alert` | Critical alert | Alert details |

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3004
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare
DB_PASSWORD=secure_password

# Authentication
JWT_SECRET=your-jwt-secret-key
AUTH_SERVICE_URL=http://localhost:4000

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=clinical-service
KAFKA_GROUP_ID=clinical-service-group

# External Service URLs
CDS_SERVICE_URL=http://localhost:4002
BILLING_SERVICE_URL=http://localhost:4003

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/clinical-service.log

# Feature Flags
ENABLE_FHIR=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_CDS_INTEGRATION=true
ENABLE_EVENT_PUBLISHING=true
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Kafka (optional, for event streaming)
- Auth Service running (for authentication)

### Installation

1. **Navigate to service directory:**
```bash
cd microservices/clinical
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database:**
```bash
# Create database
createdb nilecare

# Run schema (if available)
psql -U postgres -d nilecare -f database/schema.sql
```

5. **Start the service:**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### Development Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3004/health
```

### Create Patient Test
```bash
curl -X POST http://localhost:3004/api/v1/patients \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "dateOfBirth": "1990-01-01",
    "gender": "female",
    "phoneNumber": "+1-555-999-8888"
  }'
```

## 🏗️ Project Structure

```
clinical/
├── src/
│   ├── index.ts                    # Main application entry
│   ├── controllers/                # Request handlers
│   │   ├── PatientController.ts
│   │   ├── EncounterController.ts
│   │   ├── MedicationController.ts
│   │   ├── DiagnosticController.ts
│   │   └── FHIRController.ts
│   ├── services/                   # Business logic
│   │   ├── PatientService.ts
│   │   ├── EncounterService.ts
│   │   ├── MedicationService.ts
│   │   ├── DiagnosticService.ts
│   │   └── FHIRService.ts
│   ├── routes/                     # API routes
│   │   ├── patients.ts
│   │   ├── encounters.ts
│   │   ├── medications.ts
│   │   ├── diagnostics.ts
│   │   └── fhir.ts
│   ├── middleware/                 # Express middleware
│   │   ├── auth.ts (deprecated - use shared)
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── events/                     # Event handling
│   │   ├── EventPublisher.ts
│   │   └── handlers.ts
│   ├── models/                     # Data models
│   └── utils/                      # Utilities
│       └── logger.ts
├── tests/                          # Test files
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 📊 Database Schema

### Key Tables

#### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  -- Address fields
  address_street VARCHAR(100),
  address_city VARCHAR(50),
  address_state VARCHAR(50),
  address_zip_code VARCHAR(20),
  address_country VARCHAR(50),
  -- Emergency contact
  emergency_contact_name VARCHAR(100),
  emergency_contact_relationship VARCHAR(50),
  emergency_contact_phone VARCHAR(20),
  -- Medical info
  medical_history TEXT[],
  allergies TEXT[],
  medications TEXT[],
  -- Multi-tenancy
  organization_id UUID NOT NULL,
  -- Audit fields
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🤝 Integration with Other Services

### Service Dependencies

```
┌─────────────────────────────────────────────────┐
│           Clinical Service (Core)               │
├─────────────────────────────────────────────────┤
│                                                  │
│  Depends on:                                     │
│  • auth-service (authentication)                │
│  • cds-service (safety checks) ◄── KEY!        │
│                                                  │
│  Publishes events to:                           │
│  • billing-service (via Kafka)                  │
│  • notification-service (via Kafka)             │
│  • analytics-service (via Kafka)                │
│                                                  │
│  Consumed by:                                    │
│  • web-dashboard (UI)                           │
│  • mobile-app (future)                          │
│  • external EHR systems (FHIR)                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

## ⚠️ Important Notes

### Current Implementation Status

**✅ Fully Implemented:**
- Patient CRUD operations
- PostgreSQL database integration
- Event publishing (Kafka)
- Authentication middleware (shared)
- Health checks & monitoring
- Swagger documentation
- Real-time WebSocket support
- FHIR route structure

**🟡 Partially Implemented:**
- Encounter management (controller/routes exist, service needed)
- Medication management (controller/routes exist, service needed)
- Diagnostic management (controller/routes exist, service needed)
- FHIR transformation (routes exist, full implementation needed)

**❌ Not Implemented:**
- CDS Service integration calls
- Complete service layer for all resources
- Database migrations
- Comprehensive testing
- FHIR validation

### Healthcare Compliance

**HIPAA Compliance Required:**
- All PHI must be encrypted at rest and in transit
- Audit logging for all data access
- Access controls and authentication
- Data retention policies
- Breach notification procedures

## 📄 License

MIT License

## 👥 Support

For issues or questions:
- Review documentation
- Check integration guides
- Contact: NileCare Development Team

---

**🔗 Related Documentation:**
- [CDS Service README](../cds-service/README.md)
- [CDS Integration Guide](./CDS_INTEGRATION_GUIDE.md)
- [Authentication Guide](../../shared/middleware/AUTH.md)
- [Event Schema](./EVENTS.md)

