/**
 * SOAP Note Model
 * 
 * Represents SOAP (Subjective, Objective, Assessment, Plan) clinical documentation
 * Industry-standard format for patient encounter documentation
 * 
 * Reference: OpenEMR SOAP note structure
 * @see https://github.com/mohfadul/openemr-nilecare
 */

export interface SOAPNote {
  id: string;
  patientId: string;
  encounterId: string;
  facilityId?: string;
  organizationId: string;
  
  // SOAP Components
  subjective: string; // Chief complaint, HPI, patient statements
  objective: string;  // Physical exam, vital signs, lab results
  assessment: string; // Diagnosis, clinical impression
  plan: string;       // Treatment plan, medications, follow-up
  
  // Additional structured data
  chiefComplaint?: string;
  vitalSigns?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number; // Fahrenheit
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number; // kg
    height?: number; // cm
    bmi?: number;
    painScore?: number; // 0-10 scale
  };
  
  // Clinical codes
  diagnoses?: Array<{
    code: string; // ICD-10
    description: string;
    type: 'primary' | 'secondary' | 'differential';
    certainty?: 'confirmed' | 'suspected' | 'ruled-out';
  }>;
  
  // Medications documented in this note
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route?: string;
    action: 'continue' | 'start' | 'stop' | 'modify';
    reason?: string;
  }>;
  
  // Orders placed
  orders?: Array<{
    type: 'lab' | 'imaging' | 'procedure' | 'referral';
    description: string;
    urgency: 'routine' | 'urgent' | 'stat';
    orderedDate: Date;
  }>;
  
  // Follow-up
  followUp?: {
    interval: string; // e.g., "2 weeks", "3 months"
    instructions: string;
    provider?: string;
  };
  
  // Document lifecycle
  status: 'draft' | 'finalized' | 'amended' | 'addended';
  finalizedAt?: Date;
  finalizedBy?: string;
  attestation?: string; // "I attest that this note accurately reflects..."
  signature?: string; // Digital signature or signature metadata
  
  // Amendment tracking
  isAmendment: boolean;
  originalNoteId?: string;
  amendmentReason?: string;
  amendmentDate?: Date;
  amendmentNumber?: number; // 1st amendment, 2nd amendment, etc.
  
  // Addendum tracking
  addenda?: Array<{
    id: string;
    content: string;
    addedBy: string;
    addedAt: Date;
    reason: string;
  }>;
  
  // Version control
  version: number;
  previousVersionId?: string;
  
  // Template
  templateId?: string;
  templateName?: string;
  
  // Audit trail
  createdBy: string;
  updatedBy?: string;
  viewedBy?: string[]; // Track who has viewed (HIPAA audit)
  
  // Categorization
  tags?: string[];
  specialty?: string;
  
  // Multi-facility support
  documentDate: Date; // When the encounter occurred
  createdAt: Date;
  updatedAt: Date;
  
  // Locking for concurrent editing
  lockedBy?: string;
  lockedAt?: Date;
}

export interface SOAPNoteSummary {
  id: string;
  patientId: string;
  patientName?: string; // For display only, not stored in this table
  documentDate: Date;
  chiefComplaint?: string;
  primaryDiagnosis?: string;
  status: SOAPNote['status'];
  createdBy: string;
  createdByName?: string; // For display
  finalizedAt?: Date;
}

export interface SOAPNoteVersion {
  versionId: string;
  noteId: string;
  version: number;
  snapshot: Partial<SOAPNote>; // Full note content at this version
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
}

export class SOAPNoteModel {
  /**
   * Status priorities for sorting
   */
  static readonly STATUS_PRIORITY = {
    draft: 1,
    finalized: 2,
    amended: 3,
    addended: 4
  };

  /**
   * Check if note can be edited
   */
  static canEdit(note: SOAPNote): boolean {
    // Can only edit draft notes
    // Finalized notes require amendment process
    return note.status === 'draft';
  }

  /**
   * Check if note can be finalized
   */
  static canFinalize(note: SOAPNote): boolean {
    return note.status === 'draft' && 
           note.subjective && 
           note.objective && 
           note.assessment && 
           note.plan;
  }

  /**
   * Check if note is locked
   */
  static isLocked(note: SOAPNote, userId: string): boolean {
    if (!note.lockedBy || !note.lockedAt) return false;
    
    // Note is locked by another user
    if (note.lockedBy !== userId) {
      // Check if lock is stale (older than 30 minutes)
      const lockAge = Date.now() - note.lockedAt.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (lockAge > thirtyMinutes) {
        return false; // Stale lock, can be taken over
      }
      
      return true; // Active lock by another user
    }
    
    return false; // Locked by current user, can edit
  }

  /**
   * Generate document title
   */
  static generateTitle(note: SOAPNote): string {
    const dateStr = note.documentDate.toISOString().split('T')[0];
    const complaint = note.chiefComplaint || 'Encounter';
    return `${dateStr} - ${complaint}`;
  }

  /**
   * Extract primary diagnosis
   */
  static getPrimaryDiagnosis(note: SOAPNote): string | null {
    if (!note.diagnoses || note.diagnoses.length === 0) {
      return null;
    }
    
    const primary = note.diagnoses.find(d => d.type === 'primary');
    return primary ? primary.description : note.diagnoses[0].description;
  }

  /**
   * Convert database row to SOAPNote object
   */
  static fromDatabaseRow(row: any): SOAPNote {
    return {
      id: row.id,
      patientId: row.patient_id,
      encounterId: row.encounter_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      subjective: row.subjective,
      objective: row.objective,
      assessment: row.assessment,
      plan: row.plan,
      chiefComplaint: row.chief_complaint,
      vitalSigns: row.vital_signs,
      diagnoses: row.diagnoses || [],
      medications: row.medications || [],
      orders: row.orders || [],
      followUp: row.follow_up,
      status: row.status,
      finalizedAt: row.finalized_at,
      finalizedBy: row.finalized_by,
      attestation: row.attestation,
      signature: row.signature,
      isAmendment: row.is_amendment || false,
      originalNoteId: row.original_note_id,
      amendmentReason: row.amendment_reason,
      amendmentDate: row.amendment_date,
      amendmentNumber: row.amendment_number,
      addenda: row.addenda || [],
      version: row.version || 1,
      previousVersionId: row.previous_version_id,
      templateId: row.template_id,
      templateName: row.template_name,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      viewedBy: row.viewed_by || [],
      tags: row.tags || [],
      specialty: row.specialty,
      documentDate: row.document_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lockedBy: row.locked_by,
      lockedAt: row.locked_at
    };
  }

  /**
   * Convert SOAPNote to database row format
   */
  static toDatabaseRow(note: Partial<SOAPNote>): any {
    return {
      id: note.id,
      patient_id: note.patientId,
      encounter_id: note.encounterId,
      facility_id: note.facilityId,
      organization_id: note.organizationId,
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      chief_complaint: note.chiefComplaint,
      vital_signs: note.vitalSigns ? JSON.stringify(note.vitalSigns) : null,
      diagnoses: note.diagnoses ? JSON.stringify(note.diagnoses) : null,
      medications: note.medications ? JSON.stringify(note.medications) : null,
      orders: note.orders ? JSON.stringify(note.orders) : null,
      follow_up: note.followUp ? JSON.stringify(note.followUp) : null,
      status: note.status,
      finalized_at: note.finalizedAt,
      finalized_by: note.finalizedBy,
      attestation: note.attestation,
      signature: note.signature,
      is_amendment: note.isAmendment,
      original_note_id: note.originalNoteId,
      amendment_reason: note.amendmentReason,
      amendment_date: note.amendmentDate,
      amendment_number: note.amendmentNumber,
      addenda: note.addenda ? JSON.stringify(note.addenda) : null,
      version: note.version,
      previous_version_id: note.previousVersionId,
      template_id: note.templateId,
      template_name: note.templateName,
      created_by: note.createdBy,
      updated_by: note.updatedBy,
      viewed_by: note.viewedBy || [],
      tags: note.tags || [],
      specialty: note.specialty,
      document_date: note.documentDate,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
      locked_by: note.lockedBy,
      locked_at: note.lockedAt
    };
  }
}

export default SOAPNote;

