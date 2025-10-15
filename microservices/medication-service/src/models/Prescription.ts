/**
 * Prescription Model (PostgreSQL)
 * Represents medication prescriptions
 */

export interface Prescription {
  id: string;
  prescriptionNumber: string; // Format: RX-YYYYMMDD-XXXXXX
  
  // References
  patientId: string;
  providerId: string; // Prescribing doctor
  medicationId: string;
  encounterId?: string;
  appointmentId?: string;
  
  // Prescription details
  dosage: string;
  route: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'inhalation' | 'rectal' | 'sublingual' | 'other';
  frequency: string; // e.g., "twice daily", "every 4 hours"
  duration: string; // e.g., "7 days", "2 weeks"
  quantity: number;
  refillsAllowed: number;
  refillsRemaining: number;
  
  // Instructions
  instructions: string;
  indication?: string; // Reason for prescription
  notes?: string;
  
  // Status tracking
  status: 'pending' | 'active' | 'dispensed' | 'completed' | 'cancelled' | 'expired';
  
  // Dates
  prescribedDate: Date;
  startDate: Date;
  endDate?: Date;
  dispensedDate?: Date;
  expirationDate: Date;
  
  // Safety checks
  allergyCheckPassed: boolean;
  interactionCheckPassed: boolean;
  contraindicationCheckPassed: boolean;
  allergyOverride?: boolean;
  allergyOverrideReason?: string;
  allergyOverrideBy?: string;
  
  // E-prescription
  ePrescriptionId?: string;
  transmittedToPharmacy?: boolean;
  transmittedDate?: Date;
  pharmacyId?: string;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrescriptionDTO {
  patientId: string;
  providerId: string;
  medicationId: string;
  encounterId?: string;
  appointmentId?: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  refillsAllowed?: number;
  instructions: string;
  indication?: string;
  notes?: string;
  startDate: Date;
  facilityId: string;
  organizationId?: string;
  createdBy: string;
}

export interface UpdatePrescriptionDTO {
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  refillsAllowed?: number;
  instructions?: string;
  notes?: string;
  status?: string;
  updatedBy: string;
}

export interface DispensePrescriptionDTO {
  prescriptionId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  dispensedBy: string;
  facilityId: string;
}

export default Prescription;

