# Healthcare Services Integration Guide
## Clinical + CDS + EHR Services Working in Harmony

**Date:** October 14, 2025  
**Services:** Clinical (3004) + CDS (4002) + EHR (4001)

---

## 🎯 Executive Summary

The NileCare platform consists of **three core healthcare services** that work together to provide comprehensive, safe, and well-documented patient care:

1. **Clinical Service (Port 3004)** - Patient data & clinical operations
2. **CDS Service (Port 4002)** - Clinical decision support & safety
3. **EHR Service (Port 4001)** - Documentation & medical records

Together, they form a complete healthcare management ecosystem.

---

## 📊 Service Overview Comparison

| Aspect | Clinical Service | CDS Service | EHR Service |
|--------|-----------------|-------------|-------------|
| **Port** | 3004 | 4002 | 4001 |
| **Primary Role** | Clinical operations | Safety & intelligence | Documentation |
| **Key Functions** | Patients, encounters, medications | Drug checks, alerts, guidelines | SOAP notes, problem lists |
| **Database** | PostgreSQL | PostgreSQL, MongoDB | PostgreSQL, MongoDB, S3 |
| **Status** | ✅ 80% complete | 🟡 20% complete | 🟡 15% complete |
| **Dependencies** | auth, CDS, EHR | auth, Clinical (events) | auth, Clinical |

---

## 🏗️ Integrated Architecture

```
┌────────────────────────────────────────────────────────────────┐
│               NILECARE HEALTHCARE PLATFORM                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │  Clinical    │◄─►│  CDS Service │   │  EHR Service │      │
│  │  Service     │   │  (Port 4002) │◄──│  (Port 4001) │      │
│  │  (Port 3004) │   │              │   │              │      │
│  │              │   │ • Drug       │   │ • SOAP Notes │      │
│  │ • Patients   │──►│   Checks     │   │ • Problem    │      │
│  │ • Encounters │   │ • Allergy    │   │   Lists      │      │
│  │ • Medications│   │   Alerts     │   │ • Progress   │      │
│  │ • Diagnostics│   │ • Dose       │   │   Notes      │      │
│  │              │──►│   Validation │   │ • Documents  │      │
│  └──────────────┘   │ • Guidelines │   │ • History    │      │
│         │           └──────────────┘   └──────────────┘      │
│         │                  │                   │              │
│         └──────────────────┴───────────────────┘              │
│                            │                                   │
│                     Shared Services                           │
│              ┌──────────────────────────┐                     │
│              │   Auth Service (4000)    │                     │
│              │   Billing Service (...)  │                     │
│              │   Kafka Event Bus        │                     │
│              │   PostgreSQL Database    │                     │
│              └──────────────────────────┘                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Example

### Scenario: Doctor Visit with Medication Prescription

```
┌───────────────────────────────────────────────────────────────┐
│  STEP 1: Patient Check-In                                     │
├───────────────────────────────────────────────────────────────┤
│  Clinical Service (Port 3004)                                 │
│  POST /api/v1/encounters                                      │
│  {                                                             │
│    patientId: "P12345",                                       │
│    providerId: "DR-001",                                      │
│    encounterType: "outpatient",                               │
│    chiefComplaint: "Persistent cough and fever"              │
│  }                                                             │
│                                                                │
│  Result: ✅ Encounter created (ID: ENC-789)                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 2: Doctor Reviews Medical History                       │
├───────────────────────────────────────────────────────────────┤
│  EHR Service (Port 4001)                                      │
│  GET /api/v1/problem-lists/patient/P12345                    │
│                                                                │
│  Returns:                                                      │
│  • Active Problems:                                           │
│    - Hypertension (I10) - since 2020                         │
│    - Type 2 Diabetes (E11.9) - since 2018                   │
│  • Allergies:                                                 │
│    - Penicillin (severe)                                      │
│  • Current Medications:                                       │
│    - Metformin 500mg BID                                      │
│    - Lisinopril 10mg daily                                   │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 3: Doctor Examines Patient & Documents Findings         │
├───────────────────────────────────────────────────────────────┤
│  EHR Service (Port 4001)                                      │
│  POST /api/v1/soap-notes                                      │
│  {                                                             │
│    patientId: "P12345",                                       │
│    encounterId: "ENC-789",                                    │
│    subjective: "Patient reports persistent cough x 5 days,   │
│                 fever up to 101°F, no SOB, productive cough  │
│                 with yellow sputum",                          │
│    objective: "Vitals: T 100.8°F, BP 135/85, HR 88, RR 18,  │
│                SpO2 96%. Lungs: crackles RLL, otherwise      │
│                clear. No wheezing.",                          │
│    assessment: "Acute bronchitis with secondary bacterial    │
│                 infection. Rule out pneumonia.",              │
│    plan: "1. CXR to rule out pneumonia                       │
│            2. Azithromycin 500mg x5 days                      │
│            3. Increase fluids, rest                           │
│            4. Follow-up in 1 week"                            │
│  }                                                             │
│                                                                │
│  Result: ✅ SOAP note created (draft status)                  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 4: Doctor Prescribes Antibiotic                         │
├───────────────────────────────────────────────────────────────┤
│  Clinical Service (Port 3004)                                 │
│  POST /api/v1/medications                                     │
│  {                                                             │
│    patientId: "P12345",                                       │
│    name: "Azithromycin",                                      │
│    dosage: "500mg",                                           │
│    frequency: "once daily",                                   │
│    duration: "5 days"                                         │
│  }                                                             │
│                                                                │
│  ▼ Clinical Service → CDS Service (automatic)                │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 5: CDS Service Performs Safety Checks                   │
├───────────────────────────────────────────────────────────────┤
│  CDS Service (Port 4002)                                      │
│  POST /api/v1/check-medication                                │
│  {                                                             │
│    patientId: "P12345",                                       │
│    medications: [                                             │
│      { name: "Metformin", dose: "500mg" },    // existing    │
│      { name: "Lisinopril", dose: "10mg" },    // existing    │
│      { name: "Azithromycin", dose: "500mg" }  // new         │
│    ],                                                          │
│    allergies: ["Penicillin"],                                │
│    conditions: [                                              │
│      { icdCode: "I10", name: "Hypertension" },              │
│      { icdCode: "E11.9", name: "Type 2 Diabetes" }          │
│    ]                                                           │
│  }                                                             │
│                                                                │
│  CDS Checks:                                                  │
│  ┌────────────────────────────────────────┐                  │
│  │ ✅ Drug Interactions: None found       │                  │
│  │ ✅ Allergy Check: OK (Azithromycin ≠   │                  │
│  │    Penicillin, but flag cross-         │                  │
│  │    reactivity warning)                  │                  │
│  │ ✅ Contraindications: None              │                  │
│  │ ✅ Dose Validation: Within range        │                  │
│  │ ⚠️  Warning: QT prolongation risk with  │                  │
│  │    azithromycin - monitor ECG          │                  │
│  └────────────────────────────────────────┘                  │
│                                                                │
│  Result: Risk Level = MEDIUM                                  │
│  (No override required, but warnings shown)                  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 6: Doctor Reviews Warnings                              │
├───────────────────────────────────────────────────────────────┤
│  Clinical Service UI shows:                                   │
│  ┌────────────────────────────────────────┐                  │
│  │ ⚠️ MEDIUM RISK PRESCRIPTION             │                  │
│  │                                         │                  │
│  │ Warning: QT prolongation risk           │                  │
│  │ Recommendation: Monitor ECG if patient  │                  │
│  │ has cardiac history                     │                  │
│  │                                         │                  │
│  │ Note: Possible cross-reactivity with    │                  │
│  │ Penicillin allergy (2-10% risk)        │                  │
│  │                                         │                  │
│  │ [Proceed] [Modify] [Cancel]            │                  │
│  └────────────────────────────────────────┘                  │
│                                                                │
│  Doctor reviews and clicks [Proceed]                         │
│  (Accepts warnings, no cardiac history)                       │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 7: Prescription Saved                                   │
├───────────────────────────────────────────────────────────────┤
│  Clinical Service saves medication:                           │
│  {                                                             │
│    id: "MED-456",                                             │
│    patientId: "P12345",                                       │
│    medication: "Azithromycin 500mg",                         │
│    safetyCheckPerformed: true,                               │
│    riskLevel: "medium",                                       │
│    warnings: ["QT prolongation", "Cross-reactivity"],        │
│    prescribedBy: "DR-001",                                   │
│    status: "active"                                           │
│  }                                                             │
│                                                                │
│  ▼ Publishes event to Kafka                                  │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 8: Update Problem List                                  │
├───────────────────────────────────────────────────────────────┤
│  EHR Service (Port 4001)                                      │
│  POST /api/v1/problem-lists                                   │
│  {                                                             │
│    patientId: "P12345",                                       │
│    problemName: "Acute Bronchitis",                          │
│    icdCode: "J20.9",                                          │
│    status: "active",                                          │
│    onsetDate: "2025-10-14",                                  │
│    linkedSOAPNote: "SOAP-123"                                │
│  }                                                             │
│                                                                │
│  Result: ✅ Problem added to list                             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 9: Order Diagnostic Test                                │
├───────────────────────────────────────────────────────────────┤
│  Clinical Service (Port 3004)                                 │
│  POST /api/v1/diagnostics                                     │
│  {                                                             │
│    patientId: "P12345",                                       │
│    testType: "imaging",                                       │
│    testName: "Chest X-Ray",                                  │
│    orderedBy: "DR-001",                                      │
│    priority: "routine",                                       │
│    clinicalIndication: "R/O pneumonia"                       │
│  }                                                             │
│                                                                │
│  Result: ✅ CXR order created                                 │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 10: Finalize Documentation                              │
├───────────────────────────────────────────────────────────────┤
│  EHR Service (Port 4001)                                      │
│  PATCH /api/v1/soap-notes/SOAP-123/finalize                  │
│                                                                │
│  Result: ✅ SOAP note finalized                               │
│  • Can no longer be edited                                    │
│  • Can only be amended                                        │
│  • Available for billing                                      │
│  • Locked for audit trail                                    │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  STEP 11: Other Services React                                │
├───────────────────────────────────────────────────────────────┤
│  Via Kafka Events:                                            │
│                                                                │
│  • Billing Service: Creates encounter charge                 │
│  • Pharmacy Service: Receives prescription                    │
│  • Notification Service: Sends patient SMS/email             │
│  • Analytics Service: Records prescribing pattern            │
│  • Audit Service: Logs all actions                           │
└───────────────────────────────────────────────────────────────┘
```

---

## 📋 Service Responsibilities

### Clinical Service (Port 3004)
**"The Operational Hub"**

✅ **Manages:**
- Patient demographics and registration
- Encounter/visit management
- Medication orders
- Diagnostic test orders
- Vital signs recording
- FHIR resources

✅ **Calls:**
- CDS Service for safety checks
- EHR Service for documentation
- Billing Service for charges

✅ **Publishes:**
- patient.created/updated events
- medication.prescribed events
- encounter.created events
- diagnostic.created events

---

### CDS Service (Port 4002)
**"The Safety Guardian"**

✅ **Manages:**
- Drug interaction database
- Allergy cross-reactivity database
- Dosing guidelines
- Clinical guidelines
- Risk scoring algorithms

✅ **Provides:**
- Real-time medication safety checks
- Drug-drug interactions
- Drug-allergy alerts
- Dose validation
- Contraindication detection
- Clinical guideline recommendations

✅ **Consumes:**
- Medication events (for learning)
- Patient update events
- Problem list data (from EHR)

---

### EHR Service (Port 4001)
**"The Documentation Keeper"**

✅ **Manages:**
- SOAP notes (S-O-A-P format)
- Problem lists (active/inactive)
- Progress notes
- Clinical documents
- Medical history
- Document versioning
- Audit trail

✅ **Provides:**
- Document export (PDF/HTML/XML)
- FHIR DocumentReference
- Complete patient record
- Audit-compliant documentation

✅ **Used By:**
- Clinical Service (create documentation)
- CDS Service (read problem lists)
- Billing Service (coding from finalized notes)
- Patients (view own records)

---

## 🔗 Integration Patterns

### Pattern 1: Synchronous API Calls

```typescript
// Clinical → CDS (synchronous safety check)
const safety = await cdsClient.checkMedicationSafety(data);
if (safety.riskLevel === 'high') {
  // Block or require override
}
```

### Pattern 2: Event-Driven (Asynchronous)

```typescript
// Clinical publishes event
await eventPublisher.publish('medication.prescribed', data);

// CDS consumes event (asynchronous)
kafka.on('medication.prescribed', async (event) => {
  // Update ML models, cache, etc.
});
```

### Pattern 3: Data Sharing

```typescript
// CDS needs problem list from EHR
const problemList = await ehrClient.getProblems(patientId);
const contraindications = checkAgainstProblems(med, problemList);
```

### Pattern 4: Real-time Alerts

```typescript
// CDS broadcasts alert
cdsSocket.emit('clinical-alert', {
  severity: 'critical',
  message: 'High-risk interaction detected'
});

// Clinical/EHR listen and show UI alert
clinicalSocket.on('clinical-alert', showAlert);
```

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Action (Doctor prescribes medication)                 │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────┐                                          │
│  │  Clinical    │─────① Medication Data──────┐             │
│  │  Service     │                             │             │
│  └──────────────┘                             ▼             │
│       │                                  ┌──────────┐       │
│       │                                  │   CDS    │       │
│       │◄────② Safety Assessment──────────│ Service  │       │
│       │                                  └──────────┘       │
│       │                                       ▲             │
│       │                                       │             │
│       │                                       │             │
│       ▼                                       │             │
│  ③ Save Prescription                          │             │
│       │                                       │             │
│       ├────④ Document Visit────┐              │             │
│       │                        ▼              │             │
│       │                   ┌──────────┐        │             │
│       │                   │   EHR    │────────┘             │
│       │                   │ Service  │   ⑤ Get Problems     │
│       │                   └──────────┘                      │
│       │                        │                            │
│       │                        ▼                            │
│       │                   ⑥ SOAP Note                       │
│       │                     Problem List                    │
│       │                                                      │
│       ▼                                                      │
│  ⑦ Publish Events (Kafka)                                  │
│       │                                                      │
│       ├──────►Billing Service                              │
│       ├──────►Pharmacy Service                             │
│       ├──────►Notification Service                         │
│       └──────►Analytics Service                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started - Run All Three Services

### Terminal 1: Clinical Service
```bash
cd microservices/clinical
npm install
npm run dev
# Runs on http://localhost:3004
```

### Terminal 2: CDS Service
```bash
cd microservices/cds-service
npm install
npm run dev
# Runs on http://localhost:4002
```

### Terminal 3: EHR Service
```bash
cd microservices/ehr-service
npm install
npm run dev
# Runs on http://localhost:4001
```

### Terminal 4: Test Integration
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"password"}' \
  | jq -r '.token')

# Test complete workflow
./test-healthcare-workflow.sh
```

---

## 📈 Implementation Status

| Service | Status | Completion | Next Steps |
|---------|--------|------------|------------|
| **Clinical** | ✅ Mostly Complete | ~80% | Add CDS integration |
| **CDS** | 🟡 Skeleton | ~20% | Implement core services (4-6 weeks) |
| **EHR** | 🟡 Skeleton | ~15% | Implement services (4-6 weeks) |

---

## 🎯 Next Steps

### Week 1-2: CDS Service Foundation
- Implement logger, database utils
- Create DrugInteractionService
- Create AllergyService
- Add CDS client to Clinical Service

### Week 3-4: EHR Service Foundation
- Implement SOAP note service
- Implement problem list service
- Integrate with Clinical Service

### Week 5-6: Integration & Testing
- Connect all three services
- End-to-end workflow testing
- Real-time alert integration
- Performance testing

---

## 📚 Documentation Index

- [Clinical Service README](./clinical/README.md)
- [CDS Service README](./cds-service/README.md)
- [EHR Service README](./ehr-service/README.md)
- [Clinical-CDS Integration Guide](./clinical/CDS_INTEGRATION_GUIDE.md)
- [Implementation TODOs](./cds-service/IMPLEMENTATION_TODO.md)

---

**Together, these services create a comprehensive, safe, and well-documented healthcare platform! 🏥💊📋✅**

