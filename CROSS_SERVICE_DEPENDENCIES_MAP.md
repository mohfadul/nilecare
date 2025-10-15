# 🔗 Cross-Service Dependencies Map

**Version:** 1.0.0  
**Date:** October 15, 2025  
**Purpose:** Document all cross-service dependencies that need to be refactored in Phase 2

---

## 📋 Overview

This document maps all dependencies between microservices where one service directly accesses another service's database. These **MUST be replaced** with API calls or event-driven patterns during Phase 2.

---

## 🚨 Critical Dependencies to Refactor

### 1. Billing Service → Clinical Service

**Current (BAD):**
```typescript
// Direct database query across services
const [patients] = await db.query(
  'SELECT * FROM clinical_data.patients WHERE id = ?',
  [patientId]
);
```

**Target (GOOD):**
```typescript
// API call to clinical service
const patient = await clinicalServiceClient.getPatient(patientId);
```

**Impact:**
- **Services:** Billing, Clinical
- **Frequency:** High (every invoice creation)
- **Priority:** 🔴 **CRITICAL**
- **Timeline:** Week 4

**Implementation:**
```typescript
// Create Clinical Service Client
// File: microservices/billing-service/src/clients/ClinicalServiceClient.ts

export class ClinicalServiceClient {
  private baseUrl: string;
  private apiKey: string;

  async getPatient(patientId: string): Promise<Patient> {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/patients/${patientId}`,
      { headers: { 'X-API-Key': this.apiKey } }
    );
    return response.data;
  }

  async validatePatientExists(patientId: string): Promise<boolean> {
    try {
      await this.getPatient(patientId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

---

### 2. Payment Gateway → Billing Service

**Current (BAD):**
```typescript
// Direct query to billing database
const [invoices] = await db.query(
  'SELECT * FROM nilecare.invoices WHERE id = ?',
  [invoiceId]
);
```

**Target (GOOD):**
```typescript
// API call to billing service
const invoice = await billingServiceClient.getInvoice(invoiceId);
```

**Impact:**
- **Services:** Payment, Billing
- **Frequency:** Very High (every payment)
- **Priority:** 🔴 **CRITICAL**
- **Timeline:** Week 3

**Implementation:**
```typescript
// File: microservices/payment-gateway-service/src/clients/BillingServiceClient.ts

export class BillingServiceClient {
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/invoices/${invoiceId}`,
      this.config
    );
    return response.data;
  }

  async updateInvoicePaymentStatus(
    invoiceId: string, 
    status: string, 
    paymentId: string
  ): Promise<void> {
    await axios.patch(
      `${this.baseUrl}/api/v1/invoices/${invoiceId}/payment-status`,
      { status, paymentId },
      this.config
    );
  }
}
```

---

### 3. All Services → Facility Service

**Current (BAD):**
```typescript
// Every service queries facilities directly
const [facilities] = await db.query(
  'SELECT * FROM business_operations.facilities WHERE id = ?',
  [facilityId]
);
```

**Target (GOOD):**
```typescript
// Centralized facility service client
const facility = await facilityServiceClient.getFacility(facilityId);
```

**Impact:**
- **Services:** ALL 15+ services
- **Frequency:** Very High (multi-tenancy)
- **Priority:** 🔴 **CRITICAL**
- **Timeline:** Week 4

**Implementation:**
```typescript
// Shared package: @nilecare/facility-client
// File: packages/@nilecare/facility-client/src/index.ts

export class FacilityServiceClient {
  async getFacility(facilityId: string): Promise<Facility> {
    // Cached response (facilities rarely change)
    const cached = await this.cache.get(`facility:${facilityId}`);
    if (cached) return cached;
    
    const response = await axios.get(
      `${this.baseUrl}/api/v1/facilities/${facilityId}`,
      this.config
    );
    
    await this.cache.set(`facility:${facilityId}`, response.data, 3600); // 1 hour cache
    return response.data;
  }

  async validateFacilityExists(facilityId: string): Promise<boolean> {
    try {
      await this.getFacility(facilityId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

---

### 4. Clinical/EHR → Lab Service

**Current (BAD):**
```typescript
// Direct query to lab results
const [labResults] = await db.query(
  'SELECT * FROM nilecare.lab_results WHERE patient_id = ?',
  [patientId]
);
```

**Target (GOOD - Event Driven):**
```typescript
// Lab Service publishes event when result available
await eventBus.publish('lab.result.available', {
  labOrderId,
  patientId,
  results,
  isAbnormal,
  isCritical
});

// EHR Service subscribes to lab result events
eventBus.subscribe('lab.result.available', async (event) => {
  await ehrService.addLabResultToChart(event.patientId, event.results);
  
  if (event.isCritical) {
    await notificationService.sendCriticalLabAlert(event.patientId, event.results);
  }
});
```

**Impact:**
- **Services:** Lab, EHR, Notification
- **Frequency:** High
- **Priority:** 🟡 **HIGH**
- **Timeline:** Week 4-5

---

### 5. Medication Service → CDS Service (Drug Interactions)

**Current (BAD):**
```typescript
// Direct query to CDS database
const [interactions] = await db.query(
  'SELECT * FROM nilecare.drug_interactions WHERE medication1_id = ? OR medication2_id = ?',
  [medicationId, medicationId]
);
```

**Target (GOOD - API Call):**
```typescript
// Check drug interactions via API
const interactions = await cdsServiceClient.checkDrugInteractions(
  patientId,
  [medicationId1, medicationId2, medicationId3]
);

if (interactions.hasCriticalInteractions) {
  throw new Error(`Critical drug interaction detected: ${interactions.description}`);
}
```

**Impact:**
- **Services:** Medication, CDS
- **Frequency:** High (every prescription)
- **Priority:** 🔴 **CRITICAL** (patient safety)
- **Timeline:** Week 5

---

### 6. Inventory Service → Billing Service

**Current (BAD):**
```typescript
// Direct insert into billing
await db.query(
  'INSERT INTO nilecare.charge_master...',
  [...]
);
```

**Target (GOOD - API Call):**
```typescript
// Update pricing via API
await billingServiceClient.updateChargeMaster({
  serviceCode: item.code,
  unitPrice: item.price,
  cost: item.cost
});
```

**Impact:**
- **Services:** Inventory, Billing
- **Frequency:** Low (pricing updates)
- **Priority:** 🟢 **MEDIUM**
- **Timeline:** Week 5

---

## 📊 Dependency Matrix

| **Source Service** | **Target Service** | **Dependency Type** | **Priority** | **Refactor Method** |
|-------------------|-------------------|-------------------|--------------|---------------------|
| Billing | Clinical | Patient data | 🔴 Critical | API Call |
| Billing | Facility | Facility info | 🔴 Critical | API Call (cached) |
| Billing | Auth | User info | 🔴 Critical | API Call |
| Payment | Billing | Invoice data | 🔴 Critical | API Call |
| Payment | Auth | User info | 🔴 Critical | API Call |
| Lab | Clinical | Patient data | 🟡 High | Event + API |
| Lab | Facility | Facility info | 🟡 High | API Call (cached) |
| Medication | Clinical | Patient data | 🔴 Critical | API Call |
| Medication | CDS | Drug interactions | 🔴 Critical | API Call |
| Inventory | Facility | Location data | 🟡 High | API Call |
| Inventory | Billing | Pricing data | 🟢 Medium | API Call |
| ALL Services | Auth | Authentication | 🔴 Critical | Middleware |
| ALL Services | Facility | Multi-tenancy | 🔴 Critical | API Call (cached) |

---

## 🎯 Refactoring Strategy

### Strategy 1: Synchronous API Calls (Real-time data)

**Use For:**
- Patient demographics (Clinical)
- Invoice details (Billing)
- Payment status (Payment)
- Drug interactions (CDS)

**Pattern:**
```typescript
async function getPatientData(patientId: string): Promise<Patient> {
  try {
    const response = await axios.get(
      `${CLINICAL_SERVICE_URL}/api/v1/patients/${patientId}`,
      {
        headers: { 'X-API-Key': API_KEY },
        timeout: 5000
      }
    );
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch patient data', { patientId, error });
    throw new ServiceUnavailableError('Clinical service unavailable');
  }
}
```

---

### Strategy 2: Cached API Calls (Reference data)

**Use For:**
- Facility information (rarely changes)
- Medication catalog (relatively static)
- Service codes (reference data)

**Pattern:**
```typescript
async function getFacilityInfo(facilityId: string): Promise<Facility> {
  // Check Redis cache first
  const cached = await redis.get(`facility:${facilityId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from API
  const response = await axios.get(
    `${FACILITY_SERVICE_URL}/api/v1/facilities/${facilityId}`
  );

  // Cache for 1 hour
  await redis.setex(`facility:${facilityId}`, 3600, JSON.stringify(response.data));
  
  return response.data;
}
```

---

### Strategy 3: Event-Driven (Async updates)

**Use For:**
- Lab results available
- Payment confirmed
- Prescription dispensed
- Inventory low stock

**Pattern:**
```typescript
// Publisher (Lab Service)
await eventBus.publish('lab.result.available', {
  eventId: uuid(),
  timestamp: new Date().toISOString(),
  source: 'lab-service',
  eventType: 'lab.result.available',
  data: {
    labOrderId,
    patientId,
    results,
    isAbnormal,
    isCritical
  }
});

// Subscriber (EHR Service)
eventBus.subscribe('lab.result.available', async (event) => {
  try {
    await ehrService.addLabResultToPatientChart(
      event.data.patientId,
      event.data.results
    );
    logger.info('Lab result added to chart', { patientId: event.data.patientId });
  } catch (error) {
    logger.error('Failed to process lab result event', { event, error });
    // Retry logic here
  }
});
```

---

### Strategy 4: Data Replication (Eventual consistency)

**Use For:**
- User profile data (frequently accessed)
- Facility assignments
- Insurance information

**Pattern:**
```typescript
// Subscribe to user updates
eventBus.subscribe('auth.user.updated', async (event) => {
  // Update local copy of user data
  await localUserCache.update(event.data.userId, {
    firstName: event.data.firstName,
    lastName: event.data.lastName,
    email: event.data.email
  });
});

// Use local copy for reads
async function getUserName(userId: string): Promise<string> {
  const user = await localUserCache.get(userId);
  if (user) {
    return `${user.firstName} ${user.lastName}`;
  }
  // Fallback to API if not in cache
  return await authServiceClient.getUserName(userId);
}
```

---

## 🔧 Service Client Templates

### Create Shared Service Clients Package

**Location:** `packages/@nilecare/service-clients/`

```typescript
// packages/@nilecare/service-clients/src/index.ts

export { AuthServiceClient } from './AuthServiceClient';
export { BillingServiceClient } from './BillingServiceClient';
export { ClinicalServiceClient } from './ClinicalServiceClient';
export { FacilityServiceClient } from './FacilityServiceClient';
export { LabServiceClient } from './LabServiceClient';
export { MedicationServiceClient } from './MedicationServiceClient';
export { PaymentServiceClient } from './PaymentServiceClient';
export { NotificationServiceClient } from './NotificationServiceClient';

// Base client with common functionality
export { BaseServiceClient } from './BaseServiceClient';
```

### Base Service Client

```typescript
// packages/@nilecare/service-clients/src/BaseServiceClient.ts

import axios, { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

export abstract class BaseServiceClient {
  protected client: AxiosInstance;
  protected circuitBreaker: CircuitBreaker;

  constructor(
    protected baseUrl: string,
    protected apiKey: string,
    protected timeout: number = 5000
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Circuit breaker for resilience
    this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), {
      timeout: timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    });
  }

  protected async makeRequest(config: any): Promise<any> {
    return await this.client.request(config);
  }

  protected async get<T>(path: string): Promise<T> {
    const response = await this.circuitBreaker.fire({
      method: 'GET',
      url: path
    });
    return response.data;
  }

  protected async post<T>(path: string, data: any): Promise<T> {
    const response = await this.circuitBreaker.fire({
      method: 'POST',
      url: path,
      data
    });
    return response.data;
  }
}
```

---

## 📋 Complete Dependency List

### Auth Service Dependencies

**Depended on by:** ALL services (for authentication)

**APIs to provide:**
- `GET /api/v1/auth/verify-token` - Token validation
- `GET /api/v1/auth/users/{id}` - Get user info
- `GET /api/v1/auth/users/{id}/permissions` - Get user permissions
- `POST /api/v1/auth/validate-role` - Validate user role

---

### Billing Service Dependencies

**Depends on:**
- Clinical Service (patient data)
- Facility Service (facility info)
- Auth Service (user data)

**Depended on by:**
- Payment Gateway (invoice data)
- EHR Service (billing status)

**APIs to provide:**
- `GET /api/v1/invoices/{id}` - Get invoice
- `PATCH /api/v1/invoices/{id}/status` - Update invoice status
- `POST /api/v1/invoices` - Create invoice
- `GET /api/v1/billing/accounts/{id}` - Get billing account

---

### Clinical Service Dependencies

**Depends on:**
- Facility Service (facility/bed info)
- Auth Service (provider data)

**Depended on by:**
- Billing Service (patient data)
- Lab Service (patient context)
- Medication Service (patient data)
- EHR Service (clinical data)

**APIs to provide:**
- `GET /api/v1/patients/{id}` - Get patient
- `GET /api/v1/patients/{id}/summary` - Get patient summary
- `GET /api/v1/encounters/{id}` - Get encounter
- `POST /api/v1/patients` - Create patient

---

### Facility Service Dependencies

**Depends on:**
- Auth Service (staff assignments)

**Depended on by:**
- ALL services (multi-tenancy)

**APIs to provide:**
- `GET /api/v1/facilities/{id}` - Get facility (CACHED)
- `GET /api/v1/facilities/{id}/departments` - Get departments
- `GET /api/v1/beds/available` - Get available beds
- `PATCH /api/v1/beds/{id}/status` - Update bed status

---

### Lab Service Dependencies

**Depends on:**
- Clinical Service (patient/encounter data)
- Facility Service (facility info)
- Auth Service (provider data)

**Depended on by:**
- EHR Service (lab results)
- CDS Service (decision support)

**Events to publish:**
- `lab.order.created`
- `lab.result.available`
- `lab.critical.result`

---

### Medication Service Dependencies

**Depends on:**
- Clinical Service (patient data)
- CDS Service (drug interactions)
- Auth Service (prescriber data)
- Inventory Service (stock levels)

**Depended on by:**
- EHR Service (medication list)
- Billing Service (medication charges)

**Events to publish:**
- `medication.prescribed`
- `medication.administered`
- `medication.discontinued`

---

### Payment Gateway Dependencies

**Depends on:**
- Billing Service (invoice data)
- Auth Service (user data)

**Depended on by:**
- Billing Service (payment status)

**Events to publish:**
- `payment.initiated`
- `payment.confirmed`
- `payment.failed`
- `refund.processed`

---

## 🔄 Event Schema Definitions

### Standard Event Format

```typescript
interface DomainEvent {
  eventId: string;           // UUID
  eventType: string;         // Dot notation: service.entity.action
  eventVersion: string;      // Semantic version
  timestamp: string;         // ISO 8601
  source: string;            // Service name
  data: any;                 // Event-specific payload
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    traceId?: string;
  };
}
```

### Lab Result Available Event

```typescript
interface LabResultAvailableEvent extends DomainEvent {
  eventType: 'lab.result.available';
  data: {
    labOrderId: string;
    patientId: string;
    encounterId?: string;
    testCode: string;
    testName: string;
    resultValue: string;
    resultUnit: string;
    referenceRange: string;
    abnormalFlag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
    isCritical: boolean;
    resultDate: string;
  };
}
```

### Payment Confirmed Event

```typescript
interface PaymentConfirmedEvent extends DomainEvent {
  eventType: 'payment.confirmed';
  data: {
    paymentId: string;
    invoiceId: string;
    patientId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    confirmedAt: string;
  };
}
```

---

## 📈 Refactoring Timeline

### Week 3: Critical Payment Flow

- [ ] Payment Gateway → Billing API integration
- [ ] Billing → Clinical API integration
- [ ] Test end-to-end payment flow

### Week 4: Clinical Workflows

- [ ] Lab → Clinical event integration
- [ ] Clinical → Facility API integration
- [ ] Test clinical workflows

### Week 5: Medication Safety

- [ ] Medication → CDS API integration
- [ ] Medication → Clinical API integration
- [ ] Test prescription workflows

### Week 6: Final Integration

- [ ] Inventory → Billing integration
- [ ] All remaining dependencies
- [ ] Comprehensive integration testing

---

## ✅ Success Criteria

**Phase 2 is complete when:**

- [ ] Zero direct cross-service database queries
- [ ] All services use API clients or events
- [ ] Circuit breakers implemented
- [ ] Caching strategy in place
- [ ] Retry logic implemented
- [ ] Error handling robust
- [ ] Performance acceptable
- [ ] All integration tests passing

---

**Document Owner:** Integration Team  
**Last Updated:** October 15, 2025  
**Status:** ✅ **READY FOR PHASE 2**

