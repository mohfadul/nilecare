/**
 * Problem List Model
 * 
 * Represents patient's problem list (active diagnoses and conditions)
 * Critical for clinical decision support and continuity of care
 * 
 * Reference: OpenEMR problem list structure
 * @see https://github.com/mohfadul/openemr-nilecare
 */

export interface ProblemListItem {
  id: string;
  patientId: string;
  facilityId?: string;
  organizationId: string;
  
  // Problem identification
  problemName: string;
  icdCode: string; // ICD-10 code
  snomedCode?: string; // SNOMED CT code
  
  // Clinical details
  onset?: Date; // When problem started
  endDate?: Date; // When problem resolved (if applicable)
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'chronic' | 'intermittent' | 'recurrent' | 'inactive' | 'resolved';
  
  // Context
  diagnosedBy?: string; // Provider UUID
  diagnosedDate?: Date;
  resolvedDate?: Date;
  resolvedBy?: string; // Provider UUID
  resolvedReason?: string;
  
  // Clinical notes
  notes?: string;
  clinicalSignificance?: 'major' | 'moderate' | 'minor';
  
  // Categorization
  category: 'diagnosis' | 'symptom' | 'finding' | 'complaint';
  priority: 'low' | 'medium' | 'high';
  
  // Relationships
  relatedProblems?: string[]; // IDs of related problem list items
  relatedEncounters?: string[]; // Encounter IDs where this was addressed
  
  // Treatment tracking
  currentTreatments?: Array<{
    type: 'medication' | 'procedure' | 'therapy';
    description: string;
    startDate: Date;
    endDate?: Date;
  }>;
  
  // Outcomes
  outcome?: 'improved' | 'stable' | 'worsened' | 'resolved' | 'deceased';
  outcomeNotes?: string;
  
  // Version control
  version: number;
  previousVersionId?: string;
  
  // Audit trail
  createdBy: string;
  updatedBy?: string;
  
  // Metadata
  tags?: string[];
  isChronicCondition: boolean;
  requiresMonitoring: boolean;
  monitoringInterval?: string; // e.g., "3 months", "annually"
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Soft delete
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
}

export interface ProblemListSummary {
  id: string;
  problemName: string;
  icdCode: string;
  status: ProblemListItem['status'];
  severity: ProblemListItem['severity'];
  onset?: Date;
  isChronicCondition: boolean;
}

export interface ProblemListStats {
  totalProblems: number;
  activeProblems: number;
  chronicProblems: number;
  resolvedProblems: number;
  byCategory: Record<ProblemListItem['category'], number>;
  bySeverity: Record<ProblemListItem['severity'], number>;
  byStatus: Record<ProblemListItem['status'], number>;
}

export class ProblemListModel {
  /**
   * Status weights for risk assessment
   */
  static readonly STATUS_WEIGHTS = {
    active: 3,
    chronic: 2,
    intermittent: 2,
    recurrent: 2,
    inactive: 1,
    resolved: 0
  };

  /**
   * Severity weights
   */
  static readonly SEVERITY_WEIGHTS = {
    mild: 1,
    moderate: 2,
    severe: 3
  };

  /**
   * Check if problem is currently active
   */
  static isActive(problem: ProblemListItem): boolean {
    return problem.status === 'active' || 
           problem.status === 'chronic' || 
           problem.status === 'intermittent' ||
           problem.status === 'recurrent';
  }

  /**
   * Check if problem requires monitoring
   */
  static requiresMonitoring(problem: ProblemListItem): boolean {
    return problem.requiresMonitoring || 
           problem.isChronicCondition ||
           problem.severity === 'severe';
  }

  /**
   * Calculate problem duration in days
   */
  static getDuration(problem: ProblemListItem): number | null {
    if (!problem.onset) return null;
    
    const endDate = problem.resolvedDate || new Date();
    const durationMs = endDate.getTime() - problem.onset.getTime();
    return Math.floor(durationMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if problem is chronic (> 3 months active)
   */
  static isChronicDuration(problem: ProblemListItem): boolean {
    const duration = this.getDuration(problem);
    if (!duration) return false;
    return duration > 90; // 3 months
  }

  /**
   * Get risk score for problem
   */
  static getRiskScore(problem: ProblemListItem): number {
    const statusWeight = this.STATUS_WEIGHTS[problem.status] || 0;
    const severityWeight = this.SEVERITY_WEIGHTS[problem.severity] || 0;
    const priorityMultiplier = problem.priority === 'high' ? 1.5 : 
                                problem.priority === 'medium' ? 1.2 : 1.0;
    
    return Math.round(statusWeight * severityWeight * priorityMultiplier);
  }

  /**
   * Convert database row to ProblemListItem object
   */
  static fromDatabaseRow(row: any): ProblemListItem {
    return {
      id: row.id,
      patientId: row.patient_id,
      facilityId: row.facility_id,
      organizationId: row.organization_id,
      problemName: row.problem_name,
      icdCode: row.icd_code,
      snomedCode: row.snomed_code,
      onset: row.onset,
      endDate: row.end_date,
      severity: row.severity,
      status: row.status,
      diagnosedBy: row.diagnosed_by,
      diagnosedDate: row.diagnosed_date,
      resolvedDate: row.resolved_date,
      resolvedBy: row.resolved_by,
      resolvedReason: row.resolved_reason,
      notes: row.notes,
      clinicalSignificance: row.clinical_significance,
      category: row.category,
      priority: row.priority,
      relatedProblems: row.related_problems || [],
      relatedEncounters: row.related_encounters || [],
      currentTreatments: row.current_treatments || [],
      outcome: row.outcome,
      outcomeNotes: row.outcome_notes,
      version: row.version || 1,
      previousVersionId: row.previous_version_id,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      tags: row.tags || [],
      isChronicCondition: row.is_chronic_condition || false,
      requiresMonitoring: row.requires_monitoring || false,
      monitoringInterval: row.monitoring_interval,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      deletionReason: row.deletion_reason
    };
  }

  /**
   * Convert to summary format
   */
  static toSummary(problem: ProblemListItem): ProblemListSummary {
    return {
      id: problem.id,
      problemName: problem.problemName,
      icdCode: problem.icdCode,
      status: problem.status,
      severity: problem.severity,
      onset: problem.onset,
      isChronicCondition: problem.isChronicCondition
    };
  }

  /**
   * Validate ICD-10 code format
   */
  static validateICD10(code: string): boolean {
    // ICD-10 format: Letter + 2 digits + optional decimal + optional 1-4 additional characters
    const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,4})?$/;
    return icd10Pattern.test(code);
  }

  /**
   * Validate SNOMED code format
   */
  static validateSNOMED(code: string): boolean {
    // SNOMED codes are numeric, typically 6-18 digits
    const snomedPattern = /^\d{6,18}$/;
    return snomedPattern.test(code);
  }
}

export default ProblemListItem;

