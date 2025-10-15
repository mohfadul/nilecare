/**
 * Clinical Guideline Model
 * 
 * Represents evidence-based clinical practice guidelines
 * Sources: UpToDate, NICE, CDC, WHO, etc.
 */

export interface ClinicalGuideline {
  id: string;
  title: string;
  condition: string;
  icdCodes: string[];
  snomedCodes: string[];
  
  // Guideline content
  summary: string;
  recommendations: string[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D'; // Grade of evidence
  strengthOfRecommendation: 'strong' | 'moderate' | 'weak';
  
  // Medication recommendations
  firstLineTherapy: string[];
  secondLineTherapy: string[];
  contraindicatedMedications: string[];
  
  // Monitoring and follow-up
  monitoringRecommendations: string[];
  followUpInterval: string;
  
  // Metadata
  source: string; // e.g., 'NICE', 'CDC', 'AHA'
  publicationDate: Date;
  lastReviewed: Date;
  expiryDate?: Date;
  
  // Tags for searching
  tags: string[];
  category: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidelineRecommendation {
  guideline: string;
  condition: string;
  recommendation: string;
  evidenceLevel: string;
  strength: string;
  applicability: 'high' | 'medium' | 'low';
  reasoning: string;
}

export class ClinicalGuidelineModel {
  /**
   * Evidence level descriptions
   */
  static readonly EVIDENCE_LEVELS = {
    A: 'High-quality evidence (RCTs, systematic reviews)',
    B: 'Moderate-quality evidence (cohort studies)',
    C: 'Low-quality evidence (case series)',
    D: 'Expert opinion only'
  };

  /**
   * Check if guideline is current
   */
  static isCurrent(guideline: ClinicalGuideline): boolean {
    if (guideline.expiryDate) {
      return new Date() < guideline.expiryDate;
    }
    
    // Guidelines should be reviewed at least every 5 years
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    return guideline.lastReviewed > fiveYearsAgo;
  }

  /**
   * Match guideline to patient conditions
   */
  static matchesCondition(guideline: ClinicalGuideline, icdCode: string): boolean {
    return guideline.icdCodes.includes(icdCode);
  }

  /**
   * Get applicability score (0-100)
   */
  static getApplicabilityScore(
    guideline: ClinicalGuideline,
    patientConditions: string[],
    proposedMedications: string[]
  ): number {
    let score = 0;

    // Condition match (50 points)
    const conditionMatch = patientConditions.some(condition =>
      guideline.icdCodes.includes(condition)
    );
    if (conditionMatch) score += 50;

    // Medication alignment (30 points)
    const medsAligned = proposedMedications.some(med =>
      guideline.firstLineTherapy.includes(med) ||
      guideline.secondLineTherapy.includes(med)
    );
    if (medsAligned) score += 30;

    // Current guideline (10 points)
    if (this.isCurrent(guideline)) score += 10;

    // High evidence level (10 points)
    if (guideline.evidenceLevel === 'A') score += 10;

    return Math.min(score, 100);
  }

  /**
   * Convert database row to ClinicalGuideline object
   */
  static fromDatabaseRow(row: any): ClinicalGuideline {
    return {
      id: row.id,
      title: row.title,
      condition: row.condition,
      icdCodes: row.icd_codes || [],
      snomedCodes: row.snomed_codes || [],
      summary: row.summary,
      recommendations: row.recommendations || [],
      evidenceLevel: row.evidence_level,
      strengthOfRecommendation: row.strength_of_recommendation,
      firstLineTherapy: row.first_line_therapy || [],
      secondLineTherapy: row.second_line_therapy || [],
      contraindicatedMedications: row.contraindicated_medications || [],
      monitoringRecommendations: row.monitoring_recommendations || [],
      followUpInterval: row.follow_up_interval,
      source: row.source,
      publicationDate: row.publication_date,
      lastReviewed: row.last_reviewed,
      expiryDate: row.expiry_date,
      tags: row.tags || [],
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default ClinicalGuideline;

