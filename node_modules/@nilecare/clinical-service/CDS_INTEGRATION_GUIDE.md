# Clinical Service + CDS Service Integration Guide

## 🎯 Overview

This guide explains how the **Clinical Service** and **CDS (Clinical Decision Support) Service** work together to create a comprehensive, safe healthcare system.

## 🔗 The Perfect Partnership

```
┌────────────────────────────────────────────────────────────────┐
│                  INTEGRATED WORKFLOW                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Doctor prescribes medication (Clinical Service)            │
│                          ↓                                      │
│  2. Clinical Service → CDS Service API call                    │
│                          ↓                                      │
│  3. CDS Service checks:                                        │
│     • Drug interactions with current medications              │
│     • Patient allergies                                        │
│     • Contraindications with patient conditions               │
│     • Dose validation                                          │
│     • Clinical guidelines                                      │
│                          ↓                                      │
│  4. CDS Service calculates risk score                         │
│                          ↓                                      │
│  5. If HIGH RISK → Real-time alert via WebSocket              │
│                          ↓                                      │
│  6. Clinical Service shows warnings to doctor                 │
│                          ↓                                      │
│  7. Doctor reviews and decides:                               │
│     • Modify prescription                                      │
│     • Override with justification                             │
│     • Cancel prescription                                      │
│                          ↓                                      │
│  8. Clinical Service saves final decision                     │
│                          ↓                                      │
│  9. Clinical Service publishes event                          │
│                          ↓                                      │
│  10. Other services react (billing, pharmacy, etc.)           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 📋 Implementation Guide

### Step 1: Set Up Service Communication

Both services need to know about each other:

**Clinical Service `.env`:**
```env
PORT=3004
CDS_SERVICE_URL=http://localhost:4002
ENABLE_CDS_INTEGRATION=true
```

**CDS Service `.env`:**
```env
PORT=4002
CLINICAL_SERVICE_URL=http://localhost:3004
```

### Step 2: Create CDS Client in Clinical Service

Create `src/clients/CDSClient.ts` in Clinical Service:

```typescript
import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface MedicationSafetyCheck {
  patientId: string;
  medications: Array<{
    id?: string;
    name: string;
    dose: string;
    frequency: string;
  }>;
  allergies: string[];
  conditions: Array<{
    code: string;
    name: string;
  }>;
}

export interface SafetyAssessment {
  interactions: Array<{
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    drugs: string[];
    description: string;
    recommendation: string;
  }>;
  allergyAlerts: Array<{
    allergen: string;
    medication: string;
    severity: string;
    crossReactivity?: boolean;
  }>;
  contraindications: Array<{
    medication: string;
    condition: string;
    type: 'absolute' | 'relative';
    description: string;
  }>;
  doseValidation: {
    hasErrors: boolean;
    warnings: string[];
    validations: Array<{
      medication: string;
      prescribedDose: string;
      therapeuticRange: { min: string; max: string };
      status: 'ok' | 'warning' | 'error';
    }>;
  };
  guidelines: Array<{
    guideline: string;
    recommendation: string;
    evidenceLevel: string;
  }>;
  overallRisk: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: {
      interactions: number;
      allergies: number;
      contraindications: number;
      doseIssues: number;
    };
  };
}

export class CDSClient {
  private client: AxiosInstance;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_CDS_INTEGRATION === 'true';
    this.client = axios.create({
      baseURL: process.env.CDS_SERVICE_URL || 'http://localhost:4002',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check medication safety
   */
  async checkMedicationSafety(
    data: MedicationSafetyCheck,
    authToken: string
  ): Promise<SafetyAssessment | null> {
    if (!this.enabled) {
      logger.warn('CDS integration disabled - skipping safety check');
      return null;
    }

    try {
      logger.info(`Checking medication safety for patient ${data.patientId}`);

      const response = await this.client.post<{ success: boolean; data: SafetyAssessment }>(
        '/api/v1/check-medication',
        data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (response.data.success) {
        logger.info(`Safety check complete - Risk level: ${response.data.data.overallRisk.level}`);
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      logger.error('CDS service error:', error.message);
      
      // Don't block prescription if CDS service is down
      // but log the error for investigation
      if (error.code === 'ECONNREFUSED') {
        logger.error('⚠️ CDS Service unavailable - proceeding without safety check');
      }
      
      return null;
    }
  }

  /**
   * Check if CDS service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
```

### Step 3: Update MedicationController

Modify `src/controllers/MedicationController.ts`:

```typescript
import { Request, Response } from 'express';
import { MedicationService } from '../services/MedicationService';
import { PatientService } from '../services/PatientService';
import { CDSClient } from '../clients/CDSClient';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { EventPublisher } from '../events/EventPublisher';

export class MedicationController {
  private medicationService: MedicationService;
  private patientService: PatientService;
  private cdsClient: CDSClient;
  private eventPublisher: EventPublisher;

  constructor() {
    this.medicationService = new MedicationService();
    this.patientService = new PatientService();
    this.cdsClient = new CDSClient();
    this.eventPublisher = new EventPublisher();
  }

  /**
   * Prescribe new medication with CDS safety check
   */
  prescribeMedication = async (req: Request, res: Response) => {
    try {
      const medicationData = req.body;
      const organizationId = req.user?.organizationId;
      const prescribedBy = req.user?.userId;
      const authToken = req.headers.authorization?.substring(7) || ''; // Remove 'Bearer '

      if (!organizationId || !prescribedBy) {
        throw createError('User context required', 400);
      }

      // 1️⃣ Get patient data
      const patient = await this.patientService.getPatientById(
        medicationData.patientId,
        organizationId
      );

      if (!patient) {
        throw createError('Patient not found', 404);
      }

      // 2️⃣ Get patient's current medications
      const currentMedications = await this.medicationService.getActiveMedications(
        patient.id,
        organizationId
      );

      // 3️⃣ Call CDS Service for safety check
      const safetyCheck = await this.cdsClient.checkMedicationSafety(
        {
          patientId: patient.id,
          medications: [
            ...currentMedications.map(m => ({
              id: m.id,
              name: m.name,
              dose: m.dosage,
              frequency: m.frequency
            })),
            {
              name: medicationData.name,
              dose: medicationData.dosage,
              frequency: medicationData.frequency
            }
          ],
          allergies: patient.allergies || [],
          conditions: patient.conditions || []
        },
        authToken
      );

      // 4️⃣ Handle HIGH RISK medications
      if (safetyCheck && safetyCheck.overallRisk.level === 'high') {
        logger.warn(`⚠️ HIGH RISK prescription attempt for patient ${patient.id}`);

        // Check if doctor is overriding
        if (!req.body.overrideReason) {
          // Require override justification for high-risk prescriptions
          return res.status(400).json({
            success: false,
            error: 'High-risk prescription requires override justification',
            safetyAssessment: safetyCheck,
            requiresOverride: true
          });
        }

        // Log override
        logger.warn(`⚠️ Doctor ${prescribedBy} overrode high-risk prescription`);
        logger.warn(`Override reason: ${req.body.overrideReason}`);
      }

      // 5️⃣ Handle MEDIUM RISK - show warnings but allow
      if (safetyCheck && safetyCheck.overallRisk.level === 'medium') {
        logger.info(`⚠️ MEDIUM RISK prescription for patient ${patient.id}`);
      }

      // 6️⃣ Save prescription
      const medication = await this.medicationService.create({
        ...medicationData,
        organizationId,
        prescribedBy,
        safetyCheckPerformed: !!safetyCheck,
        safetyRiskLevel: safetyCheck?.overallRisk.level || 'unknown',
        overrideReason: req.body.overrideReason || null
      });

      // 7️⃣ Publish event
      await this.eventPublisher.publishEvent('medication.prescribed', {
        medicationId: medication.id,
        patientId: patient.id,
        organizationId,
        prescribedBy,
        riskLevel: safetyCheck?.overallRisk.level || 'unknown',
        timestamp: new Date().toISOString()
      });

      // 8️⃣ Return response with safety assessment
      logger.info(`✅ Medication prescribed for patient ${patient.id}`);

      res.status(201).json({
        success: true,
        data: {
          medication,
          safetyAssessment: safetyCheck
        }
      });
    } catch (error) {
      logger.error('Error prescribing medication:', error);
      throw error;
    }
  };

  // ... other methods
}
```

### Step 4: Real-time Alerts Integration

Both services should communicate via WebSocket for critical alerts.

**In Clinical Service - Listen for CDS alerts:**

```typescript
// src/events/CDSAlertHandler.ts
import { Server } from 'socket.io';
import io from 'socket.io-client';
import { logger } from '../utils/logger';

export class CDSAlertHandler {
  private cdsSocket: any;
  private clinicalIO: Server;

  constructor(clinicalIO: Server) {
    this.clinicalIO = clinicalIO;
    this.connectToCDS();
  }

  private connectToCDS() {
    const cdsUrl = process.env.CDS_SERVICE_URL || 'http://localhost:4002';
    
    this.cdsSocket = io(cdsUrl, {
      auth: {
        // Use service-to-service authentication token
        token: process.env.SERVICE_AUTH_TOKEN
      }
    });

    this.cdsSocket.on('connect', () => {
      logger.info('✅ Connected to CDS Service for real-time alerts');
      
      // Join clinical staff room to receive all alerts
      this.cdsSocket.emit('join-clinical-team', 'all-staff');
    });

    // Listen for critical clinical alerts from CDS
    this.cdsSocket.on('clinical-alert', (alert: any) => {
      logger.warn('⚠️ CRITICAL ALERT received from CDS:', alert);
      
      // Broadcast to clinical service clients
      this.clinicalIO.to(`patient-${alert.details.patientId}`).emit('critical-alert', {
        type: 'medication-safety',
        source: 'cds-service',
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        timestamp: alert.timestamp
      });

      // Also broadcast to organization room
      this.clinicalIO.to(`organization-${alert.organizationId}`).emit('clinical-alert', alert);
    });

    this.cdsSocket.on('disconnect', () => {
      logger.warn('⚠️ Disconnected from CDS Service');
    });

    this.cdsSocket.on('connect_error', (error: any) => {
      logger.error('CDS WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.cdsSocket) {
      this.cdsSocket.disconnect();
    }
  }
}
```

**Update Clinical Service index.ts:**

```typescript
import { CDSAlertHandler } from './events/CDSAlertHandler';

// After creating Socket.IO server
const io = new Server(server, { /* config */ });

// Set up CDS alert forwarding
const cdsAlertHandler = new CDSAlertHandler(io);

// Graceful shutdown
process.on('SIGTERM', () => {
  cdsAlertHandler.disconnect();
  // ... other cleanup
});
```

### Step 5: Event-Driven Communication

**Clinical Service publishes events that CDS Service listens to:**

```typescript
// Events published by Clinical Service
export const CLINICAL_EVENTS = {
  PATIENT_CREATED: 'patient.created',
  PATIENT_UPDATED: 'patient.updated',
  PATIENT_DELETED: 'patient.deleted',
  MEDICATION_PRESCRIBED: 'medication.prescribed',
  MEDICATION_UPDATED: 'medication.updated',
  MEDICATION_DISCONTINUED: 'medication.discontinued',
  ENCOUNTER_CREATED: 'encounter.created',
  ENCOUNTER_COMPLETED: 'encounter.completed',
  DIAGNOSTIC_CREATED: 'diagnostic.created',
  VITAL_SIGNS_RECORDED: 'vital.signs.recorded'
};
```

**CDS Service can listen to these events** (future implementation):

```typescript
// In CDS Service - src/events/KafkaConsumer.ts
import { Kafka } from 'kafkajs';

export class ClinicalEventConsumer {
  private kafka: Kafka;
  private consumer: any;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'cds-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    });
  }

  async start() {
    this.consumer = this.kafka.consumer({ groupId: 'cds-service-group' });
    await this.consumer.connect();

    await this.consumer.subscribe({
      topics: ['medication-events', 'patient-events'],
      fromBeginning: false
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());

        switch (event.eventType) {
          case 'medication.prescribed':
            await this.handleMedicationPrescribed(event.eventData);
            break;

          case 'patient.updated':
            await this.updatePatientCache(event.eventData);
            break;

          // ... other event handlers
        }
      }
    });
  }

  private async handleMedicationPrescribed(data: any) {
    // CDS could re-run checks asynchronously
    // Store medication for future interaction checks
    // Update ML models with new prescription data
  }

  private async updatePatientCache(data: any) {
    // Update cached patient allergies/conditions
    // Invalidate old risk assessments
  }
}
```

## 🔄 Complete Integration Flow

### Scenario: Doctor Prescribes Warfarin to Patient on Aspirin

```
Step 1: Doctor Opens Patient Chart (Clinical Service)
├─► GET /api/v1/patients/123
└─► Response: Patient data including active medications (Aspirin 81mg)

Step 2: Doctor Prescribes Warfarin (Clinical Service)
├─► POST /api/v1/medications
├─► Request Body: { name: "Warfarin", dose: "5mg", ... }
└─► MedicationController.prescribeMedication()

Step 3: Clinical Service → CDS Service
├─► CDSClient.checkMedicationSafety()
├─► POST http://cds-service:4002/api/v1/check-medication
├─► Request: {
│     patientId: "123",
│     medications: [
│       { name: "Aspirin", dose: "81mg" },  // existing
│       { name: "Warfarin", dose: "5mg" }   // new
│     ],
│     allergies: ["Penicillin"],
│     conditions: [{ code: "I48.91", name: "A-Fib" }]
│   }
└─► CDS Service processes request

Step 4: CDS Service Performs Checks
├─► DrugInteractionService.checkInteractions()
│   └─► FOUND: Warfarin + Aspirin = MAJOR bleeding risk
├─► AllergyService.checkAllergies()
│   └─► OK: No allergy match
├─► ContraindicationService.check()
│   └─► OK: Warfarin appropriate for A-Fib
├─► DoseValidationService.validate()
│   └─► OK: 5mg within therapeutic range
├─► ClinicalGuidelinesService.check()
│   └─► FOUND: CHADS2-VASc guideline for A-Fib
└─► Calculate Overall Risk Score: 8 (MEDIUM)

Step 5: CDS Service → Clinical Service Response
└─► Response: {
      interactions: [{
        severity: "major",
        drugs: ["Warfarin", "Aspirin"],
        description: "Increased bleeding risk",
        recommendation: "Monitor INR closely, consider reducing aspirin dose"
      }],
      allergyAlerts: [],
      contraindications: [],
      doseValidation: { hasErrors: false },
      guidelines: [{
        guideline: "CHADS2-VASc for A-Fib",
        recommendation: "Anticoagulation indicated",
        evidenceLevel: "A"
      }],
      overallRisk: {
        score: 8,
        level: "medium",  // Not "high" so no override required
        factors: { interactions: 1, allergies: 0, ... }
      }
    }

Step 6: Clinical Service UI Shows Warning
├─► Yellow warning badge
├─► "⚠️ DRUG INTERACTION: Warfarin + Aspirin"
├─► Shows recommendation: "Monitor INR closely"
├─► Doctor can:
│   ├─► Proceed with prescription
│   ├─► Modify dose
│   └─► Cancel prescription

Step 7: Doctor Proceeds (Medium Risk = OK)
├─► Clinical Service saves prescription
├─► Includes safetyRiskLevel: "medium"
└─► INSERT INTO medications (...)

Step 8: Clinical Service Publishes Event
├─► EventPublisher.publishEvent('medication.prescribed')
├─► Kafka topic: medication-events
└─► Event data: {
      medicationId: "MED-789",
      patientId: "123",
      riskLevel: "medium",
      timestamp: "2025-10-14T..."
    }

Step 9: Other Services React
├─► Billing Service: Creates charge for medication
├─► Pharmacy Service: Receives prescription
├─► Notification Service: Sends patient reminder
└─► Analytics Service: Records prescribing pattern

Step 10: Ongoing Monitoring
└─► CDS Service continues monitoring patient
    └─► If lab results show high INR → Send alert
```

## 🛡️ Safety Features

### 1. Fail-Safe Behavior

If CDS Service is unavailable:
```typescript
const safetyCheck = await this.cdsClient.checkMedicationSafety(...);

if (!safetyCheck) {
  // CDS service unavailable
  logger.warn('⚠️ Proceeding without CDS safety check');
  
  // Still allow prescription but flag for review
  medication.safetyCheckPerformed = false;
  medication.requiresReview = true;
}
```

### 2. Override System

For high-risk prescriptions:
```typescript
if (safetyCheck.overallRisk.level === 'high') {
  if (!req.body.overrideReason) {
    return res.status(400).json({
      error: 'Override justification required',
      safetyAssessment: safetyCheck,
      requiresOverride: true
    });
  }
  
  // Log override for audit
  await auditLog.create({
    action: 'HIGH_RISK_OVERRIDE',
    userId: prescribedBy,
    patientId: patient.id,
    reason: req.body.overrideReason,
    safetyData: safetyCheck
  });
}
```

### 3. Real-time Alerts

CDS broadcasts critical alerts:
```javascript
// In Clinical UI
socket.on('critical-alert', (alert) => {
  // Show modal overlay
  showCriticalAlert({
    title: '🚨 CRITICAL MEDICATION ALERT',
    message: alert.message,
    patient: alert.details.patientId,
    severity: 'critical',
    requiresAcknowledgment: true
  });
  
  // Play alert sound
  playAlertSound('critical');
  
  // Flash notification
  flashNotification('red');
});
```

## 📊 Monitoring & Metrics

### Track Integration Health

```typescript
// In Clinical Service
export const metrics = {
  cdsCallsTotal: new Counter('cds_calls_total'),
  cdsCallsSuccessful: new Counter('cds_calls_successful'),
  cdsCallsFailed: new Counter('cds_calls_failed'),
  cdsResponseTime: new Histogram('cds_response_time_seconds'),
  highRiskPrescriptions: new Counter('high_risk_prescriptions_total'),
  overrideAttempts: new Counter('prescription_overrides_total')
};

// Track metrics
const start = Date.now();
try {
  const safety = await cdsClient.checkMedicationSafety(...);
  metrics.cdsCallsSuccessful.inc();
  metrics.cdsResponseTime.observe((Date.now() - start) / 1000);
  
  if (safety.overallRisk.level === 'high') {
    metrics.highRiskPrescriptions.inc();
  }
} catch (error) {
  metrics.cdsCallsFailed.inc();
}
```

## 🧪 Testing the Integration

### 1. Unit Tests

```typescript
describe('MedicationController', () => {
  it('should call CDS service when prescribing medication', async () => {
    const cdsClient = new CDSClient();
    jest.spyOn(cdsClient, 'checkMedicationSafety')
      .mockResolvedValue({ overallRisk: { level: 'low' } });

    const controller = new MedicationController();
    await controller.prescribeMedication(req, res);

    expect(cdsClient.checkMedicationSafety).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: '123',
        medications: expect.any(Array)
      }),
      authToken
    );
  });

  it('should block high-risk prescriptions without override', async () => {
    cdsClient.mockReturnValue({ overallRisk: { level: 'high' } });

    await controller.prescribeMedication(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ requiresOverride: true })
    );
  });
});
```

### 2. Integration Tests

```bash
# Start both services
npm run dev:clinical  # Port 3004
npm run dev:cds       # Port 4002

# Test prescription flow
curl -X POST http://localhost:3004/api/v1/medications \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": "test-patient-id",
    "name": "Warfarin",
    "dosage": "5mg",
    "frequency": "daily"
  }'

# Should return with safety assessment
```

## 📚 Best Practices

1. **Always call CDS for new prescriptions**
2. **Handle CDS service unavailability gracefully**
3. **Log all high-risk overrides for audit**
4. **Display safety warnings prominently in UI**
5. **Use WebSocket for critical real-time alerts**
6. **Monitor integration health with metrics**
7. **Test both services together regularly**
8. **Keep event schemas synchronized**
9. **Use service-to-service authentication**
10. **Implement circuit breaker for CDS calls**

---

**This integration creates a safer, smarter healthcare system! 🏥💊✅**

