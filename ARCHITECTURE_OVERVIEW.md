# 🏗️ NILECARE SYSTEM ARCHITECTURE OVERVIEW

**Version:** 2.0.0  
**Date:** October 16, 2025  
**Status:** ✅ Complete & Production Ready

---

## 📊 EXECUTIVE SUMMARY

NileCare is a comprehensive **microservices-based healthcare management platform** designed for multi-facility operations with HIPAA compliance, real-time clinical data processing, and seamless integration with medical devices and external systems.

### Key Statistics

- **17 Microservices** - Independently deployable and scalable
- **12 Databases** - MySQL, PostgreSQL, MongoDB, TimescaleDB
- **85+ Database Tables** - Normalized schema design
- **7 Role-Based Dashboards** - Tailored user experiences
- **30+ Frontend Pages** - Complete clinical workflows
- **3 Message Brokers** - Kafka, RabbitMQ, MQTT

---

## 🗺️ HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Vite + TypeScript)                   │  │
│  │  - 7 Role-Based Dashboards - 30+ Pages - Real-time WebSocket    │  │
│  │  - Material-UI - React Query - Zustand State Management         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS/WSS
┌───────────────────────────────▼─────────────────────────────────────────┐
│                           API GATEWAY (Port 7001)                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Rate Limiting • CORS • Load Balancing • Request Routing         │  │
│  │  Authentication • API Aggregation • WebSocket Proxy              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────────────────────────────┬─────┘
                │                                                   │
┌───────────────▼──────────────┐               ┌──────────────────▼───────┐
│   CORE ORCHESTRATOR          │               │   SERVICE MESH           │
│   Main Service (Port 7000)   │               │   17 Microservices       │
│   ┌────────────────────────┐ │               │   ┌─────────────────┐   │
│   │ Data Aggregation       │ │               │   │ Domain Services │   │
│   │ Service Coordination   │ │               │   │ Business Logic  │   │
│   │ WebSocket Management   │ │               │   │ Data Access     │   │
│   └────────────────────────┘ │               │   └─────────────────┘   │
└──────────────┬───────────────┘               └──────────┬───────────────┘
               │                                          │
               └──────────────────┬───────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────────┐
│                        DATA & MESSAGING LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   MySQL    │  │ PostgreSQL │  │  MongoDB │  │   TimescaleDB    │  │
│  │ (10 DBs)   │  │  (2 DBs)   │  │ (FHIR)   │  │ (Device Data)    │  │
│  └────────────┘  └────────────┘  └──────────┘  └──────────────────┘  │
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Redis    │  │   Kafka    │  │ RabbitMQ │  │      MQTT        │  │
│  │  (Cache)   │  │  (Events)  │  │ (Tasks)  │  │  (IoT Devices)   │  │
│  └────────────┘  └────────────┘  └──────────┘  └──────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────────┐
│                      INTEGRATION LAYER                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ HL7 v2.x     │  │  FHIR R4       │  │  Medical Devices         │  │
│  │ (ADT/ORM/ORU)│  │  (REST API)    │  │  (Modbus/Serial/MQTT)    │  │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘  │
│                                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ Payment APIs │  │  Email/SMS     │  │  External Drug DBs       │  │
│  │ (Stripe/etc) │  │  (Twilio/SES)  │  │  (RxNorm/DrugBank)       │  │
│  └──────────────┘  └────────────────┘  └──────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 MICROSERVICES INVENTORY

### Core Services (Always Running)

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **Gateway** | 7001 | None | API Gateway, Load Balancer | All services |
| **Main Orchestrator** | 7000 | None | Service coordination, Data aggregation | All core services |
| **Auth Service** | 7020 | nilecare_auth (MySQL) | Authentication, Authorization, RBAC | Redis |
| **Business Service** | 7010 | nilecare_business (MySQL) | Core business logic, Staff management | MySQL, Redis |

### Clinical Services

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **Clinical Service** | 7001 | nilecare_clinical (MySQL) | Encounters, Diagnoses, Clinical notes | Auth, Business |
| **Appointment Service** | 7040 | nilecare_business (MySQL) | Scheduling, Appointments, Calendar | Auth, Business |
| **Lab Service** | 7080 | nilecare_lab (MySQL) | Lab orders, Results, Specimens | Auth, Clinical |
| **Medication Service** | 7090 | nilecare_medication (MySQL) | Prescriptions, Medication orders | Auth, Clinical, CDS |
| **CDS Service** | - | nilecare_cds (MySQL) | Clinical Decision Support, Drug interactions | Medication, External APIs |

### Administrative Services

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **Billing Service** | 7050 | nilecare_billing (MySQL) | Invoices, Claims, Billing accounts | Auth, Appointment |
| **Payment Gateway** | 7030 | nilecare_payment (MySQL) | Payment processing, Transactions | Auth, Billing, External APIs |
| **Facility Service** | 7060 | nilecare_facility (MySQL) | Facilities, Departments, Resources | Auth, Business |
| **Inventory Service** | 7100 | nilecare_inventory (MySQL) | Stock management, Pharmacy inventory | Auth, Medication |

### Integration Services

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **HL7 Service** | - | nilecare_interop (MySQL) | HL7 v2.x message processing | Clinical, Appointment |
| **FHIR Service** | - | fhir_resources (MongoDB) | FHIR R4 resource management | Clinical, Patient |
| **Device Integration** | 7070 | nilecare_devices (PostgreSQL + TimescaleDB) | Medical device data streaming | Clinical, Notification |

### Support Services

| Service | Port | Database | Purpose | Dependencies |
|---------|------|----------|---------|--------------|
| **Notification Service** | 3002 | nilecare_notifications (PostgreSQL) | Email, SMS, Push notifications | Auth, RabbitMQ |
| **EHR Service** | 4001 | ehr_service (PostgreSQL) | Electronic Health Records | Clinical, Patient |

---

## 🗄️ DATABASE ARCHITECTURE

### Database Distribution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     MYSQL CLUSTER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Primary: Port 3306                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │ nilecare_auth│  │nilecare_billing│ │nilecare_lab │  │ │
│  │  │ (7 tables)   │  │  (9 tables)    │ │ (4 tables)  │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │nilecare_     │  │nilecare_     │  │nilecare_    │  │ │
│  │  │medication    │  │clinical      │  │facility     │  │ │
│  │  │(5 tables)    │  │(8 tables)    │  │(5 tables)   │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │nilecare_     │  │nilecare_     │  │nilecare_    │  │ │
│  │  │inventory     │  │payment       │  │business     │  │ │
│  │  │(5 tables)    │  │(10 tables)   │  │(4 tables)   │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────┐                                       │ │
│  │  │nilecare_cds  │                                       │ │
│  │  │(6 tables)    │                                       │ │
│  │  └──────────────┘                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  Total: 10 databases, 62 tables                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  POSTGRESQL CLUSTER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Primary: Port 5432                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐                   │ │
│  │  │ nilecare_    │  │  ehr_service │                   │ │
│  │  │ notifications│  │  (8 tables)  │                   │ │
│  │  │  (4 tables)  │  │              │                   │ │
│  │  └──────────────┘  └──────────────┘                   │ │
│  │                                                          │ │
│  │  ┌──────────────┐                                       │ │
│  │  │nilecare_     │  TimescaleDB Extension               │ │
│  │  │devices       │  for time-series device data         │ │
│  │  │(4 tables)    │                                       │ │
│  │  └──────────────┘                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  Total: 3 databases, 16 tables                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MONGODB CLUSTER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Primary: Port 27017                                   │ │
│  │  ┌──────────────┐                                       │ │
│  │  │fhir_resources│  Collections:                        │ │
│  │  │              │  - patients                          │ │
│  │  │              │  - encounters                        │ │
│  │  │              │  - observations                      │ │
│  │  │              │  - medications                       │ │
│  │  │              │  - conditions                        │ │
│  │  └──────────────┘                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│  Total: 1 database, 5+ collections                          │
└─────────────────────────────────────────────────────────────┘
```

### Database Selection Rationale

| Database | Use Cases | Reason |
|----------|-----------|--------|
| **MySQL** | Core business data, transactional data | ACID compliance, mature ecosystem, excellent performance |
| **PostgreSQL** | Complex queries, JSON data, time-series | Advanced features, JSON support, TimescaleDB for IoT |
| **MongoDB** | FHIR resources, document storage | Schema flexibility, nested document support |
| **Redis** | Sessions, cache, real-time data | In-memory speed, pub/sub, distributed cache |

---

## 🔄 SERVICE COMMUNICATION PATTERNS

### 1. Synchronous Communication (HTTP/REST)

```
┌──────────────┐    HTTP Request     ┌──────────────┐
│              │───────────────────▶ │              │
│   Service A  │                     │   Service B  │
│              │◀─────────────────── │              │
└──────────────┘    HTTP Response    └──────────────┘

Example: Frontend → Auth Service (Login)
```

**When to Use:**
- User-initiated actions requiring immediate response
- Data retrieval operations
- Service-to-service synchronous calls

**Services Using REST:**
- All frontend-to-backend communication
- Auth Service validation calls
- Orchestrator service aggregation

### 2. Asynchronous Communication (Kafka Events)

```
┌──────────────┐                     ┌──────────────┐
│              │    Publish Event    │              │
│  Service A   │──────────────────▶  │    Kafka     │
│              │                     │   Broker     │
└──────────────┘                     └──────┬───────┘
                                            │ Event
                                            ▼
                                     ┌──────────────┐
                                     │              │
                                     │  Service B   │
                                     │  (Consumer)  │
                                     └──────────────┘

Example: Appointment Created → Notification Service
```

**When to Use:**
- Decoupled event-driven workflows
- Multiple consumers for same event
- Audit trail and event sourcing

**Kafka Topics:**
- `patient.created`
- `appointment.scheduled`
- `appointment.cancelled`
- `prescription.created`
- `lab.result.critical`
- `payment.completed`

### 3. Task Queue (RabbitMQ)

```
┌──────────────┐                     ┌──────────────┐
│              │    Queue Task       │              │
│  Service A   │──────────────────▶  │  RabbitMQ    │
│              │                     │   Exchange   │
└──────────────┘                     └──────┬───────┘
                                            │ Task
                                            ▼
                                     ┌──────────────┐
                                     │              │
                                     │  Worker      │
                                     │  Service     │
                                     └──────────────┘

Example: Send Email → Email Worker
```

**When to Use:**
- Background job processing
- Rate-limited operations
- Retry-able tasks

**Queue Types:**
- Email queue
- SMS queue
- Report generation queue
- Data export queue

### 4. Real-Time Communication (WebSocket)

```
┌──────────────┐                     ┌──────────────┐
│              │    WebSocket        │              │
│   Frontend   │◀═══════════════════▶│ Main Service │
│              │   Bidirectional     │              │
└──────────────┘                     └──────┬───────┘
                                            │ Pub/Sub
                                            ▼
                                     ┌──────────────┐
                                     │    Redis     │
                                     │   Pub/Sub    │
                                     └──────────────┘

Example: Real-time vital signs monitoring
```

**When to Use:**
- Real-time data streaming
- Live notifications
- Collaborative features

**WebSocket Events:**
- `vitals.update` - Live vital signs
- `notification.new` - New notification
- `appointment.updated` - Schedule changes

### 5. Device Communication (MQTT)

```
┌──────────────┐                     ┌──────────────┐
│   Medical    │    MQTT Publish     │              │
│   Device     │──────────────────▶  │ MQTT Broker  │
│ (ECG/BP/etc) │                     │ (Mosquitto)  │
└──────────────┘                     └──────┬───────┘
                                            │ Subscribe
                                            ▼
                                     ┌──────────────┐
                                     │   Device     │
                                     │  Integration │
                                     │   Service    │
                                     └──────────────┘

Example: ECG Device → Device Integration Service
```

**When to Use:**
- IoT medical device integration
- High-frequency sensor data
- Low-bandwidth scenarios

**MQTT Topics:**
- `devices/{device_id}/vitals`
- `devices/{device_id}/alerts`
- `devices/{device_id}/status`

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│          │  1. Login Request  │          │ 2. Validate        │          │
│ Frontend │───────────────────▶│   Auth   │───────────────────▶│  MySQL   │
│          │                    │ Service  │                    │   DB     │
│          │                    │          │◀─────────────────── │          │
│          │                    │          │ 3. User Data       │          │
│          │                    │          │                    └──────────┘
│          │                    │          │
│          │                    │          │ 4. Generate JWT
│          │                    │          │    + Refresh Token
│          │◀─────────────────── │          │
│          │ 5. Return Tokens   │          │ 5. Store Session
│          │                    │          │───────────────────▶┌──────────┐
└──────────┘                    └──────────┘                    │  Redis   │
                                                                 └──────────┘
```

### Authorization Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│          │ 1. API Request     │          │ 2. Validate Token  │          │
│ Frontend │───────────────────▶│   Any    │───────────────────▶│   Auth   │
│  (JWT)   │                    │ Service  │                    │ Service  │
│          │                    │          │◀─────────────────── │          │
│          │                    │          │ 3. User + Perms    │          │
│          │                    │          │                    └──────────┘
│          │                    │          │ 4. Check Permission
│          │                    │          │    (RBAC)
│          │                    │          │
│          │◀─────────────────── │          │
│          │ 5. Authorized Data │          │
└──────────┘                    └──────────┘
```

### Security Layers

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **Transport** | TLS 1.3, HTTPS | Encrypt data in transit |
| **Authentication** | JWT (HS256), MFA | Verify user identity |
| **Authorization** | RBAC, Permission-based | Control resource access |
| **Data Encryption** | AES-256 at rest | Protect sensitive data |
| **API Security** | Rate limiting, CORS | Prevent abuse |
| **Audit Logging** | All PHI access logged | Compliance & forensics |
| **Secret Management** | Environment variables | Secure credential storage |

---

## 📡 DATA FLOW EXAMPLES

### Example 1: Patient Appointment Booking

```
1. Frontend (Receptionist Dashboard)
   └─▶ POST /api/v1/appointments
       │
2. Gateway Service (7001)
   ├─▶ Validate JWT with Auth Service (7020)
   └─▶ Route to Appointment Service (7040)
       │
3. Appointment Service
   ├─▶ Validate patient exists (Main Service)
   ├─▶ Check doctor availability (Business Service)
   ├─▶ Create appointment record (MySQL)
   └─▶ Publish event: appointment.scheduled (Kafka)
       │
4. Event Consumers
   ├─▶ Notification Service: Send SMS/Email reminder
   ├─▶ Billing Service: Create pending invoice
   └─▶ Audit Service: Log appointment creation

5. Response to Frontend
   └─▶ 201 Created with appointment details
```

### Example 2: E-Prescription Workflow

```
1. Frontend (Doctor Dashboard)
   └─▶ POST /api/v1/prescriptions
       │
2. Medication Service (7090)
   ├─▶ Validate patient and doctor
   ├─▶ Call CDS Service for drug interaction check
   │   └─▶ CDS Service queries:
   │       ├─▶ Patient allergies (Clinical Service)
   │       ├─▶ Current medications (Medication Service)
   │       └─▶ External Drug Database (RxNorm API)
   │
3. CDS Service Returns
   ├─▶ Drug interactions found: CRITICAL
   └─▶ Allergy match: PENICILLIN
       │
4. Frontend Displays Warning
   └─▶ Doctor can override with justification
       │
5. Prescription Created
   ├─▶ Save to nilecare_medication DB
   ├─▶ Publish event: prescription.created (Kafka)
   └─▶ HL7 Service: Generate ORM message for pharmacy
```

### Example 3: Real-Time Vital Signs Monitoring

```
1. ECG Device (Bedside)
   └─▶ MQTT Publish to: devices/ecg-001/vitals
       Payload: { hr: 85, rhythm: "normal", timestamp: ... }
       │
2. MQTT Broker (Mosquitto)
   └─▶ Route to Device Integration Service (7070)
       │
3. Device Integration Service
   ├─▶ Store in TimescaleDB (time-series)
   ├─▶ Check thresholds (Critical Alert Detection)
   │   └─▶ HR > 120 or HR < 40 → CRITICAL
   │
4. If Critical Alert
   ├─▶ Publish to Kafka: vitals.critical
   ├─▶ Call Notification Service: Alert on-duty nurse
   │   └─▶ Send push notification + SMS
   │
5. Broadcast via WebSocket
   └─▶ All connected clients with permission receive update
       ├─▶ Nurse Dashboard: Red alert banner
       └─▶ Doctor Dashboard: Notification bell
```

---

## 🎯 SERVICE DEPENDENCIES

### Dependency Graph

```
                         ┌──────────────────┐
                         │   Auth Service   │ ◀─── All services depend on Auth
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        ┌─────▼─────┐      ┌─────▼──────┐     ┌─────▼─────┐
        │  Business │      │   Main     │     │  Clinical │
        │  Service  │      │ Orchestrator│     │  Service  │
        └─────┬─────┘      └─────┬──────┘     └─────┬─────┘
              │                   │                   │
    ┌─────────┼───────┬───────────┼─────────┬─────────┼──────────┐
    │         │       │           │         │         │          │
┌───▼───┐ ┌──▼───┐ ┌─▼────┐  ┌───▼────┐ ┌──▼───┐ ┌──▼────┐ ┌───▼───┐
│Appoint│ │Billing│ │Facility│ │Payment│ │ Lab  │ │ Med  │ │Device│
│ment   │ │Service│ │Service│ │Gateway│ │Service│ │Service│ │Service│
└───────┘ └───┬───┘ └──────┘  └───────┘ └──────┘ └───┬───┘ └──────┘
              │                                        │
         ┌────▼────┐                            ┌─────▼─────┐
         │Inventory│                            │    CDS    │
         │Service  │                            │  Service  │
         └─────────┘                            └───────────┘
                                                      │
                                              ┌───────┴────────┐
                                              │  External APIs │
                                              │  RxNorm, etc   │
                                              └────────────────┘
```

### Critical Paths

**High Priority (Must be available)**
1. Auth Service → All services depend on it
2. Main Orchestrator → Frontend primary interface
3. Gateway → Entry point for all requests
4. Database clusters → Data persistence

**Medium Priority (Clinical operations)**
1. Clinical Service → Patient encounters
2. Medication Service → Prescriptions
3. Lab Service → Lab orders and results
4. CDS Service → Clinical decision support

**Lower Priority (Can be temporarily unavailable)**
1. Billing Service → Invoicing (can be queued)
2. Notification Service → Alerts (can be delayed)
3. HL7/FHIR Services → Interoperability
4. Device Service → Real-time monitoring (critical for ICU)

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Development Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Laptop                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Docker Compose (docker-compose.yml)               │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │ │
│  │  │MySQL │ │Postgres│ │Redis│ │Kafka│ │MQTT │    │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │     All Microservices (Hot Reload)           │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │     React Frontend (Vite Dev Server)         │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Production Environment (Kubernetes)

```
┌────────────────────────────────────────────────────────────────┐
│                     KUBERNETES CLUSTER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  INGRESS CONTROLLER                       │  │
│  │       (NGINX + TLS Termination + Load Balancing)         │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┼──────────────────────────────────┐  │
│  │         NAMESPACES    │                                  │  │
│  │  ┌────────────────────▼──────────────────┐              │  │
│  │  │       nilecare-production             │              │  │
│  │  │  ┌──────────┐  ┌──────────┐          │              │  │
│  │  │  │ Gateway  │  │   Main   │  ...     │              │  │
│  │  │  │ (3 pods) │  │(3 pods)  │          │              │  │
│  │  │  └──────────┘  └──────────┘          │              │  │
│  │  │                                        │              │  │
│  │  │  ┌──────────┐  ┌──────────┐          │              │  │
│  │  │  │   Auth   │  │ Business │  ...     │              │  │
│  │  │  │ (3 pods) │  │(2 pods)  │          │              │  │
│  │  │  └──────────┘  └──────────┘          │              │  │
│  │  └────────────────────────────────────────┘              │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────┐              │  │
│  │  │       nilecare-data                   │              │  │
│  │  │  ┌──────────┐  ┌──────────┐          │              │  │
│  │  │  │  MySQL   │  │ Postgres │          │              │  │
│  │  │  │(StatefulSet)│(StatefulSet)       │              │  │
│  │  │  └──────────┘  └──────────┘          │              │  │
│  │  │                                        │              │  │
│  │  │  ┌──────────┐  ┌──────────┐          │              │  │
│  │  │  │  Redis   │  │  Kafka   │          │              │  │
│  │  │  │(StatefulSet)│(StatefulSet)       │              │  │
│  │  │  └──────────┘  └──────────┘          │              │  │
│  │  └────────────────────────────────────────┘              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────┐                     │
│  │   PERSISTENT VOLUMES (AWS EBS/GCP PD)  │                     │
│  └────────────────────────────────────────┘                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📊 MONITORING & OBSERVABILITY

### Monitoring Stack

```
┌────────────────────────────────────────────────────────────┐
│                    MONITORING LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Prometheus  │  │   Grafana    │  │   AlertManager  │  │
│  │  (Metrics)   │  │ (Dashboards) │  │   (Alerting)    │  │
│  └──────┬───────┘  └──────────────┘  └─────────────────┘  │
│         │                                                   │
│         │ Scrape                                            │
│         ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           All Microservices                          │  │
│  │  /metrics endpoints (Prometheus format)              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                     LOGGING LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Elasticsearch│  │    Logstash  │  │     Kibana      │  │
│  │   (Store)    │  │  (Process)   │  │  (Visualize)    │  │
│  └──────▲───────┘  └──────▲───────┘  └─────────────────┘  │
│         │                 │                                │
│         └─────────────────┘                                │
│                   │                                         │
│  ┌────────────────▼──────────────────────────────────────┐ │
│  │        Filebeat / Fluentd (Log Shippers)             │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    TRACING LAYER                            │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    Jaeger    │  │    Zipkin    │                        │
│  │ (Distributed │  │  (Alternative)│                        │
│  │   Tracing)   │  │              │                        │
│  └──────▲───────┘  └──────────────┘                        │
│         │                                                   │
│         │ Trace data                                        │
│  ┌──────┴───────────────────────────────────────────────┐  │
│  │     OpenTelemetry (All Microservices)                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ NEXT STEPS

This architecture overview provides the foundation for:

1. **Developer Onboarding** - Understanding system structure
2. **Service Development** - Knowing where to add features
3. **Troubleshooting** - Identifying failure points
4. **Scaling Decisions** - Understanding bottlenecks
5. **Security Audits** - Reviewing attack surfaces

### Related Documentation

- [Inter-Service Communication Patterns](./SERVICE_COMMUNICATION_PATTERNS.md)
- [Database Schema Documentation](./DATABASE_SCHEMAS.md)
- [API Reference](./API_REFERENCE.md)
- [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Document Status:** ✅ Complete  
**Last Updated:** October 16, 2025  
**Next Review:** Phase 2 Backend Fixes Complete

