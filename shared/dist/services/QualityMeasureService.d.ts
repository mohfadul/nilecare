/**
 * Clinical Quality Measure Service
 * Calculates healthcare quality metrics and performance indicators
 * Sudan-specific: Aligned with Sudan Ministry of Health standards
 */
import { Pool } from 'pg';
export interface MeasureDefinition {
    measureId: string;
    measureName: string;
    measureType: 'process' | 'outcome' | 'structure' | 'balancing';
    category: 'clinical' | 'safety' | 'efficiency' | 'patient_experience';
    description: string;
    numeratorDescription: string;
    denominatorDescription: string;
    exclusionDescription?: string;
    benchmark: number;
    reportingPeriod: 'monthly' | 'quarterly' | 'annual';
    sudanMoHRequired: boolean;
}
export interface MeasureResult {
    measureId: string;
    facilityId: string;
    facilityName?: string;
    reportingPeriod: {
        start: Date;
        end: Date;
    };
    denominatorCount: number;
    numeratorCount: number;
    exclusionCount: number;
    performanceRate: number;
    benchmark: number;
    status: 'exceeds' | 'meets' | 'below' | 'critical';
    variance: number;
    trend?: 'improving' | 'stable' | 'declining';
    calculatedAt: Date;
}
export interface QualityDashboard {
    facilityId: string;
    reportingPeriod: {
        start: Date;
        end: Date;
    };
    overallScore: number;
    measures: MeasureResult[];
    summary: {
        totalMeasures: number;
        exceeding: number;
        meeting: number;
        below: number;
        critical: number;
    };
    sudanMoHCompliance: boolean;
}
export declare class QualityMeasureService {
    private pool;
    private readonly SUDAN_MOH_MEASURES;
    constructor(pool: Pool);
    /**
     * Calculate measure performance for a facility
     * @param measureId - Quality measure ID
     * @param facilityId - Facility UUID
     * @param startDate - Reporting period start
     * @param endDate - Reporting period end
     */
    calculateMeasurePerformance(measureId: string, facilityId: string, startDate: Date, endDate: Date): Promise<MeasureResult>;
    /**
     * Get measure definition
     */
    private getMeasureDefinition;
    /**
     * Calculate denominator (eligible population)
     */
    private calculateDenominator;
    /**
     * Calculate numerator (meeting criteria)
     */
    private calculateNumerator;
    /**
     * Calculate exclusions
     */
    private calculateExclusions;
    /**
     * Determine performance status
     */
    private getPerformanceStatus;
    /**
     * Calculate trend
     */
    private calculateTrend;
    /**
     * Store measure result
     */
    private storeMeasureResult;
    /**
     * Generate quality dashboard for facility
     */
    generateQualityDashboard(facilityId: string, startDate: Date, endDate: Date): Promise<QualityDashboard>;
    /**
     * Generate Sudan Ministry of Health report
     */
    generateSudanMoHReport(facilityId: string, year: number, quarter: number): Promise<any>;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
}
export default QualityMeasureService;
//# sourceMappingURL=QualityMeasureService.d.ts.map