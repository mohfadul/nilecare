/**
 * Allergy Service
 * 
 * Checks for medication allergies and cross-reactivity
 * Critical for patient safety - prevents allergic reactions
 * 
 * Reference: OpenEMR allergy checking patterns
 */

import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { Allergy, AllergyAlert, AllergyCheckResult, AllergyModel, CROSS_REACTIVITY_PATTERNS } from '../models/Allergy';

export class AllergyService {
  /**
   * Check if medication triggers patient allergies
   * 
   * @param medications - Medications to check
   * @param patientAllergies - Patient's known allergies
   * @returns Allergy check result with alerts
   */
  async checkAllergies(
    medications: Array<{ name: string; rxNormCode?: string }>,
    patientAllergies: string[]
  ): Promise<AllergyCheckResult> {
    try {
      logger.info(`Checking allergies for ${medications.length} medications against ${patientAllergies.length} allergies`);

      if (patientAllergies.length === 0) {
        return {
          hasAlerts: false,
          alerts: [],
          highestSeverity: 'none',
          blocksAdministration: false
        };
      }

      const alerts: AllergyAlert[] = [];

      // Check each medication against each allergy
      for (const medication of medications) {
        for (const allergen of patientAllergies) {
          // Direct match check
          const directMatch = await this.checkDirectMatch(medication.name, allergen);
          if (directMatch) {
            alerts.push(directMatch);
          }

          // Cross-reactivity check
          const crossReactivity = await this.checkCrossReactivity(medication.name, allergen);
          if (crossReactivity) {
            alerts.push(crossReactivity);
          }

          // Class warning check
          const classWarning = await this.checkClassWarning(medication.name, allergen);
          if (classWarning) {
            alerts.push(classWarning);
          }
        }
      }

      // Determine highest severity
      const highestSeverity = this.determineHighestSeverity(alerts);

      // Check if any alert blocks administration
      const blocksAdministration = alerts.some(alert => 
        alert.severity === 'severe' || alert.severity === 'life-threatening'
      );

      return {
        hasAlerts: alerts.length > 0,
        alerts,
        highestSeverity,
        blocksAdministration
      };
    } catch (error: any) {
      logger.error('Error checking allergies:', error);
      throw error;
    }
  }

  /**
   * Check for direct allergen match
   */
  private async checkDirectMatch(
    medicationName: string,
    allergen: string
  ): Promise<AllergyAlert | null> {
    try {
      const query = `
        SELECT * FROM allergies
        WHERE LOWER(allergen) = LOWER($1)
          AND LOWER(allergen) = LOWER($2)
        LIMIT 1
      `;

      const result = await db.query(query, [medicationName, allergen]);

      if (result.rows.length === 0) return null;

      const allergy = AllergyModel.fromDatabaseRow(result.rows[0]);

      return {
        severity: allergy.severity,
        allergen: allergy.allergen,
        medication: medicationName,
        alertType: 'direct-match',
        description: `Direct allergy match: Patient has documented ${allergy.severity} allergy to ${allergen}`,
        recommendation: `DO NOT ADMINISTER. Patient has known ${allergy.severity} allergy. Previous reaction: ${allergy.reaction}`
      };
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Allergies table not found');
        return null;
      }
      throw error;
    }
  }

  /**
   * Check for cross-reactivity
   */
  private async checkCrossReactivity(
    medicationName: string,
    allergen: string
  ): Promise<AllergyAlert | null> {
    try {
      // Get medication class
      const medicationClass = await this.getMedicationClass(medicationName);
      if (!medicationClass) return null;

      // Get allergen class
      const allergenClass = await this.getAllergenClass(allergen);
      if (!allergenClass) return null;

      // Check cross-reactivity
      const crossReactivity = AllergyModel.hasCrossReactivity(
        allergenClass,
        medicationClass
      );

      if (!crossReactivity.hasCrossReactivity) return null;

      return {
        severity: 'moderate', // Cross-reactivity is typically moderate risk
        allergen,
        medication: medicationName,
        alertType: 'cross-reactivity',
        crossReactivityRisk: crossReactivity.riskPercentage,
        description: `Possible cross-reactivity: ${medicationClass} with ${allergenClass} allergy`,
        recommendation: `Use with caution. Cross-reactivity risk: ${crossReactivity.riskPercentage}%. Monitor patient closely for allergic reactions.`
      };
    } catch (error: any) {
      logger.error('Error checking cross-reactivity:', error);
      return null;
    }
  }

  /**
   * Check for class warning (same drug class)
   */
  private async checkClassWarning(
    medicationName: string,
    allergen: string
  ): Promise<AllergyAlert | null> {
    try {
      const medicationClass = await this.getMedicationClass(medicationName);
      const allergenClass = await this.getAllergenClass(allergen);

      if (!medicationClass || !allergenClass) return null;

      if (medicationClass.toLowerCase() === allergenClass.toLowerCase()) {
        return {
          severity: 'moderate',
          allergen,
          medication: medicationName,
          alertType: 'class-warning',
          description: `Same drug class: Both are ${medicationClass}`,
          recommendation: `Review carefully. Both belong to ${medicationClass} class. Consider alternative drug class.`
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Error checking class warning:', error);
      return null;
    }
  }

  /**
   * Get medication class from database
   */
  private async getMedicationClass(medicationName: string): Promise<string | null> {
    try {
      const query = `
        SELECT drug_class FROM medications
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
      `;

      const result = await db.query(query, [medicationName]);

      if (result.rows.length === 0) {
        // Fallback: try to infer from medication name
        return this.inferMedicationClass(medicationName);
      }

      return result.rows[0].drug_class;
    } catch (error: any) {
      if (error.code === '42P01') {
        // Table doesn't exist - use inference
        return this.inferMedicationClass(medicationName);
      }
      return null;
    }
  }

  /**
   * Infer medication class from name (basic pattern matching)
   */
  private inferMedicationClass(medicationName: string): string | null {
    const name = medicationName.toLowerCase();

    // Common patterns
    if (name.includes('cillin')) return 'penicillin';
    if (name.includes('cef') || name.includes('ceph')) return 'cephalosporin';
    if (name.includes('sulfa')) return 'sulfonamide';
    if (name.endsWith('pril')) return 'ace-inhibitor';
    if (name.endsWith('sartan')) return 'arb';
    if (name.endsWith('statin')) return 'statin';
    if (name.includes('aspirin') || name.includes('ibuprofen')) return 'nsaid';

    return null;
  }

  /**
   * Get allergen class
   */
  private async getAllergenClass(allergen: string): Promise<string | null> {
    // Similar to medication class but for allergens
    return this.inferMedicationClass(allergen);
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

export default AllergyService;

