/**
 * Clinical Event Service
 * Event-driven communication using Apache Kafka
 * Sudan-specific: Includes Sudan National ID in event metadata
 */
import { EventEmitter } from 'events';
export type ClinicalEventType = 'patient_registered' | 'patient_updated' | 'patient_admitted' | 'patient_discharged' | 'patient_transferred' | 'encounter_created' | 'encounter_updated' | 'encounter_closed' | 'diagnosis_added' | 'diagnosis_updated' | 'medication_prescribed' | 'medication_administered' | 'medication_discontinued' | 'lab_order_created' | 'lab_result_available' | 'critical_value_detected' | 'allergy_added' | 'vital_signs_recorded' | 'device_alert_triggered' | 'appointment_scheduled' | 'appointment_cancelled' | 'consent_granted' | 'consent_revoked' | 'sudan_national_id_accessed';
export interface ClinicalEvent {
    eventId: string;
    eventType: ClinicalEventType;
    timestamp: Date;
    version: string;
    patientId: string;
    patientMRN?: string;
    facilityId: string;
    tenantId: string;
    sudanState?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
    correlationId?: string;
    causationId?: string;
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
export declare class ClinicalEventService extends EventEmitter {
    private kafka;
    private producer;
    private consumers;
    private readonly clientId;
    private readonly TOPICS;
    constructor();
    /**
     * Initialize Kafka producer
     */
    private initializeProducer;
    /**
     * Publish clinical event
     * @param event - Clinical event to publish
     */
    publishClinicalEvent(event: Omit<ClinicalEvent, 'eventId' | 'timestamp' | 'version'>): Promise<void>;
    /**
     * Subscribe to clinical events
     * @param subscription - Event subscription configuration
     */
    subscribeToClinicalEvents(subscription: EventSubscription): Promise<void>;
    /**
     * Publish patient registered event
     */
    publishPatientRegistered(data: {
        patientId: string;
        mrn: string;
        firstName: string;
        lastName: string;
        sudanNationalId?: string;
        facilityId: string;
        tenantId: string;
        sudanState?: string;
        userId: string;
    }): Promise<void>;
    /**
     * Publish critical value detected event
     */
    publishCriticalValueDetected(data: {
        patientId: string;
        facilityId: string;
        tenantId: string;
        parameter: string;
        value: number;
        threshold: number;
        deviceId?: string;
    }): Promise<void>;
    /**
     * Publish Sudan National ID accessed event
     */
    publishSudanNationalIdAccessed(data: {
        patientId: string;
        facilityId: string;
        tenantId: string;
        userId: string;
        userRole: string;
        accessReason: string;
        sudanState?: string;
    }): Promise<void>;
    /**
     * Publish medication prescribed event
     */
    publishMedicationPrescribed(data: {
        patientId: string;
        medicationId: string;
        medicationName: string;
        prescribedBy: string;
        facilityId: string;
        tenantId: string;
        isHighAlert: boolean;
    }): Promise<void>;
    /**
     * Publish lab result available event
     */
    publishLabResultAvailable(data: {
        patientId: string;
        labOrderId: string;
        resultId: string;
        isCritical: boolean;
        facilityId: string;
        tenantId: string;
    }): Promise<void>;
    /**
     * Get topic for event type
     */
    private getTopicForEventType;
    /**
     * Get partition key (for ordering guarantees)
     */
    private getPartitionKey;
    /**
     * Send failed message to dead letter queue
     */
    private sendToDeadLetterQueue;
    /**
     * Disconnect all consumers and producer
     */
    disconnect(): Promise<void>;
}
/**
 * EHR Service Event Handler
 */
export declare class EHREventHandler {
    handlePatientRegistered(event: ClinicalEvent): Promise<void>;
    handleCriticalValueDetected(event: ClinicalEvent): Promise<void>;
    handleLabResultAvailable(event: ClinicalEvent): Promise<void>;
}
/**
 * CDS Service Event Handler
 */
export declare class CDSEventHandler {
    handleMedicationPrescribed(event: ClinicalEvent): Promise<void>;
    handleDiagnosisAdded(event: ClinicalEvent): Promise<void>;
}
/**
 * Notification Service Event Handler
 */
export declare class NotificationEventHandler {
    handleCriticalValueDetected(event: ClinicalEvent): Promise<void>;
    handleAppointmentScheduled(event: ClinicalEvent): Promise<void>;
    handleLabResultAvailable(event: ClinicalEvent): Promise<void>;
}
/**
 * Audit Service Event Handler
 */
export declare class AuditEventHandler {
    handleSudanNationalIdAccessed(event: ClinicalEvent): Promise<void>;
    handlePatientUpdated(event: ClinicalEvent): Promise<void>;
}
/**
 * FHIR Service Event Handler
 */
export declare class FHIREventHandler {
    handlePatientRegistered(event: ClinicalEvent): Promise<void>;
    handleVitalSignsRecorded(event: ClinicalEvent): Promise<void>;
    handleLabResultAvailable(event: ClinicalEvent): Promise<void>;
}
export default ClinicalEventService;
//# sourceMappingURL=ClinicalEventService.d.ts.map