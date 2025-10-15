/**
 * Medication Administration Record (MAR) Model (PostgreSQL)
 * Records actual medication administration to patients
 */

export interface MAREntry {
  id: string;
  
  // References
  patientId: string;
  medicationId: string;
  prescriptionId?: string;
  encounterId?: string;
  
  // Administration details
  dosage: string;
  route: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'inhalation' | 'rectal' | 'sublingual' | 'other';
  site?: string; // Body site for injection, topical, etc.
  
  // Timing
  scheduledTime?: Date;
  administeredTime: Date;
  
  // Who administered
  administeredBy: string; // User ID (nurse, doctor)
  witnessedBy?: string; // Required for high-alert medications
  
  // Verification
  barcodeVerified: boolean;
  barcodeData?: string;
  patientIdentityVerified: boolean;
  verificationMethod: 'barcode' | 'manual' | 'biometric';
  
  // Safety
  isHighAlert: boolean;
  highAlertVerified?: boolean;
  allergyCheckPerformed: boolean;
  vitalSignsChecked?: boolean;
  
  // Status
  status: 'scheduled' | 'administered' | 'missed' | 'refused' | 'held' | 'omitted';
  missedReason?: string;
  refusedReason?: string;
  heldReason?: string;
  omittedReason?: string;
  
  // Observations
  patientResponse?: string;
  adverseReaction?: boolean;
  adverseReactionDetails?: string;
  notes?: string;
  
  // Batch tracking
  batchNumber?: string;
  expiryDate?: Date;
  lotNumber?: string;
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMAREntryDTO {
  patientId: string;
  medicationId: string;
  prescriptionId?: string;
  encounterId?: string;
  dosage: string;
  route: string;
  site?: string;
  scheduledTime?: Date;
  administeredTime: Date;
  administeredBy: string;
  witnessedBy?: string;
  barcodeVerified?: boolean;
  barcodeData?: string;
  patientIdentityVerified: boolean;
  verificationMethod?: string;
  isHighAlert?: boolean;
  allergyCheckPerformed: boolean;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
  facilityId: string;
  organizationId?: string;
}

export interface UpdateMAREntryDTO {
  status?: string;
  missedReason?: string;
  refusedReason?: string;
  heldReason?: string;
  omittedReason?: string;
  patientResponse?: string;
  adverseReaction?: boolean;
  adverseReactionDetails?: string;
  notes?: string;
}

export default MAREntry;

