/**
 * Clinical Event Service
 * Event-driven communication using Apache Kafka
 * Sudan-specific: Includes Sudan National ID in event metadata
 */

import { Kafka, Producer, Consumer, EachMessagePayload, CompressionTypes } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

// Event Types
export type ClinicalEventType =
  | 'patient_registered'
  | 'patient_updated'
  | 'patient_admitted'
  | 'patient_discharged'
  | 'patient_transferred'
  | 'encounter_created'
  | 'encounter_updated'
  | 'encounter_closed'
  | 'diagnosis_added'
  | 'diagnosis_updated'
  | 'medication_prescribed'
  | 'medication_administered'
  | 'medication_discontinued'
  | 'lab_order_created'
  | 'lab_result_available'
  | 'critical_value_detected'
  | 'allergy_added'
  | 'vital_signs_recorded'
  | 'device_alert_triggered'
  | 'appointment_scheduled'
  | 'appointment_cancelled'
  | 'consent_granted'
  | 'consent_revoked'
  | 'sudan_national_id_accessed';  // Sudan-specific

export interface ClinicalEvent {
  eventId: string;
  eventType: ClinicalEventType;
  timestamp: Date;
  version: string;
  
  // Context
  patientId: string;
  patientMRN?: string;
  facilityId: string;
  tenantId: string;
  sudanState?: string;
  
  // Actor
  userId?: string;
  userName?: string;
  userRole?: string;
  
  // Event Data
  data: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Correlation
  correlationId?: string;
  causationId?: string;
  
  // Source
  source: string;
  sourceVersion?: string;
}

export interface EventHandler {
  (event: ClinicalEvent): Promise<void>;
}

export interface EventSubscription {
  topic: string;
  groupId: string;
  handler: EventHandler;
}

export class ClinicalEventService extends EventEmitter {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer>;
  private readonly clientId: string;

  // Kafka Topics
  private readonly TOPICS = {
    CLINICAL_EVENTS: 'clinical-events',
    PATIENT_EVENTS: 'patient-events',
    MEDICATION_EVENTS: 'medication-events',
    LAB_EVENTS: 'lab-events',
    DEVICE_EVENTS: 'device-events',
    APPOINTMENT_EVENTS: 'appointment-events',
    BILLING_EVENTS: 'billing-events',
    AUDIT_EVENTS: 'audit-events',
    ALERT_EVENTS: 'alert-events',
    // Sudan-specific
    SUDAN_COMPLIANCE_EVENTS: 'sudan-compliance-events'
  };

  constructor() {
    super();
    this.clientId = `nilecare-${process.env.SERVICE_NAME || 'clinical'}-${uuidv4()}`;
    this.consumers = new Map();

    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      ssl: process.env.KAFKA_SSL === 'true',
      sasl: process.env.KAFKA_USERNAME ? {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD!
      } : undefined,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        multiplier: 2
      },
      connectionTimeout: 10000,
      requestTimeout: 30000
    });

    // Initialize producer
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      transactionalId: this.clientId,
      maxInFlightRequests: 5,
      idempotent: true
      // Note: compression is set per-message, not in producer config
    });

    this.initializeProducer();
  }

  /**
   * Initialize Kafka producer
   */
  private async initializeProducer(): Promise<void> {
    try {
      await this.producer.connect();
      console.log('Kafka producer connected');
    } catch (error) {
      console.error('Error connecting Kafka producer:', error);
      throw error;
    }
  }

  /**
   * Publish clinical event
   * @param event - Clinical event to publish
   */
  async publishClinicalEvent(event: Omit<ClinicalEvent, 'eventId' | 'timestamp' | 'version'>): Promise<void> {
    const fullEvent: ClinicalEvent = {
      eventId: uuidv4(),
      timestamp: new Date(),
      version: '1.0',
      ...event
    };

    try {
      await this.producer.send({
        topic: this.getTopicForEventType(event.eventType),
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: event.patientId,
            value: JSON.stringify(fullEvent),
            headers: {
              'event-id': fullEvent.eventId,
              'event-type': fullEvent.eventType,
              'patient-id': fullEvent.patientId,
              'facility-id': fullEvent.facilityId,
              'tenant-id': fullEvent.tenantId,
              'timestamp': fullEvent.timestamp.toISOString(),
              'correlation-id': fullEvent.correlationId || fullEvent.eventId,
              'source': fullEvent.source,
              // Sudan-specific
              'sudan-state': fullEvent.sudanState || ''
            },
            partition: this.getPartitionKey(fullEvent.facilityId)
          }
        ]
      });

      console.log(`Published event: ${fullEvent.eventType} for patient ${fullEvent.patientId}`);
      this.emit('event_published', fullEvent);

    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to clinical events
   * @param subscription - Event subscription configuration
   */
  async subscribeToClinicalEvents(subscription: EventSubscription): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: subscription.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    try {
      await consumer.connect();
      await consumer.subscribe({ 
        topic: subscription.topic,
        fromBeginning: false
      });

      await consumer.run({
        autoCommit: false,
        eachMessage: async (payload: EachMessagePayload) => {
          try {
            const event: ClinicalEvent = JSON.parse(payload.message.value!.toString());
            
            // Process event
            await subscription.handler(event);
            
            // Commit offset after successful processing
            await consumer.commitOffsets([{
              topic: payload.topic,
              partition: payload.partition,
              offset: (parseInt(payload.message.offset) + 1).toString()
            }]);

            this.emit('event_processed', event);

          } catch (error) {
            console.error('Error processing event:', error);
            
            // Send to dead letter queue
            await this.sendToDeadLetterQueue(payload.message, error);
            
            // Commit offset to avoid reprocessing
            await consumer.commitOffsets([{
              topic: payload.topic,
              partition: payload.partition,
              offset: (parseInt(payload.message.offset) + 1).toString()
            }]);
          }
        }
      });

      this.consumers.set(subscription.groupId, consumer);
      console.log(`Subscribed to ${subscription.topic} with group ${subscription.groupId}`);

    } catch (error) {
      console.error('Error subscribing to events:', error);
      throw error;
    }
  }

  /**
   * Publish patient registered event
   */
  async publishPatientRegistered(data: {
    patientId: string;
    mrn: string;
    firstName: string;
    lastName: string;
    sudanNationalId?: string;
    facilityId: string;
    tenantId: string;
    sudanState?: string;
    userId: string;
  }): Promise<void> {
    await this.publishClinicalEvent({
      eventType: 'patient_registered',
      patientId: data.patientId,
      patientMRN: data.mrn,
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      sudanState: data.sudanState,
      userId: data.userId,
      source: 'ehr-service',
      data: {
        mrn: data.mrn,
        firstName: data.firstName,
        lastName: data.lastName,
        sudanNationalId: data.sudanNationalId,
        registeredAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish critical value detected event
   */
  async publishCriticalValueDetected(data: {
    patientId: string;
    facilityId: string;
    tenantId: string;
    parameter: string;
    value: number;
    threshold: number;
    deviceId?: string;
  }): Promise<void> {
    await this.publishClinicalEvent({
      eventType: 'critical_value_detected',
      patientId: data.patientId,
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      source: 'device-integration-service',
      data: {
        parameter: data.parameter,
        value: data.value,
        threshold: data.threshold,
        deviceId: data.deviceId,
        severity: 'critical',
        detectedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish Sudan National ID accessed event
   */
  async publishSudanNationalIdAccessed(data: {
    patientId: string;
    facilityId: string;
    tenantId: string;
    userId: string;
    userRole: string;
    accessReason: string;
    sudanState?: string;
  }): Promise<void> {
    await this.publishClinicalEvent({
      eventType: 'sudan_national_id_accessed',
      patientId: data.patientId,
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      sudanState: data.sudanState,
      userId: data.userId,
      userRole: data.userRole,
      source: 'ehr-service',
      data: {
        accessReason: data.accessReason,
        accessedAt: new Date().toISOString(),
        ipAddress: '', // Would be populated from request
        requiresAudit: true
      }
    });
  }

  /**
   * Publish medication prescribed event
   */
  async publishMedicationPrescribed(data: {
    patientId: string;
    medicationId: string;
    medicationName: string;
    prescribedBy: string;
    facilityId: string;
    tenantId: string;
    isHighAlert: boolean;
  }): Promise<void> {
    await this.publishClinicalEvent({
      eventType: 'medication_prescribed',
      patientId: data.patientId,
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      userId: data.prescribedBy,
      source: 'medication-service',
      data: {
        medicationId: data.medicationId,
        medicationName: data.medicationName,
        isHighAlert: data.isHighAlert,
        prescribedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Publish lab result available event
   */
  async publishLabResultAvailable(data: {
    patientId: string;
    labOrderId: string;
    resultId: string;
    isCritical: boolean;
    facilityId: string;
    tenantId: string;
  }): Promise<void> {
    await this.publishClinicalEvent({
      eventType: 'lab_result_available',
      patientId: data.patientId,
      facilityId: data.facilityId,
      tenantId: data.tenantId,
      source: 'lab-service',
      data: {
        labOrderId: data.labOrderId,
        resultId: data.resultId,
        isCritical: data.isCritical,
        resultedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Get topic for event type
   */
  private getTopicForEventType(eventType: ClinicalEventType): string {
    if (eventType.startsWith('patient_')) {
      return this.TOPICS.PATIENT_EVENTS;
    } else if (eventType.startsWith('medication_')) {
      return this.TOPICS.MEDICATION_EVENTS;
    } else if (eventType.startsWith('lab_')) {
      return this.TOPICS.LAB_EVENTS;
    } else if (eventType.startsWith('device_') || eventType.includes('vital_signs') || eventType.includes('critical_value')) {
      return this.TOPICS.DEVICE_EVENTS;
    } else if (eventType.startsWith('appointment_')) {
      return this.TOPICS.APPOINTMENT_EVENTS;
    } else if (eventType === 'sudan_national_id_accessed') {
      return this.TOPICS.SUDAN_COMPLIANCE_EVENTS;
    } else {
      return this.TOPICS.CLINICAL_EVENTS;
    }
  }

  /**
   * Get partition key (for ordering guarantees)
   */
  private getPartitionKey(facilityId: string): number {
    // Hash facility ID to partition number (0-15)
    let hash = 0;
    for (let i = 0; i < facilityId.length; i++) {
      hash = ((hash << 5) - hash) + facilityId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 16;
  }

  /**
   * Send failed message to dead letter queue
   */
  private async sendToDeadLetterQueue(message: any, error: any): Promise<void> {
    try {
      await this.producer.send({
        topic: 'dead-letter-queue',
        messages: [{
          key: message.key?.toString(),
          value: message.value?.toString(),
          headers: {
            ...message.headers,
            'error-message': error.message,
            'failed-at': new Date().toISOString()
          }
        }]
      });
    } catch (dlqError) {
      console.error('Error sending to DLQ:', dlqError);
    }
  }

  /**
   * Disconnect all consumers and producer
   */
  async disconnect(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        console.log(`Disconnected consumer: ${groupId}`);
      }

      // Disconnect producer
      await this.producer.disconnect();
      console.log('Disconnected producer');

    } catch (error) {
      console.error('Error disconnecting Kafka:', error);
    }
  }
}

// Event Handlers for Different Services

/**
 * EHR Service Event Handler
 */
export class EHREventHandler {
  async handlePatientRegistered(event: ClinicalEvent): Promise<void> {
    console.log('EHR: Patient registered', event.data);
    
    // Update EHR records
    // Send welcome notification
    // Create initial health record
  }

  async handleCriticalValueDetected(event: ClinicalEvent): Promise<void> {
    console.log('EHR: Critical value detected', event.data);
    
    // Update patient chart
    // Notify attending physician
    // Create alert in EHR
  }

  async handleLabResultAvailable(event: ClinicalEvent): Promise<void> {
    console.log('EHR: Lab result available', event.data);
    
    // Update patient record
    // Notify ordering provider
    // Check for critical values
  }
}

/**
 * CDS Service Event Handler
 */
export class CDSEventHandler {
  async handleMedicationPrescribed(event: ClinicalEvent): Promise<void> {
    console.log('CDS: Medication prescribed', event.data);
    
    // Check drug interactions
    // Check allergies
    // Validate dose
    // Generate alerts if needed
  }

  async handleDiagnosisAdded(event: ClinicalEvent): Promise<void> {
    console.log('CDS: Diagnosis added', event.data);
    
    // Check clinical guidelines
    // Suggest treatment protocols
    // Generate recommendations
  }
}

/**
 * Notification Service Event Handler
 */
export class NotificationEventHandler {
  async handleCriticalValueDetected(event: ClinicalEvent): Promise<void> {
    console.log('Notification: Critical value detected', event.data);
    
    // Send SMS to physician (Sudan +249 format)
    // Send push notification
    // Send email alert
  }

  async handleAppointmentScheduled(event: ClinicalEvent): Promise<void> {
    console.log('Notification: Appointment scheduled', event.data);
    
    // Send confirmation SMS (Sudan +249)
    // Send email confirmation
    // Schedule reminder
  }

  async handleLabResultAvailable(event: ClinicalEvent): Promise<void> {
    console.log('Notification: Lab result available', event.data);
    
    // Notify ordering provider
    // Notify patient (if configured)
  }
}

/**
 * Audit Service Event Handler
 */
export class AuditEventHandler {
  async handleSudanNationalIdAccessed(event: ClinicalEvent): Promise<void> {
    console.log('Audit: Sudan National ID accessed', event.data);
    
    // Log in PHI audit trail
    // Check for suspicious access patterns
    // Update compliance metrics
  }

  async handlePatientUpdated(event: ClinicalEvent): Promise<void> {
    console.log('Audit: Patient updated', event.data);
    
    // Log changes in audit trail
    // Track who made changes
    // Store before/after values
  }
}

/**
 * FHIR Service Event Handler
 */
export class FHIREventHandler {
  async handlePatientRegistered(event: ClinicalEvent): Promise<void> {
    console.log('FHIR: Patient registered', event.data);
    
    // Create FHIR Patient resource
    // Store in FHIR repository
    // Update FHIR search indexes
  }

  async handleVitalSignsRecorded(event: ClinicalEvent): Promise<void> {
    console.log('FHIR: Vital signs recorded', event.data);
    
    // Create FHIR Observation resources
    // Store in FHIR repository
    // Update patient timeline
  }

  async handleLabResultAvailable(event: ClinicalEvent): Promise<void> {
    console.log('FHIR: Lab result available', event.data);
    
    // Create FHIR DiagnosticReport
    // Create FHIR Observation resources
    // Update FHIR repository
  }
}

export default ClinicalEventService;
