/**
 * Lab Order Model (PostgreSQL)
 * Represents lab test orders from physicians
 */

export interface LabOrder {
  id: string;
  orderNumber: string; // Format: LAB-YYYYMMDD-XXXXXX
  
  // References
  patientId: string;
  providerId: string; // Ordering physician
  appointmentId?: string;
  encounterId?: string;
  
  // Tests ordered
  tests: Array<{
    testId: string;
    testName: string;
    priority: 'routine' | 'urgent' | 'stat';
    status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
    notes?: string;
  }>;
  
  // Clinical information
  clinicalNotes?: string;
  diagnosisCode?: string; // ICD-10
  indication?: string;
  
  // Status tracking
  status: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled' | 'partial';
  
  // Priority
  priority: 'routine' | 'urgent' | 'stat';
  
  // Dates
  orderedDate: Date;
  expectedCompletionDate?: Date;
  completedDate?: Date;
  
  // Sample information
  sampleIds: string[]; // References to collected samples
  
  // Result information
  hasResults: boolean;
  resultsReleasedDate?: Date;
  resultsReleasedBy?: string;
  
  // Billing reference
  billingReference?: string;
  billingStatus?: 'pending' | 'billed' | 'paid';
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabOrderDTO {
  patientId: string;
  providerId: string;
  tests: Array<{
    testId: string;
    priority?: string;
    notes?: string;
  }>;
  appointmentId?: string;
  encounterId?: string;
  clinicalNotes?: string;
  diagnosisCode?: string;
  indication?: string;
  priority?: string;
  facilityId: string;
  organizationId?: string;
  createdBy: string;
}

export interface UpdateLabOrderDTO {
  status?: string;
  tests?: any[];
  clinicalNotes?: string;
  updatedBy: string;
}

export default LabOrder;

