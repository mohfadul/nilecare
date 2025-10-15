/**
 * Contraindication Service
 * 
 * Checks for drug-disease contraindications
 * Prevents medication use in inappropriate conditions
 * 
 * Integrates with EHR Service to get patient problem lists
 */

import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { 
  Contraindication, 
  ContraindicationAlert, 
  ContraindicationCheckResult,
  ContraindicationModel 
} from '../models/Contraindication';

export class ContraindicationService {
  /**
   * Check for contraindications
   * 
   * @param medications - Medications to check
   * @param conditions - Patient conditions (ICD-10 codes)
   * @returns Contraindication check result
   */
  async checkContraindications(
    medications: Array<{ name: string; rxNormCode?: string }>,
    conditions: Array<{ code: string; name: string }>
  ): Promise<ContraindicationCheckResult> {
    try {
      logger.info(`Checking contraindications for ${medications.length} medications against ${conditions.length} conditions`);

      if (conditions.length === 0) {
        return {
          hasContraindications: false,
          contraindications: [],
          absoluteContraindications: [],
          relativeContraindications: [],
          blocksAdministration: false
        };
      }

      const contraindications: ContraindicationAlert[] = [];

      // Check each medication against each condition
      for (const medication of medications) {
        for (const condition of conditions) {
          const found = await this.queryContraindication(medication.name, condition.code);
          
          if (found) {
            const alert = this.createAlert(found, medication.name, condition.name);
            contraindications.push(alert);
          }
        }
      }

      // Separate by type
      const absoluteContraindications = contraindications.filter(c => c.type === 'absolute');
      const relativeContraindications = contraindications.filter(c => c.type === 'relative');

      // Check if any blocks administration
      const blocksAdministration = contraindications.some(c => c.blocksAdministration);

      return {
        hasContraindications: contraindications.length > 0,
        contraindications,
        absoluteContraindications,
        relativeContraindications,
        blocksAdministration
      };
    } catch (error: any) {
      logger.error('Error checking contraindications:', error);
      throw error;
    }
  }

  /**
   * Query database for contraindication
   */
  private async queryContraindication(
    medicationName: string,
    icdCode: string
  ): Promise<Contraindication | null> {
    try {
      const query = `
        SELECT * FROM contraindications
        WHERE LOWER(medication_name) = LOWER($1)
          AND icd_code = $2
        LIMIT 1
      `;

      const result = await db.query(query, [medicationName, icdCode]);

      if (result.rows.length === 0) return null;

      return ContraindicationModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Contraindications table not found');
        return null;
      }
      throw error;
    }
  }

  /**
   * Create alert from contraindication
   */
  private createAlert(
    contraindication: Contraindication,
    medicationName: string,
    conditionName: string
  ): ContraindicationAlert {
    return {
      type: contraindication.type,
      severity: contraindication.severity,
      medication: medicationName,
      condition: conditionName,
      description: contraindication.description,
      clinicalRationale: contraindication.clinicalRationale,
      alternatives: contraindication.alternatives,
      recommendation: ContraindicationModel.generateRecommendation(contraindication),
      blocksAdministration: ContraindicationModel.blocksAdministration(contraindication)
    };
  }

  /**
   * Get absolute contraindications for a medication
   */
  async getAbsoluteContraindications(medicationName: string): Promise<Contraindication[]> {
    try {
      const query = `
        SELECT * FROM contraindications
        WHERE LOWER(medication_name) = LOWER($1)
          AND type = 'absolute'
        ORDER BY severity DESC
      `;

      const result = await db.query(query, [medicationName]);

      return result.rows.map(row => ContraindicationModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get relative contraindications for a medication
   */
  async getRelativeContraindications(medicationName: string): Promise<Contraindication[]> {
    try {
      const query = `
        SELECT * FROM contraindications
        WHERE LOWER(medication_name) = LOWER($1)
          AND type = 'relative'
        ORDER BY severity DESC
      `;

      const result = await db.query(query, [medicationName]);

      return result.rows.map(row => ContraindicationModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }
}

export default ContraindicationService;

