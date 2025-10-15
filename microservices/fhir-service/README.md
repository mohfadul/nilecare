# FHIR Service

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Port:** 6001  
**FHIR Version:** R4  
**Last Updated:** October 14, 2025

## 🏥 Overview

The **FHIR Service** provides HL7 FHIR R4 compliant interoperability for the NileCare platform. It enables standards-based exchange of healthcare data with external systems, EHR integration, and SMART on FHIR application support.

## 🎯 Purpose

- **FHIR R4 Compliance** - Standards-based healthcare data exchange
- **Interoperability** - Connect with external EHR systems
- **SMART on FHIR** - OAuth2 authorization for third-party apps
- **Bulk Data Export** - Large-scale data export ($export operation)
- **Resource Management** - Patient, Observation, Condition, MedicationRequest, Encounter

## 🚀 Key Features

### FHIR R4 Resources
- ✅ **Patient** - Demographics and identifiers
- ✅ **Observation** - Vital signs and lab results
- ✅ **Condition** - Diagnoses and problems
- ✅ **MedicationRequest** - E-prescriptions
- ✅ **Encounter** - Healthcare visits

### FHIR Operations
- ✅ **CRUD Operations** - Create, read, update, delete
- ✅ **Search** - FHIR search parameters
- ✅ **Bundle** - Batch and transaction operations
- ✅ **History** - Resource version history
- ✅ **Bulk Data Export** - $export operation

### SMART on FHIR
- ✅ **OAuth2 Authorization** - Standards-based auth
- ✅ **Client Registration** - Dynamic client registration
- ✅ **Scopes** - patient/*.read, user/*.write, etc.
- ✅ **Launch Contexts** - EHR launch and standalone launch

## 🏗 Architecture

```
FHIR Service (Port 6001)
├── Services
│   ├── FHIRService (Patient operations)
│   ├── ResourceService (Generic FHIR CRUD)
│   ├── ObservationService
│   ├── ConditionService
│   ├── MedicationRequestService
│   ├── EncounterService
│   ├── BulkDataService ($export)
│   └── SMARTService (OAuth2)
├── Integration Clients
│   ├── ClinicalServiceClient
│   ├── LabServiceClient
│   └── MedicationServiceClient
└── Middleware
    ├── FHIR Validator
    ├── Error Handler (OperationOutcome)
    └── Rate Limiting
```

## 📦 Installation

```bash
cd microservices/fhir-service
npm install
psql -U postgres -d nilecare < database/schema.sql
npm run dev
```

## ⚙️ Configuration

```env
PORT=6001
PG_HOST=localhost
PG_DATABASE=nilecare
MONGO_URI=mongodb://localhost:27017/nilecare
REDIS_HOST=localhost
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-api-key
```

## 🔑 API Endpoints

### FHIR RESTful API

| Resource | Endpoint | Operations |
|----------|----------|-----------|
| Patient | `/fhir/Patient` | GET, POST, PUT, DELETE |
| Observation | `/fhir/Observation` | GET, POST, PUT, DELETE |
| Condition | `/fhir/Condition` | GET, POST, PUT, DELETE |
| MedicationRequest | `/fhir/MedicationRequest` | GET, POST, PUT, DELETE |
| Encounter | `/fhir/Encounter` | GET, POST, PUT, DELETE |

### FHIR Operations

- `POST /fhir` - Bundle operations (batch/transaction)
- `GET /fhir/metadata` - Capability Statement
- `POST /fhir/$export` - Bulk data export

### SMART on FHIR

- `GET /.well-known/smart-configuration` - SMART configuration
- `POST /oauth2/register` - Client registration
- `GET /oauth2/authorize` - Authorization endpoint
- `POST /oauth2/token` - Token endpoint

## 📝 FHIR Examples

### Create Patient

```json
POST /fhir/Patient
{
  "resourceType": "Patient",
  "identifier": [{
    "system": "http://nilecare.sd/mrn",
    "value": "MRN123456"
  }],
  "name": [{
    "family": "Ahmed",
    "given": ["Mohammed"]
  }],
  "gender": "male",
  "birthDate": "1985-03-15"
}
```

### Search Patients

```bash
GET /fhir/Patient?name=Ahmed&birthdate=1985-03-15
```

### Create Observation

```json
POST /fhir/Observation
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "vital-signs"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "8867-4",
      "display": "Heart rate"
    }]
  },
  "subject": {
    "reference": "Patient/123"
  },
  "valueQuantity": {
    "value": 80,
    "unit": "beats/minute",
    "system": "http://unitsofmeasure.org",
    "code": "/min"
  }
}
```

## 🔒 Security

- ✅ OAuth2 + SMART on FHIR authorization
- ✅ Centralized authentication via Auth Service
- ✅ Facility isolation
- ✅ Resource-level access control
- ✅ Audit logging (HIPAA compliant)

## 📄 License

MIT License

---

**Service Version:** 1.0.0  
**FHIR Version:** R4 (4.0.1)  
**Status:** ✅ Production Ready

