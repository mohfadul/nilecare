/**
 * Lab Result Model (PostgreSQL)
 * Represents test results with critical value tracking
 */

export interface LabResult {
  id: string;
  
  // References
  labOrderId: string;
  testId: string;
  sampleId: string;
  patientId: string;
  
  // Result data
  resultValue: string;
  resultUnit?: string;
  resultType: 'numeric' | 'text' | 'coded' | 'document';
  
  // Reference range
  referenceRange?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeUnit?: string;
  
  // Interpretation
  flag: 'normal' | 'abnormal' | 'critical' | 'high' | 'low' | 'panic';
  interpretation?: string;
  isCritical: boolean;
  
  // Performing details
  performedBy: string; // Technician ID
  performedAt: Date;
  instrumentId?: string;
  methodology?: string;
  
  // Quality control
  qcStatus: 'passed' | 'failed' | 'pending';
  qcNotes?: string;
  
  // Status
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  
  // Review and release
  reviewedBy?: string;
  reviewedAt?: Date;
  releasedBy?: string;
  releasedAt?: Date;
  reviewNotes?: string;
  
  // Critical value notification
  criticalValueNotified: boolean;
  criticalValueNotifiedAt?: Date;
  criticalValueNotifiedTo?: string[]; // User IDs
  criticalValueAcknowledgedBy?: string;
  criticalValueAcknowledgedAt?: Date;
  
  // Corrections
  isPreliminary: boolean;
  isCorrected: boolean;
  correctionReason?: string;
  correctedFrom?: string; // Previous value
  correctedBy?: string;
  correctedAt?: Date;
  
  // Notes
  technicianNotes?: string;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabResultDTO {
  labOrderId: string;
  testId: string;
  sampleId: string;
  patientId: string;
  resultValue: string;
  resultUnit?: string;
  resultType?: string;
  referenceRange?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  flag?: string;
  interpretation?: string;
  performedBy: string;
  performedAt: Date;
  instrumentId?: string;
  methodology?: string;
  technicianNotes?: string;
  facilityId: string;
  organizationId?: string;
}

export interface UpdateLabResultDTO {
  resultValue?: string;
  flag?: string;
  interpretation?: string;
  status?: string;
  qcStatus?: string;
  qcNotes?: string;
  technicianNotes?: string;
}

export default LabResult;

