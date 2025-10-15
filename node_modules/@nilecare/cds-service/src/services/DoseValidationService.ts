/**
 * Dose Validation Service
 * 
 * Validates medication dosages against therapeutic ranges
 * Includes age, weight, and organ function adjustments
 * 
 * Reference: OpenEMR dosing calculation patterns
 */

import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { TherapeuticRange, DoseValidationResult, TherapeuticRangeModel } from '../models/TherapeuticRange';

export class DoseValidationService {
  /**
   * Validate medication doses
   * 
   * @param medications - Medications with doses to validate
   * @param patientData - Patient characteristics for dose adjustment
   * @returns Validation results for each medication
   */
  async validateDoses(
    medications: Array<{
      name: string;
      dose: string;
      frequency: string;
      route?: string;
    }>,
    patientData: {
      patientId: string;
      age?: number; // years
      weight?: number; // kg
      renalFunction?: number; // GFR in mL/min
      hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
    }
  ): Promise<{
    hasErrors: boolean;
    hasWarnings: boolean;
    validations: DoseValidationResult[];
  }> {
    try {
      logger.info(`Validating doses for ${medications.length} medications`);

      const validations: DoseValidationResult[] = [];

      for (const medication of medications) {
        const validation = await this.validateSingleDose(medication, patientData);
        validations.push(validation);
      }

      const hasErrors = validations.some(v => v.status === 'above-range' || v.status === 'toxic');
      const hasWarnings = validations.some(v => v.warnings.length > 0);

      return {
        hasErrors,
        hasWarnings,
        validations
      };
    } catch (error: any) {
      logger.error('Error validating doses:', error);
      throw error;
    }
  }

  /**
   * Validate a single medication dose
   */
  private async validateSingleDose(
    medication: {
      name: string;
      dose: string;
      frequency: string;
      route?: string;
    },
    patientData: {
      age?: number;
      weight?: number;
      renalFunction?: number;
      hepaticFunction?: 'normal' | 'mild' | 'moderate' | 'severe';
    }
  ): Promise<DoseValidationResult> {
    try {
      // Get therapeutic range from database
      const therapeuticRange = await this.getTherapeuticRange(
        medication.name,
        medication.route
      );

      if (!therapeuticRange) {
        // No therapeutic range data available
        return {
          isValid: true, // Can't validate without data
          prescribedDose: 0,
          prescribedUnit: '',
          therapeuticRange: { min: 0, max: 0, unit: '' },
          status: 'ok',
          warnings: ['No therapeutic range data available for validation'],
          recommendations: [],
          adjustmentNeeded: false
        };
      }

      // Parse prescribed dose
      const parsedDose = TherapeuticRangeModel.parseDose(medication.dose);
      if (!parsedDose) {
        return {
          isValid: false,
          prescribedDose: 0,
          prescribedUnit: '',
          therapeuticRange: { 
            min: therapeuticRange.minDose, 
            max: therapeuticRange.maxDose, 
            unit: therapeuticRange.unit 
          },
          status: 'toxic',
          warnings: ['Cannot parse dose format'],
          recommendations: ['Review dose format: expected format like "500mg"'],
          adjustmentNeeded: true
        };
      }

      // Convert to standard unit if needed
      let doseValue = parsedDose.value;
      if (parsedDose.unit !== therapeuticRange.unit) {
        try {
          doseValue = TherapeuticRangeModel.convertUnit(
            parsedDose.value,
            parsedDose.unit,
            therapeuticRange.unit
          );
        } catch {
          return {
            isValid: false,
            prescribedDose: parsedDose.value,
            prescribedUnit: parsedDose.unit,
            therapeuticRange: { 
              min: therapeuticRange.minDose, 
              max: therapeuticRange.maxDose, 
              unit: therapeuticRange.unit 
            },
            status: 'toxic',
            warnings: [`Unit mismatch: prescribed in ${parsedDose.unit}, expected ${therapeuticRange.unit}`],
            recommendations: [`Convert dose to ${therapeuticRange.unit}`],
            adjustmentNeeded: true
          };
        }
      }

      // Apply patient-specific adjustments
      let adjustedRange = {
        min: therapeuticRange.minDose,
        max: therapeuticRange.maxDose
      };
      const warnings: string[] = [];
      const recommendations: string[] = [];
      let adjustedDose: DoseValidationResult['adjustedDose'];

      // Age-based adjustment
      if (patientData.age) {
        if (patientData.age < 18 && therapeuticRange.pediatricDose) {
          warnings.push('Pediatric patient - adjusted dosing required');
          recommendations.push('Use pediatric dosing guidelines');
          
          if (patientData.weight) {
            const pediatricDose = TherapeuticRangeModel.calculatePediatricDose(
              medication.name,
              patientData.age * 12, // convert years to months
              patientData.weight,
              therapeuticRange.maxDose
            );
            
            adjustedDose = {
              dose: pediatricDose,
              unit: therapeuticRange.unit,
              reason: `Pediatric dose calculated using Clark's rule based on weight ${patientData.weight}kg`
            };
          }
        } else if (patientData.age >= 65 && therapeuticRange.geriatricDose) {
          const reduction = therapeuticRange.geriatricDose.adjustment;
          adjustedRange.max = adjustedRange.max * (1 - reduction / 100);
          warnings.push('Geriatric patient - dose reduction recommended');
          recommendations.push(`Consider ${reduction}% dose reduction for elderly patient`);
        }
      }

      // Renal function adjustment
      if (patientData.renalFunction && therapeuticRange.renalAdjustment) {
        const renalAdj = TherapeuticRangeModel.applyRenalAdjustment(
          doseValue,
          patientData.renalFunction,
          therapeuticRange.renalAdjustment
        );
        
        if (renalAdj.adjustment > 0) {
          warnings.push(`Renal impairment detected (GFR: ${patientData.renalFunction})`);
          recommendations.push(renalAdj.reason);
          adjustedDose = {
            dose: renalAdj.adjustedDose,
            unit: therapeuticRange.unit,
            reason: renalAdj.reason
          };
        }
      }

      // Hepatic function adjustment
      if (patientData.hepaticFunction && patientData.hepaticFunction !== 'normal' && 
          therapeuticRange.hepaticAdjustment) {
        warnings.push(`Hepatic impairment: ${patientData.hepaticFunction}`);
        recommendations.push(therapeuticRange.hepaticAdjustment.recommendation);
      }

      // Determine status
      let status: DoseValidationResult['status'];
      if (doseValue < adjustedRange.min) {
        status = 'sub-therapeutic';
        warnings.push('Dose below therapeutic range');
        recommendations.push(`Increase dose to at least ${adjustedRange.min}${therapeuticRange.unit}`);
      } else if (doseValue > adjustedRange.max) {
        status = 'toxic';
        warnings.push('Dose above therapeutic range - risk of toxicity');
        recommendations.push(`Reduce dose to maximum ${adjustedRange.max}${therapeuticRange.unit}`);
      } else if (doseValue < adjustedRange.min * 1.2) {
        status = 'below-range';
        warnings.push('Dose in lower therapeutic range');
      } else if (doseValue > adjustedRange.max * 0.8) {
        status = 'above-range';
        warnings.push('Dose in upper therapeutic range');
      } else {
        status = 'ok';
      }

      // Add monitoring recommendations
      if (therapeuticRange.monitoringRequired.length > 0) {
        recommendations.push(...therapeuticRange.monitoringRequired.map(m => 
          `Monitoring required: ${m}`
        ));
      }

      return {
        isValid: status !== 'toxic',
        prescribedDose: doseValue,
        prescribedUnit: therapeuticRange.unit,
        therapeuticRange: {
          min: adjustedRange.min,
          max: adjustedRange.max,
          unit: therapeuticRange.unit
        },
        status,
        warnings,
        recommendations,
        adjustmentNeeded: !!adjustedDose,
        adjustedDose
      };
    } catch (error: any) {
      logger.error('Error validating single dose:', error);
      throw error;
    }
  }

  /**
   * Get therapeutic range from database
   */
  private async getTherapeuticRange(
    medicationName: string,
    route?: string
  ): Promise<TherapeuticRange | null> {
    try {
      let query = `
        SELECT * FROM therapeutic_ranges
        WHERE LOWER(medication_name) = LOWER($1)
      `;
      const params: any[] = [medicationName];

      if (route) {
        query += ` AND route = $2`;
        params.push(route);
      }

      query += ` LIMIT 1`;

      const result = await db.query(query, params);

      if (result.rows.length === 0) return null;

      return TherapeuticRangeModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Therapeutic ranges table not found');
        return null;
      }
      throw error;
    }
  }

  /**
   * Determine highest severity from alerts
   */
  private determineHighestSeverity(
    alerts: AllergyAlert[]
  ): 'none' | 'mild' | 'moderate' | 'severe' | 'life-threatening' {
    if (alerts.length === 0) return 'none';

    const severities = alerts.map(a => a.severity);

    if (severities.includes('life-threatening')) return 'life-threatening';
    if (severities.includes('severe')) return 'severe';
    if (severities.includes('moderate')) return 'moderate';
    if (severities.includes('mild')) return 'mild';

    return 'none';
  }
}

export default DoseValidationService;

