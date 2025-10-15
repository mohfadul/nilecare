/**
 * Therapeutic Range Model
 * 
 * Represents safe dosing ranges for medications
 * Includes age and weight-based adjustments
 */

export interface TherapeuticRange {
  id: string;
  medicationName: string;
  rxNormCode: string;
  route: 'oral' | 'IV' | 'IM' | 'SC' | 'topical' | 'inhalation';
  
  // Standard adult dosing
  minDose: number;
  maxDose: number;
  unit: string; // mg, mcg, units, etc.
  frequency: string; // daily, BID, TID, QID, etc.
  
  // Age-based adjustments
  pediatricDose?: {
    ageMin: number; // months
    ageMax: number;
    minDose: number;
    maxDose: number;
    calculationMethod: 'mg/kg' | 'mg/m2' | 'fixed';
  };
  
  geriatricDose?: {
    ageMin: number; // years
    adjustment: number; // percentage reduction
  };
  
  // Organ function adjustments
  renalAdjustment?: {
    gfrThreshold: number; // mL/min
    adjustment: number; // percentage reduction
    recommendation: string;
  };
  
  hepaticAdjustment?: {
    childPughScore: string; // A, B, or C
    adjustment: number; // percentage reduction
    recommendation: string;
  };
  
  // Clinical notes
  monitoringRequired: string[];
  contraindications: string[];
  warnings: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DoseValidationResult {
  isValid: boolean;
  prescribedDose: number;
  prescribedUnit: string;
  therapeuticRange: {
    min: number;
    max: number;
    unit: string;
  };
  status: 'ok' | 'below-range' | 'above-range' | 'sub-therapeutic' | 'toxic';
  warnings: string[];
  recommendations: string[];
  adjustmentNeeded: boolean;
  adjustedDose?: {
    dose: number;
    unit: string;
    reason: string;
  };
}

export class TherapeuticRangeModel {
  /**
   * Parse dose string (e.g., "500mg", "2.5g")
   */
  static parseDose(doseString: string): { value: number; unit: string } | null {
    const match = doseString.match(/^([\d.]+)\s*([a-zA-Z]+)$/);
    if (!match) return null;
    
    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase()
    };
  }

  /**
   * Convert dose units
   */
  static convertUnit(value: number, fromUnit: string, toUnit: string): number {
    const conversions: Record<string, number> = {
      'g-mg': 1000,
      'mg-mcg': 1000,
      'mcg-ng': 1000,
      'mg-g': 0.001,
      'mcg-mg': 0.001,
      'ng-mcg': 0.001
    };

    const key = `${fromUnit}-${toUnit}`;
    const factor = conversions[key];

    if (!factor) {
      throw new Error(`Cannot convert from ${fromUnit} to ${toUnit}`);
    }

    return value * factor;
  }

  /**
   * Calculate pediatric dose
   */
  static calculatePediatricDose(
    medicationName: string,
    ageMonths: number,
    weightKg: number,
    adultDose: number
  ): number {
    // Clark's Rule: (Weight in kg / 70) × Adult Dose
    // For children over 2 years
    if (ageMonths >= 24) {
      return (weightKg / 70) * adultDose;
    }
    
    // Young's Rule: [Age in years / (Age in years + 12)] × Adult Dose
    // For children under 2 years
    const ageYears = ageMonths / 12;
    return (ageYears / (ageYears + 12)) * adultDose;
  }

  /**
   * Apply renal dose adjustment
   */
  static applyRenalAdjustment(
    dose: number,
    gfr: number,
    renalAdjustment?: TherapeuticRange['renalAdjustment']
  ): { adjustedDose: number; adjustment: number; reason: string } {
    if (!renalAdjustment || gfr >= renalAdjustment.gfrThreshold) {
      return { adjustedDose: dose, adjustment: 0, reason: 'No adjustment needed' };
    }

    const adjustment = renalAdjustment.adjustment;
    const adjustedDose = dose * (1 - adjustment / 100);

    return {
      adjustedDose,
      adjustment,
      reason: `Renal impairment (GFR ${gfr}): ${renalAdjustment.recommendation}`
    };
  }

  /**
   * Convert database row to TherapeuticRange object
   */
  static fromDatabaseRow(row: any): TherapeuticRange {
    return {
      id: row.id,
      medicationName: row.medication_name,
      rxNormCode: row.rxnorm_code,
      route: row.route,
      minDose: parseFloat(row.min_dose),
      maxDose: parseFloat(row.max_dose),
      unit: row.unit,
      frequency: row.frequency,
      pediatricDose: row.pediatric_dose,
      geriatricDose: row.geriatric_dose,
      renalAdjustment: row.renal_adjustment,
      hepaticAdjustment: row.hepatic_adjustment,
      monitoringRequired: row.monitoring_required || [],
      contraindications: row.contraindications || [],
      warnings: row.warnings || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default TherapeuticRange;

