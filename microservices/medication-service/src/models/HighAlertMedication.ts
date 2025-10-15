/**
 * High Alert Medication Model (PostgreSQL)
 * Tracks medications that require extra safety protocols
 */

export interface HighAlertMedication {
  id: string;
  medicationId: string;
  
  // Alert classification
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'anticoagulant' | 'insulin' | 'chemotherapy' | 'opioid' | 'sedative' | 'neuromuscular_blocker' | 'electrolyte' | 'other';
  
  // Safety requirements
  requiresDoubleCheck: boolean;
  requiresWitness: boolean;
  requiresSpecialTraining: boolean;
  requiresProtocol: boolean;
  protocolReference?: string;
  
  // Risk factors
  commonErrors?: string[]; // JSON array of common administration errors
  adverseEffects?: string[]; // JSON array of serious adverse effects
  interactionWarnings?: string[]; // JSON array of critical interactions
  
  // Monitoring requirements
  requiresVitalSignsMonitoring: boolean;
  vitalSignsFrequency?: string; // e.g., "every 15 minutes"
  requiresLabMonitoring: boolean;
  labMonitoringDetails?: string;
  
  // Documentation
  safetyGuidelines: string;
  administrationGuidelines: string;
  emergencyProcedure?: string;
  antidote?: string;
  
  // Status
  isActive: boolean;
  effectiveDate: Date;
  expirationDate?: Date;
  
  // Multi-facility support
  facilityId?: string; // NULL = applies to all facilities
  organizationId: string;
  
  // Audit fields
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHighAlertMedicationDTO {
  medicationId: string;
  alertLevel: string;
  category: string;
  requiresDoubleCheck?: boolean;
  requiresWitness?: boolean;
  requiresSpecialTraining?: boolean;
  requiresProtocol?: boolean;
  protocolReference?: string;
  commonErrors?: string[];
  adverseEffects?: string[];
  interactionWarnings?: string[];
  requiresVitalSignsMonitoring?: boolean;
  vitalSignsFrequency?: string;
  requiresLabMonitoring?: boolean;
  labMonitoringDetails?: string;
  safetyGuidelines: string;
  administrationGuidelines: string;
  emergencyProcedure?: string;
  antidote?: string;
  facilityId?: string;
  organizationId: string;
  createdBy: string;
}

export default HighAlertMedication;

