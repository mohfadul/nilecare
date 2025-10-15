/**
 * Medication Model (PostgreSQL)
 * Represents medication catalog/formulary
 */

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  dosageForm: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'ointment' | 'inhaler' | 'drops' | 'patch' | 'other';
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  category?: string;
  
  // Safety flags
  isHighAlert: boolean;
  requiresRefrigeration: boolean;
  isControlledSubstance: boolean;
  controlledSubstanceSchedule?: string; // DEA Schedule I-V
  
  // Multi-facility support
  facilityId: string;
  organizationId: string;
  
  // Status
  status: 'active' | 'inactive' | 'discontinued';
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicationDTO {
  name: string;
  genericName?: string;
  brandName?: string;
  dosageForm: string;
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  category?: string;
  isHighAlert?: boolean;
  requiresRefrigeration?: boolean;
  isControlledSubstance?: boolean;
  controlledSubstanceSchedule?: string;
  facilityId: string;
  organizationId?: string;
  createdBy: string;
}

export interface UpdateMedicationDTO {
  name?: string;
  genericName?: string;
  brandName?: string;
  dosageForm?: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  description?: string;
  category?: string;
  isHighAlert?: boolean;
  requiresRefrigeration?: boolean;
  isControlledSubstance?: boolean;
  controlledSubstanceSchedule?: string;
  status?: string;
  updatedBy: string;
}

export default Medication;

