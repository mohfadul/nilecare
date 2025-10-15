/**
 * Allergy Model
 * 
 * Represents patient allergies and medication allergens
 * Includes cross-reactivity patterns
 */

export interface Allergy {
  id: string;
  allergen: string;
  allergenClass: string; // e.g., 'penicillin', 'sulfa', 'cephalosporin'
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction: string;
  crossReactiveWith: string[]; // List of related allergen classes
  createdAt: Date;
  updatedAt: Date;
}

export interface AllergyAlert {
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  allergen: string;
  medication: string;
  alertType: 'direct-match' | 'cross-reactivity' | 'class-warning';
  crossReactivityRisk?: number; // 0-100%
  description: string;
  recommendation: string;
}

export interface AllergyCheckResult {
  hasAlerts: boolean;
  alerts: AllergyAlert[];
  highestSeverity: 'none' | 'mild' | 'moderate' | 'severe' | 'life-threatening';
  blocksAdministration: boolean;
}

/**
 * Common allergen class cross-reactivity patterns
 * Based on clinical evidence and FDA guidelines
 */
export const CROSS_REACTIVITY_PATTERNS: Record<string, {
  class: string;
  crossReactiveWith: string[];
  riskPercentage: number;
}> = {
  'penicillin': {
    class: 'penicillin',
    crossReactiveWith: ['cephalosporin', 'carbapenem'],
    riskPercentage: 10 // 10% cross-reactivity with cephalosporins
  },
  'sulfonamide': {
    class: 'sulfonamide',
    crossReactiveWith: ['sulfonylurea', 'loop-diuretic'],
    riskPercentage: 5
  },
  'aspirin': {
    class: 'nsaid',
    crossReactiveWith: ['nsaid'],
    riskPercentage: 15
  }
};

export class AllergyModel {
  /**
   * Severity weights for risk scoring
   */
  static readonly SEVERITY_WEIGHTS = {
    mild: 1,
    moderate: 2,
    severe: 4,
    'life-threatening': 8
  };

  /**
   * Get severity weight
   */
  static getSeverityWeight(severity: Allergy['severity']): number {
    return this.SEVERITY_WEIGHTS[severity];
  }

  /**
   * Check if allergen class has cross-reactivity
   */
  static hasCrossReactivity(allergenClass: string, medicationClass: string): {
    hasCrossReactivity: boolean;
    riskPercentage: number;
  } {
    const pattern = CROSS_REACTIVITY_PATTERNS[allergenClass.toLowerCase()];
    
    if (!pattern) {
      return { hasCrossReactivity: false, riskPercentage: 0 };
    }

    const crossReactive = pattern.crossReactiveWith.some(
      cls => medicationClass.toLowerCase().includes(cls)
    );

    return {
      hasCrossReactivity: crossReactive,
      riskPercentage: crossReactive ? pattern.riskPercentage : 0
    };
  }

  /**
   * Determine if alert blocks medication administration
   */
  static blocksAdministration(severity: Allergy['severity']): boolean {
    return severity === 'severe' || severity === 'life-threatening';
  }

  /**
   * Convert database row to Allergy object
   */
  static fromDatabaseRow(row: any): Allergy {
    return {
      id: row.id,
      allergen: row.allergen,
      allergenClass: row.allergen_class,
      severity: row.severity,
      reaction: row.reaction,
      crossReactiveWith: row.cross_reactive_with || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default Allergy;

