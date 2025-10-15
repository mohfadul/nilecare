/**
 * Drug Interaction Model
 * 
 * Represents drug-drug interactions based on clinical databases
 * Reference: OpenEMR drug interaction patterns
 * 
 * Data sources:
 * - DrugBank
 * - FDA Drug Interaction Database
 * - Micromedex
 */

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug1RxNorm: string;
  drug2: string;
  drug2RxNorm: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  clinicalEffects: string;
  mechanism: string;
  recommendation: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D'; // A=Strong, B=Moderate, C=Weak, D=Expert opinion
  references: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: Array<{
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    drug1: string;
    drug2: string;
    description: string;
    recommendation: string;
    evidenceLevel: string;
  }>;
  highestSeverity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  requiresAction: boolean;
}

export class DrugInteractionModel {
  /**
   * Severity weights for risk scoring
   */
  static readonly SEVERITY_WEIGHTS = {
    minor: 1,
    moderate: 2,
    major: 4,
    critical: 8
  };

  /**
   * Get severity weight for risk calculation
   */
  static getSeverityWeight(severity: DrugInteraction['severity']): number {
    return this.SEVERITY_WEIGHTS[severity];
  }

  /**
   * Determine if action is required based on severity
   */
  static requiresAction(severity: DrugInteraction['severity']): boolean {
    return severity === 'major' || severity === 'critical';
  }

  /**
   * Convert database row to DrugInteraction object
   */
  static fromDatabaseRow(row: any): DrugInteraction {
    return {
      id: row.id,
      drug1: row.drug1_name,
      drug1RxNorm: row.drug1_rxnorm,
      drug2: row.drug2_name,
      drug2RxNorm: row.drug2_rxnorm,
      severity: row.severity,
      description: row.description,
      clinicalEffects: row.clinical_effects,
      mechanism: row.mechanism,
      recommendation: row.recommendation,
      evidenceLevel: row.evidence_level,
      references: row.references || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default DrugInteraction;

