/**
 * Drug Interaction Service
 * 
 * Core service for checking drug-drug interactions
 * Based on DrugBank, FDA, and other authoritative sources
 * 
 * Reference: OpenEMR prescription module patterns
 * @see https://github.com/mohfadul/openemr-nilecare
 */

import { db, cache } from '../utils/database';
import { logger, logSafetyCheck } from '../utils/logger';
import { DrugInteraction, InteractionCheckResult, DrugInteractionModel } from '../models/DrugInteraction';

export class DrugInteractionService {
  /**
   * Check for drug-drug interactions
   * 
   * @param medications - Array of medications to check
   * @returns Interaction check result with all found interactions
   */
  async checkInteractions(medications: Array<{
    id?: string;
    name: string;
    rxNormCode?: string;
  }>): Promise<InteractionCheckResult> {
    try {
      logger.info(`Checking interactions for ${medications.length} medications`);

      if (medications.length < 2) {
        return {
          hasInteractions: false,
          interactions: [],
          highestSeverity: 'none',
          requiresAction: false
        };
      }

      // Check cache first
      const medicationNames = medications.map(m => m.name.toLowerCase()).sort();
      const cached = await cache.getCachedInteractionCheck(medicationNames);
      if (cached) {
        logger.info('Returning cached interaction check result');
        return cached;
      }

      // Query database for interactions
      const interactions = await this.queryInteractions(medications);

      // Determine highest severity
      const highestSeverity = this.determineHighestSeverity(interactions);

      // Check if any interaction requires action
      const requiresAction = interactions.some(i => 
        DrugInteractionModel.requiresAction(i.severity)
      );

      const result: InteractionCheckResult = {
        hasInteractions: interactions.length > 0,
        interactions: interactions.map(i => ({
          severity: i.severity,
          drug1: i.drug1,
          drug2: i.drug2,
          description: i.description,
          recommendation: i.recommendation,
          evidenceLevel: i.evidenceLevel
        })),
        highestSeverity,
        requiresAction
      };

      // Cache result for 1 hour
      await cache.cacheInteractionCheck(medicationNames, result, 3600);

      // Log safety check
      logSafetyCheck({
        checkType: 'drug-interaction',
        patientId: 'system', // Don't log patient ID here (PHI)
        medications: medicationNames,
        riskLevel: highestSeverity,
        findings: { interactionCount: interactions.length }
      });

      return result;
    } catch (error: any) {
      logger.error('Error checking drug interactions:', error);
      throw error;
    }
  }

  /**
   * Query database for interactions between medications
   */
  private async queryInteractions(medications: Array<{
    name: string;
    rxNormCode?: string;
  }>): Promise<DrugInteraction[]> {
    try {
      // Build medication pairs to check
      const pairs: Array<[string, string]> = [];
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          pairs.push([
            medications[i].name.toLowerCase(),
            medications[j].name.toLowerCase()
          ]);
        }
      }

      if (pairs.length === 0) {
        return [];
      }

      // Query for all pairs
      const query = `
        SELECT * FROM drug_interactions
        WHERE (
          (LOWER(drug1_name) = ANY($1) AND LOWER(drug2_name) = ANY($2))
          OR
          (LOWER(drug2_name) = ANY($1) AND LOWER(drug1_name) = ANY($2))
        )
        ORDER BY 
          CASE severity
            WHEN 'critical' THEN 1
            WHEN 'major' THEN 2
            WHEN 'moderate' THEN 3
            WHEN 'minor' THEN 4
          END
      `;

      const drug1Names = pairs.map(p => p[0]);
      const drug2Names = pairs.map(p => p[1]);

      const result = await db.query(query, [drug1Names, drug2Names]);

      return result.rows.map(row => DrugInteractionModel.fromDatabaseRow(row));
    } catch (error: any) {
      // If table doesn't exist yet, return empty array (development mode)
      if (error.code === '42P01') {
        logger.warn('Drug interactions table not found - returning empty result');
        return [];
      }
      throw error;
    }
  }

  /**
   * Determine highest severity from interactions list
   */
  private determineHighestSeverity(
    interactions: DrugInteraction[]
  ): 'none' | 'minor' | 'moderate' | 'major' | 'critical' {
    if (interactions.length === 0) return 'none';

    const severities = interactions.map(i => i.severity);
    
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('major')) return 'major';
    if (severities.includes('moderate')) return 'moderate';
    if (severities.includes('minor')) return 'minor';
    
    return 'none';
  }

  /**
   * Get interactions for a specific medication
   */
  async getInteractionsForMedication(
    medicationName: string,
    rxNormCode?: string
  ): Promise<DrugInteraction[]> {
    try {
      const query = `
        SELECT * FROM drug_interactions
        WHERE LOWER(drug1_name) = LOWER($1)
           OR LOWER(drug2_name) = LOWER($1)
        ORDER BY severity DESC
        LIMIT 100
      `;

      const result = await db.query(query, [medicationName]);

      return result.rows.map(row => DrugInteractionModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Drug interactions table not found');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get interaction statistics
   */
  async getStatistics(): Promise<{
    totalInteractions: number;
    bySeverity: Record<string, number>;
    lastUpdated: Date | null;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN severity = 'minor' THEN 1 END) as minor,
          COUNT(CASE WHEN severity = 'moderate' THEN 1 END) as moderate,
          COUNT(CASE WHEN severity = 'major' THEN 1 END) as major,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
          MAX(updated_at) as last_updated
        FROM drug_interactions
      `;

      const result = await db.query(query);
      const row = result.rows[0];

      return {
        totalInteractions: parseInt(row.total || '0'),
        bySeverity: {
          minor: parseInt(row.minor || '0'),
          moderate: parseInt(row.moderate || '0'),
          major: parseInt(row.major || '0'),
          critical: parseInt(row.critical || '0')
        },
        lastUpdated: row.last_updated
      };
    } catch (error: any) {
      if (error.code === '42P01') {
        return {
          totalInteractions: 0,
          bySeverity: { minor: 0, moderate: 0, major: 0, critical: 0 },
          lastUpdated: null
        };
      }
      throw error;
    }
  }
}

export default DrugInteractionService;

