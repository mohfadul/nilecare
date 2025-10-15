/**
 * Contraindication Model
 * 
 * Represents drug-disease contraindications
 * Based on FDA labeling and clinical evidence
 */

export interface Contraindication {
  id: string;
  medicationName: string;
  rxNormCode: string;
  condition: string;
  icdCode: string;
  snomedCode?: string;
  type: 'absolute' | 'relative';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  description: string;
  clinicalRationale: string;
  alternatives: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  references: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContraindicationAlert {
  type: 'absolute' | 'relative';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  medication: string;
  condition: string;
  description: string;
  clinicalRationale: string;
  alternatives: string[];
  recommendation: string;
  blocksAdministration: boolean;
}

export interface ContraindicationCheckResult {
  hasContraindications: boolean;
  contraindications: ContraindicationAlert[];
  absoluteContraindications: ContraindicationAlert[];
  relativeContraindications: ContraindicationAlert[];
  blocksAdministration: boolean;
}

export class ContraindicationModel {
  /**
   * Type priorities for risk assessment
   */
  static readonly TYPE_WEIGHTS = {
    absolute: 10,
    relative: 5
  };

  /**
   * Severity weights
   */
  static readonly SEVERITY_WEIGHTS = {
    mild: 1,
    moderate: 2,
    severe: 4,
    critical: 8
  };

  /**
   * Get weight for risk calculation
   */
  static getWeight(contraindication: Contraindication): number {
    const typeWeight = this.TYPE_WEIGHTS[contraindication.type];
    const severityWeight = this.SEVERITY_WEIGHTS[contraindication.severity];
    return typeWeight * severityWeight;
  }

  /**
   * Determine if contraindication blocks medication use
   */
  static blocksAdministration(contraindication: Contraindication): boolean {
    // Absolute contraindications always block
    if (contraindication.type === 'absolute') {
      return true;
    }

    // Relative contraindications block if critical or severe
    return contraindication.severity === 'critical' || 
           contraindication.severity === 'severe';
  }

  /**
   * Generate recommendation based on contraindication
   */
  static generateRecommendation(contraindication: Contraindication): string {
    if (contraindication.type === 'absolute') {
      if (contraindication.alternatives.length > 0) {
        return `DO NOT USE. Consider alternatives: ${contraindication.alternatives.join(', ')}`;
      }
      return `DO NOT USE - Absolute contraindication. ${contraindication.clinicalRationale}`;
    }

    // Relative contraindication
    return `Use with caution. ${contraindication.clinicalRationale}. Monitor closely.`;
  }

  /**
   * Convert database row to Contraindication object
   */
  static fromDatabaseRow(row: any): Contraindication {
    return {
      id: row.id,
      medicationName: row.medication_name,
      rxNormCode: row.rxnorm_code,
      condition: row.condition,
      icdCode: row.icd_code,
      snomedCode: row.snomed_code,
      type: row.type,
      severity: row.severity,
      description: row.description,
      clinicalRationale: row.clinical_rationale,
      alternatives: row.alternatives || [],
      evidenceLevel: row.evidence_level,
      references: row.references || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default Contraindication;

