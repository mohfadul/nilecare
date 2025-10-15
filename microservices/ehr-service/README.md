# EHR (Electronic Health Records) Service

## 🏥 Overview

The **EHR Service** is a specialized healthcare microservice dedicated to managing electronic health records, clinical documentation, SOAP notes, problem lists, progress notes, and comprehensive medical history. It serves as the clinical documentation backbone of the NileCare healthcare platform.

## 🎯 Purpose

This service manages all clinical documentation and medical record keeping:

- **Electronic Health Records** - Complete digital patient health records
- **SOAP Notes** - Subjective, Objective, Assessment, Plan clinical notes
- **Problem Lists** - Active and historical patient problems/diagnoses
- **Progress Notes** - Ongoing treatment progress documentation
- **Clinical Documents** - All clinical documentation and attachments
- **Medical History** - Comprehensive patient medical histories
- **Document Export** - PDF/XML/HTML export for sharing and printing

## 🚀 Key Features

### Clinical Documentation
- ✅ **SOAP Notes** - Structured clinical documentation (S-O-A-P format)
- ✅ **Progress Notes** - Track patient progress over time
- ✅ **Problem Lists** - Active/inactive problem tracking with ICD codes
- ✅ **Clinical Documents** - Secure document storage and retrieval
- ✅ **Medical History** - Comprehensive patient history management
- ✅ **Document Versioning** - Track changes and amendments
- ✅ **Electronic Signatures** - Digital signing of clinical documents

### Technical Capabilities
- ✅ **FHIR R4 Compliant** - HL7 FHIR DocumentReference support
- ✅ **HL7 Integration** - HL7 v2/v3 message support
- ✅ **Real-time Updates** - Socket.IO for live document updates
- ✅ **Document Export** - PDF, HTML, XML export formats
- ✅ **RESTful API** - Comprehensive HTTP endpoints
- ✅ **Audit Trail** - Complete audit logging for all changes
- ✅ **Multi-format Support** - Structured and unstructured documents

## 📊 Architecture

### Service Components

```
┌─────────────────────────────────────────────────────────────┐
│                  EHR Service (Port 4001)                     │
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
│  │ • EHRController                                       │  │
│  │ • SOAPNotesController                                 │  │
│  │ • ProblemListController                               │  │
│  │ • ProgressNotesController                             │  │
│  │ • ClinicalDocumentController                          │  │
│  │ • MedicalHistoryController                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services Layer                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • SOAPNotesService                                    │  │
│  │ • ProblemListService                                  │  │
│  │ • ProgressNotesService                                │  │
│  │ • DocumentService                                     │  │
│  │ • ExportService (PDF/HTML/XML)                        │  │
│  │ • FHIRTransformationService                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Stores                              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • PostgreSQL (Structured EHR data)                   │  │
│  │ • MongoDB (Document storage)                         │  │
│  │ • S3/MinIO (File attachments)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integration with Clinical + CDS Services

### **THE TRIO: EHR + Clinical + CDS**

```
┌────────────────────────────────────────────────────────────────┐
│              INTEGRATED HEALTHCARE PLATFORM                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     │
│  │ Clinical    │────►│ EHR Service │◄────│ CDS Service │     │
│  │ Service     │     │ (Port 4001) │     │ (Port 4002) │     │
│  │ (Port 3004) │     │             │     │             │     │
│  │             │     │ • SOAP      │     │ • Safety    │     │
│  │ • Patients  │     │ • Progress  │     │ • Alerts    │     │
│  │ • Encounters│────►│ • Problems  │     │ • Guide     │     │
│  │ • Meds      │     │ • Documents │     │             │     │
│  └─────────────┘     └─────────────┘     └─────────────┘     │
│        │                    │                    │             │
│        └────────────────────┴────────────────────┘             │
│                           │                                     │
│                      Shared Data                               │
│                   Patient Records                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Integration Workflows

#### 1️⃣ **Clinical Encounter Documentation Flow**

```
Doctor sees patient → Clinical Service (Encounter created)
         ↓
Doctor documents visit → EHR Service (SOAP note created)
         ↓
SOAP Note includes:
  • Subjective: Patient complaints
  • Objective: Vital signs, exam findings
  • Assessment: Diagnosis (linked to Problem List)
  • Plan: Treatment plan (may trigger CDS checks)
         ↓
If medications prescribed → CDS Service validates
         ↓
All documentation saved in EHR
         ↓
Real-time updates to clinical team via WebSocket
```

#### 2️⃣ **Problem List Management**

```
New diagnosis identified
         ↓
EHR Service adds to Problem List
         ↓
Problem List includes:
  • Active problems
  • Inactive/resolved problems
  • ICD-10 codes
  • Onset dates
         ↓
CDS Service uses Problem List for:
  • Contraindication checks
  • Clinical guidelines
  • Drug-disease interactions
```

#### 3️⃣ **Document Flow**

```
Clinical Data Created (any service)
         ↓
EHR Service stores/retrieves documents
         ↓
Provides:
  • Document versioning
  • Audit trail
  • Export (PDF, HTML, XML)
  • FHIR transformation
```

### API Integration Points

#### **Clinical Service → EHR Service**

```typescript
// In Clinical Service - After encounter completed
async completeEncounter(encounterId) {
  // Update encounter status
  await encounterService.complete(encounterId);
  
  // 📝 CREATE SOAP NOTE IN EHR
  await axios.post('http://ehr-service:4001/api/v1/soap-notes', {
    encounterId,
    patientId,
    subjective: encounterData.chiefComplaint,
    objective: encounterData.vitalSigns,
    assessment: encounterData.diagnosis,
    plan: encounterData.treatmentPlan
  }, {
    headers: { Authorization: authToken }
  });
}
```

#### **CDS Service → EHR Service**

```typescript
// In CDS Service - Check contraindications using problem list
async checkContraindications(patientId, medication) {
  // 📋 GET PROBLEM LIST FROM EHR
  const problemList = await axios.get(
    `http://ehr-service:4001/api/v1/problem-lists/patient/${patientId}`,
    { headers: { Authorization: serviceToken } }
  );
  
  // Check if medication is contraindicated for any active problems
  const contraindications = checkAgainstProblems(
    medication,
    problemList.data.activeProblems
  );
  
  return contraindications;
}
```

## 🔌 API Endpoints

### SOAP Notes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/soap-notes` | GET | ✅ | List all SOAP notes |
| `/api/v1/soap-notes/:id` | GET | ✅ | Get SOAP note by ID |
| `/api/v1/soap-notes` | POST | ✅ | Create new SOAP note |
| `/api/v1/soap-notes/:id` | PUT | ✅ | Update SOAP note |
| `/api/v1/soap-notes/:id/finalize` | PATCH | ✅ | Finalize SOAP note |
| `/api/v1/soap-notes/:id/amend` | PATCH | ✅ | Amend finalized note |
| `/api/v1/soap-notes/:id/export` | GET | ✅ | Export to PDF/HTML/XML |

### Problem Lists

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/problem-lists` | GET | ✅ | List all problems |
| `/api/v1/problem-lists/patient/:id` | GET | ✅ | Get patient's problem list |
| `/api/v1/problem-lists` | POST | ✅ | Add new problem |
| `/api/v1/problem-lists/:id` | PUT | ✅ | Update problem |
| `/api/v1/problem-lists/:id/resolve` | PATCH | ✅ | Mark problem as resolved |
| `/api/v1/problem-lists/:id/activate` | PATCH | ✅ | Reactivate problem |

### Progress Notes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/progress-notes` | GET | ✅ | List all progress notes |
| `/api/v1/progress-notes/:id` | GET | ✅ | Get progress note by ID |
| `/api/v1/progress-notes` | POST | ✅ | Create progress note |
| `/api/v1/progress-notes/:id` | PUT | ✅ | Update progress note |
| `/api/v1/progress-notes/:id/sign` | PATCH | ✅ | Sign progress note |

### Clinical Documents

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/clinical-documents` | GET | ✅ | List all documents |
| `/api/v1/clinical-documents/:id` | GET | ✅ | Get document by ID |
| `/api/v1/clinical-documents` | POST | ✅ | Upload document |
| `/api/v1/clinical-documents/:id` | DELETE | ✅ | Delete document |
| `/api/v1/clinical-documents/:id/download` | GET | ✅ | Download document |

### Medical History

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/medical-history/patient/:id` | GET | ✅ | Get patient medical history |
| `/api/v1/medical-history` | POST | ✅ | Add medical history entry |
| `/api/v1/medical-history/:id` | PUT | ✅ | Update history entry |

### EHR Records

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/ehr/patient/:id` | GET | ✅ | Get complete EHR for patient |
| `/api/v1/ehr/patient/:id/summary` | GET | ✅ | Get EHR summary |
| `/api/v1/ehr/patient/:id/export` | GET | ✅ | Export complete EHR |

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe |
| `/health/startup` | GET | Startup probe |
| `/metrics` | GET | Prometheus metrics |
| `/api-docs` | GET | Swagger documentation |

## 📝 API Usage Examples

### Create SOAP Note

```bash
POST /api/v1/soap-notes
Authorization: Bearer <TOKEN>

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "encounterId": "encounter-uuid",
  "subjective": "Patient reports persistent headache for 3 days, worse in the morning. Denies fever, vision changes, or neck stiffness. No recent trauma.",
  "objective": "Vital signs: BP 125/80, HR 72, Temp 98.2°F, RR 16. Alert and oriented x3. No focal neurological deficits. Pupils equal and reactive. Neck supple.",
  "assessment": "Tension-type headache. Rule out migraine.",
  "plan": "1. Ibuprofen 400mg PO q6h PRN\n2. Encourage adequate hydration and rest\n3. Follow up in 1 week if not improved\n4. Return immediately if severe worsening, fever, or neurological symptoms develop",
  "noteType": "progress",
  "priority": "routine",
  "authorId": "doctor-uuid"
}
```

### Add Problem to Problem List

```bash
POST /api/v1/problem-lists
Authorization: Bearer <TOKEN>

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "problemName": "Hypertension",
  "icdCode": "I10",
  "status": "active",
  "severity": "moderate",
  "onsetDate": "2023-06-15",
  "notes": "Stage 2 hypertension, currently managed with medication",
  "relatedProblems": []
}
```

### Get Patient's Complete EHR

```bash
GET /api/v1/ehr/patient/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <TOKEN>

# Response includes:
# - All SOAP notes
# - Complete problem list
# - All progress notes
# - Medical history
# - Clinical documents
# - Timeline of care
```

### Export SOAP Note to PDF

```bash
GET /api/v1/soap-notes/note-uuid/export?format=pdf
Authorization: Bearer <TOKEN>

# Returns PDF file for download or printing
```

## 🔐 Authentication & Authorization

### JWT Authentication

All endpoints require JWT authentication:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **doctor** | Full documentation access, finalize notes, sign documents |
| **nurse** | Create/edit notes, cannot finalize |
| **admin** | Full system access, audit access |
| **billing** | Read-only access to finalized documents |
| **patient** | Read-only access to own records |

### Document States

```
draft → finalized → (optionally) amended
  ↑         ↓
  └─────────┘
  (can revert to draft before finalization)
```

## 🔄 Real-time Updates (WebSocket)

### Connect to WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4001', {
  auth: {
    token: '<JWT_TOKEN>'
  }
});

// Join patient EHR room
socket.emit('join-patient-ehr', 'patient-uuid');

// Join encounter EHR room
socket.emit('join-encounter-ehr', 'encounter-uuid');

// Listen for SOAP note created
socket.on('soap-note:created', (data) => {
  console.log('New SOAP note:', data);
  // Update UI to show new note
});

// Listen for problem list updated
socket.on('problem-list:updated', (data) => {
  console.log('Problem list changed:', data);
  // Refresh problem list display
});

// Listen for document uploaded
socket.on('document:uploaded', (data) => {
  console.log('New document:', data);
  // Add document to list
});
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=4001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ehr_service
DB_USER=ehr_user
DB_PASSWORD=secure_password

# MongoDB Configuration (for document storage)
MONGODB_URI=mongodb://localhost:27017/ehr_documents

# S3/MinIO Configuration (for file attachments)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio_access_key
S3_SECRET_KEY=minio_secret_key
S3_BUCKET=ehr-documents

# Authentication
JWT_SECRET=your-jwt-secret-key
AUTH_SERVICE_URL=http://localhost:4000

# External Service URLs
CLINICAL_SERVICE_URL=http://localhost:3004
CDS_SERVICE_URL=http://localhost:4002

# Document Export
PDF_GENERATION_ENABLED=true
ENABLE_DOCUMENT_VERSIONING=true
MAX_DOCUMENT_SIZE_MB=50

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/ehr-service.log

# Feature Flags
ENABLE_FHIR=true
ENABLE_HL7=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_AUDIT_LOGGING=true
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- MongoDB 6+ (for document storage)
- MinIO or S3 (for file attachments)
- Auth Service running

### Installation

1. **Navigate to service directory:**
```bash
cd microservices/ehr-service
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
createdb ehr_service

# Run schema (when available)
psql -U postgres -d ehr_service -f database/schema.sql
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

## 📊 Database Schema

### Key Tables

#### SOAP Notes Table
```sql
CREATE TABLE soap_notes (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  encounter_id UUID NOT NULL,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  author_id UUID NOT NULL,
  author_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  note_type VARCHAR(50),
  priority VARCHAR(20),
  tags TEXT[],
  finalized_at TIMESTAMP,
  finalized_by UUID,
  amendment_history JSONB,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Problem List Table
```sql
CREATE TABLE problem_lists (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  problem_name VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20),
  snomed_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  severity VARCHAR(20),
  onset_date DATE,
  resolved_date DATE,
  notes TEXT,
  related_problems JSONB,
  organization_id UUID NOT NULL,
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
│           EHR Service (Documentation)           │
├─────────────────────────────────────────────────┤
│                                                  │
│  Depends on:                                     │
│  • auth-service (authentication)                │
│  • clinical-service (patient/encounter data)    │
│                                                  │
│  Used by:                                        │
│  • clinical-service (documentation)             │
│  • cds-service (problem lists for checks)       │
│  • billing-service (finalized notes for coding) │
│  • web-dashboard (display records)              │
│                                                  │
│  Data Sources:                                   │
│  • Receives: Encounter data, patient data       │
│  • Provides: Clinical documentation, history    │
│                                                  │
└─────────────────────────────────────────────────┘
```

## ⚠️ Important Notes

### Current Implementation Status

**✅ Skeleton Structure:**
- Server infrastructure
- Health checks
- Authentication integration
- API endpoint structure
- WebSocket support
- Route definitions (SOAP notes example)

**❌ Not Implemented:**
- All controller implementations
- All service implementations
- Database schema
- Document export functionality
- FHIR transformation
- HL7 integration
- File upload handling
- PDF generation

**Estimated Time:** 4-6 weeks for MVP

### Healthcare Compliance

**HIPAA Compliance Critical:**
- All EHR data is PHI (Protected Health Information)
- Encryption at rest and in transit mandatory
- Comprehensive audit logging required
- Access controls must be strictly enforced
- Document retention policies must be implemented
- Breach notification procedures required
- Patient access rights (view/download own records)

### Document Finalization

Once finalized, documents typically cannot be edited - only amended:
```
draft ──[finalize]──> finalized ──[amend]──> amended
                            ↓
                      (locked from editing)
                      (can only add amendments)
```

## 📄 License

MIT License

## 👥 Support

For issues or questions:
- Review documentation
- Check integration guides
- Contact: NileCare Development Team

---

**🔗 Related Documentation:**
- [Clinical Service README](../clinical/README.md)
- [CDS Service README](../cds-service/README.md)
- [Clinical-CDS Integration Guide](../clinical/CDS_INTEGRATION_GUIDE.md)
- [Authentication Guide](../../shared/middleware/AUTH.md)

---

**⚠️ Note:** This service handles the most sensitive patient data. All clinical documentation must comply with healthcare regulations and professional standards.

