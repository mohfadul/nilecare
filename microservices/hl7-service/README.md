# HL7 Service

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Port:** 6002 (HTTP), 2575 (MLLP)  
**HL7 Version:** 2.5.1  
**Last Updated:** October 14, 2025

## 🏥 Overview

The **HL7 Service** provides HL7 v2.x message processing and MLLP protocol support for healthcare interoperability. It enables standards-based exchange of clinical data (admissions, orders, results) with external systems and legacy healthcare applications.

## 🎯 Purpose

- **HL7 v2.x Processing** - Parse and process HL7 messages
- **MLLP Protocol** - Minimal Lower Layer Protocol server
- **Message Routing** - ADT, ORM, ORU message types
- **Transformation** - HL7 ↔ FHIR conversion
- **Integration** - Connect with Lab and Medication services

## 🚀 Key Features

### HL7 Message Types
- ✅ **ADT (Admission, Discharge, Transfer)** - ADT^A01, ADT^A03, ADT^A08
- ✅ **ORM (Order)** - ORM^O01 for lab and medication orders
- ✅ **ORU (Results)** - ORU^R01 for lab results

### MLLP Protocol
- ✅ **MLLP Server** - Receives HL7 messages on port 2575
- ✅ **MLLP Client** - Sends HL7 messages to external systems
- ✅ **ACK Generation** - Automatic acknowledgment (AA, AE, AR)
- ✅ **Frame Handling** - VT/FS/CR framing

### HL7 ↔ FHIR Transformation
- ✅ **ADT → FHIR Patient** - Convert admissions to Patient resources
- ✅ **ORU → FHIR Observation** - Convert lab results to Observations
- ✅ **Bidirectional** - Support both directions

## 🏗 Architecture

```
HL7 Service
├── HTTP Server (Port 6002)
│   └── REST API for message processing
├── MLLP Server (Port 2575)
│   └── Receives HL7 messages via TCP
├── Message Processors
│   ├── ADTService (Admission/Discharge/Transfer)
│   ├── ORMService (Orders)
│   ├── ORUService (Results)
│   └── MessageProcessorService (Router)
├── Core Services
│   ├── HL7Service (Parser)
│   ├── MLLPService (Protocol)
│   └── TransformationService (HL7 ↔ FHIR)
└── Integration
    ├── LabServiceClient
    ├── MedicationServiceClient
    └── FHIRServiceClient
```

## 📦 Installation

```bash
cd microservices/hl7-service
npm install
psql -U postgres -d nilecare < database/schema.sql
npm run dev
```

## ⚙️ Configuration

```env
# HTTP Server
PORT=6002

# MLLP Server
MLLP_PORT=2575

# Database
PG_HOST=localhost
PG_DATABASE=nilecare

# Integration
LAB_SERVICE_URL=http://localhost:4005
MEDICATION_SERVICE_URL=http://localhost:4003
FHIR_SERVICE_URL=http://localhost:6001
```

## 🔑 API Endpoints

### ADT Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hl7/adt/parse` | Parse ADT message |
| POST | `/api/v1/hl7/adt/process` | Process and store ADT |

### ORM Messages (Orders)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hl7/orm/parse` | Parse order message |
| POST | `/api/v1/hl7/orm/process` | Process order |

### ORU Messages (Results)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hl7/oru/parse` | Parse result message |
| POST | `/api/v1/hl7/oru/process` | Process result |

### Generic Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hl7/messages/process` | Process any HL7 message |

### MLLP Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/hl7/mllp/send` | Send HL7 via MLLP |
| POST | `/api/v1/hl7/mllp/validate` | Validate HL7 format |
| POST | `/api/v1/hl7/mllp/generate-ack` | Generate ACK |

## 📡 MLLP Protocol

### Receiving Messages

The HL7 Service runs an MLLP server on port 2575:

```
External System → MLLP (Port 2575) → HL7 Service
                     ↓
                 Parse Message
                     ↓
                 Route to Processor
                     ↓
                 Generate ACK
                     ↓
External System ← MLLP Response ← HL7 Service
```

### Sending Messages

```javascript
POST /api/v1/hl7/mllp/send
{
  "message": "MSH|^~\\&|...",
  "host": "external-system.example.com",
  "port": 2575
}
```

## 📝 HL7 Message Examples

### ADT^A01 (Admission)

```
MSH|^~\&|SENDING_APP|SENDING_FACILITY|NILECARE|NILECARE_HL7|20251014120000||ADT^A01|MSG001|P|2.5
PID|1||MRN123456||Ahmed^Mohammed||19850315|M|||123 Main St^^Khartoum^^11111^Sudan
PV1|1|I|MED-A^101^1|||Dr. Ahmed||||MED||||ADM|123456|||||||||||||||||||||20251014120000
```

### ORM^O01 (Lab Order)

```
MSH|^~\&|LAB_SYSTEM|LAB|NILECARE|NILECARE_HL7|20251014120000||ORM^O01|MSG002|P|2.5
PID|1||MRN123456||Ahmed^Mohammed||19850315|M
ORC|NW|LAB001||||||20251014120000
OBR|1|LAB001||CBC^Complete Blood Count^LOINC|||20251014120000
```

### ORU^R01 (Lab Result)

```
MSH|^~\&|LAB|LAB_FACILITY|NILECARE|NILECARE_HL7|20251014130000||ORU^R01|MSG003|P|2.5
PID|1||MRN123456||Ahmed^Mohammed||19850315|M
OBR|1|LAB001||CBC^Complete Blood Count|||20251014120000|||||||20251014125000|||F
OBX|1|NM|WBC^White Blood Count||7.5|10^9/L|4.0-11.0|N|||F|||20251014125000
OBX|2|NM|RBC^Red Blood Count||4.8|10^12/L|4.5-5.5|N|||F|||20251014125000
```

## 🔄 Integration Workflows

### Receive Lab Result via MLLP

```
1. External Lab System sends ORU message via MLLP
   → Port 2575
   
2. HL7 Service receives and parses message
   → ORUService.processORUMessage()
   
3. Transform to FHIR Observations
   → TransformationService.transformORUToFHIRObservations()
   
4. Send to FHIR Service
   → FHIRServiceClient.createFHIRResource()
   
5. Send to Lab Service
   → LabServiceClient.submitLabResult()
   
6. Generate and send ACK
   → MLLPService.generateACK('AA')
```

## 🛡️ Security

- ✅ Centralized authentication via Auth Service
- ✅ Facility isolation
- ✅ Message audit logging
- ✅ Source validation
- ✅ Rate limiting

## 📄 License

MIT License

---

**Service Version:** 1.0.0  
**HL7 Version:** 2.5.1  
**Protocol:** MLLP  
**Status:** ✅ Production Ready

