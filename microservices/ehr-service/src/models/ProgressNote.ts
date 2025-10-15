/**
 * Progress Note Model
 * 
 * Represents ongoing clinical progress documentation
 * Used for: daily notes, shift notes, procedure notes, etc.
 * 
 * Reference: OpenEMR clinical notes structure
 * @see https://github.com/mohfadul/openemr-nilecare
 */

export interface ProgressNote {
  id: string;
  patientId: string;
  encounterId?: string; // Optional - progress notes may not be tied to specific encounter
  facilityId?: string;
  organizationId: string;
  
  // Note details
  noteType: 'daily' | 'shift' | 'discharge' | 'procedure' | 'consultation' | 'transfer' | 'phone' | 'other';
  noteDate: Date;
  content: string; // Main narrative note content
  
  // Clinical context
  vitalSigns?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    painScore?: number; // 0-10
    glucoseLevel?: number;
  };
  
  // Current status
  condition: 'improving' | 'stable' | 'declining' | 'critical';
  consciousness?: 'alert' | 'drowsy' | 'confused' | 'unresponsive';
  
  // Medications documented
  medications?: Array<{
    name: string;
    dose: string;
    time: Date;
    administered: boolean;
    administeredBy?: string;
    reaction?: string;
  }>;
  
  // Interventions performed
  interventions?: Array<{
    type: string;
    description: string;
    time: Date;
    performedBy?: string;
    outcome?: string;
  }>;
  
  // Assessment & observations
  observations?: string[];
  concerns?: string[];
  
  // Follow-up
  followUpNeeded: boolean;
  followUpDate?: Date;
  followUpInstructions?: string;
  
  // Document lifecycle
  status: 'draft' | 'finalized' | 'amended';
  finalizedAt?: Date;
  finalizedBy?: string;
  
  // Amendment tracking
  isAmendment: boolean;
  originalNoteId?: string;
  amendmentReason?: string;
  amendmentDate?: Date;
  
  // Shift-specific fields (for nursing notes)
  shiftStart?: Date;
  shiftEnd?: Date;
  shiftType?: 'day' | 'evening' | 'night';
  handoff?: {
    to: string; // Next shift provider
    summary: string;
    pending: string[];
  };
  
  // Procedure-specific fields
  procedureDetails?: {
    procedureName: string;
    procedureCode?: string;
    startTime: Date;
    endTime?: Date;
    complications?: string;
    specimens?: string[];
  };
  
  // Discharge-specific fields
  dischargeDetails?: {
    disposition: 'home' | 'transfer' | 'hospice' | 'deceased' | 'ama' | 'other';
    instructions: string;
    medications: string[];
    followUpAppointments: Array<{
      provider: string;
      date?: Date;
      reason: string;
    }>;
    restrictions?: string[];
  };
  
  // Consultation-specific fields
  consultationDetails?: {
    consultantId: string;
    consultantName?: string;
    specialty: string;
    reason: string;
    recommendations: string[];
  };
  
  // Version control
  version: number;
  previousVersionId?: string;
  
  // Audit trail
  createdBy: string;
  updatedBy?: string;
  viewedBy?: string[]; // HIPAA audit trail
  
  // Categorization
  tags?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Locking
  lockedBy?: string;
  lockedAt?: Date;
}

export interface ProgressNoteSummary {
  id: string;
  patientId: string;
  noteType: ProgressNote['noteType'];
  noteDate: Date;
  contentPreview: string; // First 100 chars
  condition: ProgressNote['condition'];
  status: ProgressNote['status'];
  createdBy: string;
  createdByName?: string;
  finalizedAt?: Date;
}

export class ProgressNoteModel {
  /**
   * Note type priorities for sorting
   */
  static readonly NOTE_TYPE_PRIORITY = {
    discharge: 1,
    procedure: 2,
    consultation: 3,
    transfer: 4,
    daily: 5,
    shift: 6,
    phone: 7,
    other: 8
  };

  /**
   * Condition severity weights
   */
  static readonly CONDITION_WEIGHTS = {
    critical: 4,
    declining: 3,
    stable: 2,
    improving: 1
  };

  /**
   * Check if note can be edited
   */
  static canEdit(note: ProgressNote): boolean {
    return note.status === 'draft';
  }

  /**
   * Check if note can be finalized
   */
  static canFinalize(note: ProgressNote): boolean {
    return note.status === 'draft' && 
           note.content && 
           note.content.length >= 10;
  }

  /**
   * Check if note is locked
   */
  static isLocked(note: ProgressNote, userId: string): boolean {
    if (!note.lockedBy || !note.lockedAt) return false;
    
    if (note.lockedBy !== userId) {
      // Check if lock is stale (older than 30 minutes)
      const lockAge = Date.now() - note.lockedAt.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (lockAge > thirtyMinutes) {
        return false; // Stale lock
      }
      
      return true; // Active lock by another user
    }
    
    return false; // Locked by current user
  }

  /**
   * Generate note title
   */
  static generateTitle(note: ProgressNote): string {
    const dateStr = note.noteDate.toISOString().split('T')[0];
    const typeStr = note.noteType.charAt(0).toUpperCase() + note.noteType.slice(1);
    return `${dateStr} - ${typeStr} Note`;
  }

  /**
   * Get content preview (first 100 characters)
   */
  static getContentPreview(content: string, maxLength: number = 100): string {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Check if note requires immediate attention
   */
  static requiresAttention(note: ProgressNote): boolean {
    return note.condition === 'critical' || 
           note.condition === 'declining' ||
           (note.concerns && note.concerns.length > 0);
  }

  /**
   * Convert database row to ProgressNote object
   */
  static fromDatabaseRow(row: any): ProgressNote {
    return {
      id: row.id,
      patientId: row.patient_id,
      encounterId: row.encounter_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      noteType: row.note_type,
      noteDate: row.note_date,
      content: row.content,
      vitalSigns: row.vital_signs,
      condition: row.condition,
      consciousness: row.consciousness,
      medications: row.medications || [],
      interventions: row.interventions || [],
      observations: row.observations || [],
      concerns: row.concerns || [],
      followUpNeeded: row.follow_up_needed || false,
      followUpDate: row.follow_up_date,
      followUpInstructions: row.follow_up_instructions,
      status: row.status,
      finalizedAt: row.finalized_at,
      finalizedBy: row.finalized_by,
      isAmendment: row.is_amendment || false,
      originalNoteId: row.original_note_id,
      amendmentReason: row.amendment_reason,
      amendmentDate: row.amendment_date,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
      shiftType: row.shift_type,
      handoff: row.handoff,
      procedureDetails: row.procedure_details,
      dischargeDetails: row.discharge_details,
      consultationDetails: row.consultation_details,
      version: row.version || 1,
      previousVersionId: row.previous_version_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      viewedBy: row.viewed_by || [],
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lockedBy: row.locked_by,
      lockedAt: row.locked_at
    };
  }

  /**
   * Convert to summary format
   */
  static toSummary(note: ProgressNote): ProgressNoteSummary {
    return {
      id: note.id,
      patientId: note.patientId,
      noteType: note.noteType,
      noteDate: note.noteDate,
      contentPreview: this.getContentPreview(note.content, 100),
      condition: note.condition,
      status: note.status,
      createdBy: note.createdBy,
      finalizedAt: note.finalizedAt
    };
  }

  /**
   * Validate shift note has required fields
   */
  static validateShiftNote(note: Partial<ProgressNote>): boolean {
    if (note.noteType !== 'shift') return true;
    
    return !!(
      note.shiftStart &&
      note.shiftEnd &&
      note.shiftType &&
      note.content
    );
  }

  /**
   * Validate discharge note has required fields
   */
  static validateDischargeNote(note: Partial<ProgressNote>): boolean {
    if (note.noteType !== 'discharge') return true;
    
    return !!(
      note.dischargeDetails &&
      note.dischargeDetails.disposition &&
      note.dischargeDetails.instructions &&
      note.content
    );
  }

  /**
   * Validate procedure note has required fields
   */
  static validateProcedureNote(note: Partial<ProgressNote>): boolean {
    if (note.noteType !== 'procedure') return true;
    
    return !!(
      note.procedureDetails &&
      note.procedureDetails.procedureName &&
      note.procedureDetails.startTime &&
      note.content
    );
  }
}

export default ProgressNote;

