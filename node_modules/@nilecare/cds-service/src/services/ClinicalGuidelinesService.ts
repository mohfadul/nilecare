/**
 * Clinical Guidelines Service
 * 
 * Provides evidence-based clinical practice guidelines
 * Helps ensure treatment follows best practices
 * 
 * Sources: UpToDate, NICE, CDC, WHO, AHA, etc.
 */

import { db, mongodb } from '../utils/database';
import { logger } from '../utils/logger';
import { 
  ClinicalGuideline, 
  GuidelineRecommendation,
  ClinicalGuidelineModel 
} from '../models/ClinicalGuideline';

export class ClinicalGuidelinesService {
  /**
   * Get relevant guidelines for patient conditions and medications
   * 
   * @param medications - Proposed medications
   * @param conditions - Patient conditions with ICD codes
   * @returns Relevant clinical guidelines
   */
  async getGuidelines(
    medications: Array<{ name: string }>,
    conditions: Array<{ code: string; name: string }>
  ): Promise<GuidelineRecommendation[]> {
    try {
      logger.info(`Getting guidelines for ${conditions.length} conditions and ${medications.length} medications`);

      if (conditions.length === 0) {
        return [];
      }

      // Get guidelines for each condition
      const guidelines: ClinicalGuideline[] = [];
      
      for (const condition of conditions) {
        const conditionGuidelines = await this.getGuidelinesForCondition(condition.code);
        guidelines.push(...conditionGuidelines);
      }

      // Filter to current guidelines only
      const currentGuidelines = guidelines.filter(g => 
        ClinicalGuidelineModel.isCurrent(g)
      );

      // Score and rank guidelines by applicability
      const medicationNames = medications.map(m => m.name);
      const conditionCodes = conditions.map(c => c.code);

      const scoredGuidelines = currentGuidelines.map(guideline => ({
        guideline,
        score: ClinicalGuidelineModel.getApplicabilityScore(
          guideline,
          conditionCodes,
          medicationNames
        )
      }));

      // Sort by score and take top 10
      const topGuidelines = scoredGuidelines
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Convert to recommendations
      return topGuidelines.map(({ guideline, score }) => ({
        guideline: guideline.title,
        condition: guideline.condition,
        recommendation: guideline.summary,
        evidenceLevel: ClinicalGuidelineModel.EVIDENCE_LEVELS[guideline.evidenceLevel],
        strength: guideline.strengthOfRecommendation,
        applicability: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
        reasoning: this.generateReasoning(guideline, medicationNames, score)
      }));
    } catch (error: any) {
      logger.error('Error getting guidelines:', error);
      throw error;
    }
  }

  /**
   * Get guidelines for a specific condition
   */
  private async getGuidelinesForCondition(icdCode: string): Promise<ClinicalGuideline[]> {
    try {
      const query = `
        SELECT * FROM clinical_guidelines
        WHERE $1 = ANY(icd_codes)
        ORDER BY last_reviewed DESC
        LIMIT 20
      `;

      const result = await db.query(query, [icdCode]);

      return result.rows.map(row => ClinicalGuidelineModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        logger.warn('Clinical guidelines table not found');
        return [];
      }
      throw error;
    }
  }

  /**
   * Search guidelines by keyword
   */
  async searchGuidelines(query: string): Promise<ClinicalGuideline[]> {
    try {
      const searchQuery = `
        SELECT * FROM clinical_guidelines
        WHERE 
          LOWER(title) LIKE LOWER($1) OR
          LOWER(condition) LIKE LOWER($1) OR
          LOWER(summary) LIKE LOWER($1) OR
          $2 = ANY(tags)
        ORDER BY last_reviewed DESC
        LIMIT 50
      `;

      const searchTerm = `%${query}%`;
      const result = await db.query(searchQuery, [searchTerm, query.toLowerCase()]);

      return result.rows.map(row => ClinicalGuidelineModel.fromDatabaseRow(row));
    } catch (error: any) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get guideline by ID
   */
  async getGuidelineById(id: string): Promise<ClinicalGuideline | null> {
    try {
      const query = `SELECT * FROM clinical_guidelines WHERE id = $1`;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) return null;

      return ClinicalGuidelineModel.fromDatabaseRow(result.rows[0]);
    } catch (error: any) {
      if (error.code === '42P01') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate reasoning for why guideline is recommended
   */
  private generateReasoning(
    guideline: ClinicalGuideline,
    medications: string[],
    score: number
  ): string {
    const reasons: string[] = [];

    if (score >= 50) {
      reasons.push('Patient condition matches guideline');
    }

    const firstLineMatch = medications.some(med => 
      guideline.firstLineTherapy.some(therapy => 
        therapy.toLowerCase().includes(med.toLowerCase())
      )
    );

    if (firstLineMatch) {
      reasons.push('Proposed medication is first-line therapy');
    }

    const secondLineMatch = medications.some(med => 
      guideline.secondLineTherapy.some(therapy => 
        therapy.toLowerCase().includes(med.toLowerCase())
      )
    );

    if (secondLineMatch) {
      reasons.push('Proposed medication is second-line therapy');
    }

    if (guideline.evidenceLevel === 'A') {
      reasons.push('High-quality evidence (Grade A)');
    }

    if (reasons.length === 0) {
      reasons.push('General guideline for this condition');
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Get guideline statistics
   */
  async getStatistics(): Promise<{
    totalGuidelines: number;
    byCategory: Record<string, number>;
    byEvidenceLevel: Record<string, number>;
    currentGuidelines: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          category,
          evidence_level,
          COUNT(*) FILTER (WHERE last_reviewed > NOW() - INTERVAL '5 years') as current
        FROM clinical_guidelines
        GROUP BY category, evidence_level
      `;

      const result = await db.query(query);

      return {
        totalGuidelines: result.rows.reduce((sum, row) => sum + parseInt(row.total), 0),
        byCategory: result.rows.reduce((acc, row) => {
          acc[row.category] = (acc[row.category] || 0) + parseInt(row.total);
          return acc;
        }, {} as Record<string, number>),
        byEvidenceLevel: result.rows.reduce((acc, row) => {
          acc[row.evidence_level] = (acc[row.evidence_level] || 0) + parseInt(row.total);
          return acc;
        }, {} as Record<string, number>),
        currentGuidelines: result.rows.reduce((sum, row) => sum + parseInt(row.current || '0'), 0)
      };
    } catch (error: any) {
      if (error.code === '42P01') {
        return {
          totalGuidelines: 0,
          byCategory: {},
          byEvidenceLevel: {},
          currentGuidelines: 0
        };
      }
      throw error;
    }
  }
}

export default ClinicalGuidelinesService;

