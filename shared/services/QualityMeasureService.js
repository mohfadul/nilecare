"use strict";
/**
 * Clinical Quality Measure Service
 * Calculates healthcare quality metrics and performance indicators
 * Sudan-specific: Aligned with Sudan Ministry of Health standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QualityMeasureService = void 0;
const uuid_1 = require("uuid");
class QualityMeasureService {
    constructor(pool) {
        // Sudan Ministry of Health Quality Measures
        this.SUDAN_MOH_MEASURES = [
            {
                measureId: 'SUDAN-001',
                measureName: 'Timely Antibiotic Administration',
                measureType: 'process',
                category: 'clinical',
                description: 'Percentage of patients who received antibiotics within 1 hour of arrival for pneumonia',
                numeratorDescription: 'Patients who received antibiotics within 1 hour',
                denominatorDescription: 'All patients with pneumonia diagnosis',
                benchmark: 0.95,
                reportingPeriod: 'quarterly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-002',
                measureName: 'Medication Reconciliation',
                measureType: 'process',
                category: 'safety',
                description: 'Percentage of patients with medication reconciliation completed at admission',
                numeratorDescription: 'Patients with completed medication reconciliation',
                denominatorDescription: 'All admitted patients',
                benchmark: 0.90,
                reportingPeriod: 'monthly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-003',
                measureName: 'Hand Hygiene Compliance',
                measureType: 'process',
                category: 'safety',
                description: 'Percentage of healthcare workers complying with hand hygiene protocols',
                numeratorDescription: 'Observed hand hygiene compliance events',
                denominatorDescription: 'Total hand hygiene opportunities',
                benchmark: 0.95,
                reportingPeriod: 'monthly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-004',
                measureName: 'Critical Lab Result Notification',
                measureType: 'process',
                category: 'safety',
                description: 'Percentage of critical lab results communicated to provider within 30 minutes',
                numeratorDescription: 'Critical results communicated within 30 minutes',
                denominatorDescription: 'All critical lab results',
                benchmark: 0.98,
                reportingPeriod: 'monthly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-005',
                measureName: '30-Day Readmission Rate',
                measureType: 'outcome',
                category: 'efficiency',
                description: 'Percentage of patients readmitted within 30 days of discharge',
                numeratorDescription: 'Patients readmitted within 30 days',
                denominatorDescription: 'All discharged patients',
                benchmark: 0.15, // Lower is better
                reportingPeriod: 'quarterly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-006',
                measureName: 'Patient Satisfaction Score',
                measureType: 'outcome',
                category: 'patient_experience',
                description: 'Average patient satisfaction score (0-10 scale)',
                numeratorDescription: 'Sum of satisfaction scores',
                denominatorDescription: 'Number of completed surveys',
                benchmark: 0.85, // 8.5/10
                reportingPeriod: 'quarterly',
                sudanMoHRequired: false
            },
            {
                measureId: 'SUDAN-007',
                measureName: 'Surgical Site Infection Rate',
                measureType: 'outcome',
                category: 'safety',
                description: 'Percentage of surgical patients with post-operative infections',
                numeratorDescription: 'Patients with surgical site infections',
                denominatorDescription: 'All surgical procedures',
                benchmark: 0.02, // Lower is better
                reportingPeriod: 'quarterly',
                sudanMoHRequired: true
            },
            {
                measureId: 'SUDAN-008',
                measureName: 'Emergency Department Wait Time',
                measureType: 'process',
                category: 'efficiency',
                description: 'Average wait time in emergency department (minutes)',
                numeratorDescription: 'Sum of wait times',
                denominatorDescription: 'Number of ED visits',
                benchmark: 30, // 30 minutes or less
                reportingPeriod: 'monthly',
                sudanMoHRequired: true
            }
        ];
        this.pool = pool;
    }
    /**
     * Calculate measure performance for a facility
     * @param measureId - Quality measure ID
     * @param facilityId - Facility UUID
     * @param startDate - Reporting period start
     * @param endDate - Reporting period end
     */
    async calculateMeasurePerformance(measureId, facilityId, startDate, endDate) {
        const measure = await this.getMeasureDefinition(measureId);
        if (!measure) {
            throw new Error(`Measure ${measureId} not found`);
        }
        // Calculate denominator (eligible population)
        const denominator = await this.calculateDenominator(measure, facilityId, startDate, endDate);
        // Calculate numerator (meeting criteria)
        const numerator = await this.calculateNumerator(measure, facilityId, startDate, endDate, denominator);
        // Calculate exclusions
        const exclusions = await this.calculateExclusions(measure, facilityId, startDate, endDate, denominator);
        // Calculate performance rate
        const adjustedDenominator = denominator - exclusions;
        const performanceRate = adjustedDenominator > 0 ? numerator / adjustedDenominator : 0;
        // Determine status
        const status = this.getPerformanceStatus(performanceRate, measure.benchmark, measure.measureId);
        // Calculate variance from benchmark
        const variance = performanceRate - measure.benchmark;
        // Get facility name
        const facilityResult = await this.pool.query('SELECT facility_name FROM facilities WHERE id = $1', [facilityId]);
        const facilityName = facilityResult.rows[0]?.facility_name;
        // Get trend
        const trend = await this.calculateTrend(measureId, facilityId, startDate);
        const result = {
            measureId,
            facilityId,
            facilityName,
            reportingPeriod: { start: startDate, end: endDate },
            denominatorCount: denominator,
            numeratorCount: numerator,
            exclusionCount: exclusions,
            performanceRate,
            benchmark: measure.benchmark,
            status,
            variance,
            trend,
            calculatedAt: new Date()
        };
        // Store result
        await this.storeMeasureResult(result);
        return result;
    }
    /**
     * Get measure definition
     */
    async getMeasureDefinition(measureId) {
        return this.SUDAN_MOH_MEASURES.find(m => m.measureId === measureId) || null;
    }
    /**
     * Calculate denominator (eligible population)
     */
    async calculateDenominator(measure, facilityId, startDate, endDate) {
        let query;
        switch (measure.measureId) {
            case 'SUDAN-001': // Antibiotic administration
                query = `
          SELECT COUNT(DISTINCT e.id)
          FROM encounters e
          JOIN diagnoses d ON e.id = d.encounter_id
          WHERE e.facility_id = $1
            AND e.admission_date BETWEEN $2 AND $3
            AND d.diagnosis_code LIKE 'J%'  -- Pneumonia ICD-10 codes
        `;
                break;
            case 'SUDAN-002': // Medication reconciliation
                query = `
          SELECT COUNT(DISTINCT id)
          FROM encounters
          WHERE facility_id = $1
            AND admission_date BETWEEN $2 AND $3
            AND encounter_type = 'inpatient'
        `;
                break;
            case 'SUDAN-004': // Critical lab results
                query = `
          SELECT COUNT(DISTINCT id)
          FROM lab_results
          WHERE facility_id = $1
            AND result_date BETWEEN $2 AND $3
            AND is_critical = TRUE
        `;
                break;
            case 'SUDAN-005': // 30-day readmission
                query = `
          SELECT COUNT(DISTINCT patient_id)
          FROM encounters
          WHERE facility_id = $1
            AND discharge_date BETWEEN $2 AND $3
            AND discharge_disposition = 'home'
        `;
                break;
            default:
                query = `SELECT 0`;
        }
        const result = await this.pool.query(query, [facilityId, startDate, endDate]);
        return parseInt(result.rows[0].count || result.rows[0][Object.keys(result.rows[0])[0]] || '0');
    }
    /**
     * Calculate numerator (meeting criteria)
     */
    async calculateNumerator(measure, facilityId, startDate, endDate, denominator) {
        if (denominator === 0)
            return 0;
        let query;
        switch (measure.measureId) {
            case 'SUDAN-001': // Antibiotic within 1 hour
                query = `
          SELECT COUNT(DISTINCT e.id)
          FROM encounters e
          JOIN diagnoses d ON e.id = d.encounter_id
          JOIN medications m ON e.id = m.encounter_id
          WHERE e.facility_id = $1
            AND e.admission_date BETWEEN $2 AND $3
            AND d.diagnosis_code LIKE 'J%'
            AND m.medication_name LIKE '%antibiotic%'
            AND m.start_date <= e.admission_date + INTERVAL '1 hour'
        `;
                break;
            case 'SUDAN-002': // Medication reconciliation completed
                query = `
          SELECT COUNT(DISTINCT e.id)
          FROM encounters e
          JOIN clinical_notes cn ON e.id = cn.encounter_id
          WHERE e.facility_id = $1
            AND e.admission_date BETWEEN $2 AND $3
            AND e.encounter_type = 'inpatient'
            AND cn.note_type = 'admission'
            AND cn.note_title LIKE '%medication reconciliation%'
        `;
                break;
            case 'SUDAN-004': // Critical results within 30 minutes
                query = `
          SELECT COUNT(DISTINCT id)
          FROM lab_results
          WHERE facility_id = $1
            AND result_date BETWEEN $2 AND $3
            AND is_critical = TRUE
            AND critical_notified = TRUE
            AND critical_notified_date <= result_date + INTERVAL '30 minutes'
        `;
                break;
            case 'SUDAN-005': // 30-day readmissions
                query = `
          SELECT COUNT(DISTINCT e1.patient_id)
          FROM encounters e1
          JOIN encounters e2 ON e1.patient_id = e2.patient_id
          WHERE e1.facility_id = $1
            AND e1.discharge_date BETWEEN $2 AND $3
            AND e2.admission_date BETWEEN e1.discharge_date AND e1.discharge_date + INTERVAL '30 days'
            AND e2.id != e1.id
        `;
                break;
            default:
                query = `SELECT 0`;
        }
        const result = await this.pool.query(query, [facilityId, startDate, endDate]);
        return parseInt(result.rows[0].count || result.rows[0][Object.keys(result.rows[0])[0]] || '0');
    }
    /**
     * Calculate exclusions
     */
    async calculateExclusions(measure, facilityId, startDate, endDate, denominator) {
        // Most measures have no exclusions
        // Implement specific exclusion logic as needed
        return 0;
    }
    /**
     * Determine performance status
     */
    getPerformanceStatus(performanceRate, benchmark, measureId) {
        // For measures where lower is better (e.g., readmission rate)
        const lowerIsBetter = ['SUDAN-005', 'SUDAN-007'].includes(measureId);
        if (lowerIsBetter) {
            if (performanceRate <= benchmark * 0.8)
                return 'exceeds';
            if (performanceRate <= benchmark)
                return 'meets';
            if (performanceRate <= benchmark * 1.2)
                return 'below';
            return 'critical';
        }
        else {
            if (performanceRate >= benchmark * 1.05)
                return 'exceeds';
            if (performanceRate >= benchmark)
                return 'meets';
            if (performanceRate >= benchmark * 0.9)
                return 'below';
            return 'critical';
        }
    }
    /**
     * Calculate trend
     */
    async calculateTrend(measureId, facilityId, currentPeriodStart) {
        // Get previous 3 periods
        const query = `
      SELECT performance_rate
      FROM quality_measure_results
      WHERE measure_id = $1
        AND facility_id = $2
        AND reporting_period_start < $3
      ORDER BY reporting_period_start DESC
      LIMIT 3
    `;
        const result = await this.pool.query(query, [measureId, facilityId, currentPeriodStart]);
        if (result.rows.length < 2) {
            return 'stable'; // Not enough data
        }
        const rates = result.rows.map(r => parseFloat(r.performance_rate));
        const avgChange = (rates[0] - rates[rates.length - 1]) / rates.length;
        if (avgChange > 0.02)
            return 'improving';
        if (avgChange < -0.02)
            return 'declining';
        return 'stable';
    }
    /**
     * Store measure result
     */
    async storeMeasureResult(result) {
        const query = `
      INSERT INTO quality_measure_results (
        id, measure_id, facility_id, reporting_period_start, reporting_period_end,
        denominator_count, numerator_count, exclusion_count,
        performance_rate, benchmark, status, variance, trend, calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
        await this.pool.query(query, [
            (0, uuid_1.v4)(),
            result.measureId,
            result.facilityId,
            result.reportingPeriod.start,
            result.reportingPeriod.end,
            result.denominatorCount,
            result.numeratorCount,
            result.exclusionCount,
            result.performanceRate,
            result.benchmark,
            result.status,
            result.variance,
            result.trend,
            result.calculatedAt
        ]);
    }
    /**
     * Generate quality dashboard for facility
     */
    async generateQualityDashboard(facilityId, startDate, endDate) {
        const measures = [];
        // Calculate all measures
        for (const measureDef of this.SUDAN_MOH_MEASURES) {
            try {
                const result = await this.calculateMeasurePerformance(measureDef.measureId, facilityId, startDate, endDate);
                measures.push(result);
            }
            catch (error) {
                console.error(`Error calculating measure ${measureDef.measureId}:`, error);
            }
        }
        // Calculate summary
        const summary = {
            totalMeasures: measures.length,
            exceeding: measures.filter(m => m.status === 'exceeds').length,
            meeting: measures.filter(m => m.status === 'meets').length,
            below: measures.filter(m => m.status === 'below').length,
            critical: measures.filter(m => m.status === 'critical').length
        };
        // Calculate overall score
        const overallScore = measures.reduce((sum, m) => {
            const score = m.status === 'exceeds' ? 100 :
                m.status === 'meets' ? 90 :
                    m.status === 'below' ? 70 : 50;
            return sum + score;
        }, 0) / measures.length;
        // Check Sudan MoH compliance
        const mohMeasures = measures.filter(m => this.SUDAN_MOH_MEASURES.find(def => def.measureId === m.measureId && def.sudanMoHRequired));
        const sudanMoHCompliance = mohMeasures.every(m => m.status === 'exceeds' || m.status === 'meets');
        return {
            facilityId,
            reportingPeriod: { start: startDate, end: endDate },
            overallScore,
            measures,
            summary,
            sudanMoHCompliance
        };
    }
    /**
     * Generate Sudan Ministry of Health report
     */
    async generateSudanMoHReport(facilityId, year, quarter) {
        const startDate = new Date(year, (quarter - 1) * 3, 1);
        const endDate = new Date(year, quarter * 3, 0);
        const dashboard = await this.generateQualityDashboard(facilityId, startDate, endDate);
        // Filter only MoH-required measures
        const mohMeasures = dashboard.measures.filter(m => this.SUDAN_MOH_MEASURES.find(def => def.measureId === m.measureId && def.sudanMoHRequired));
        return {
            reportId: (0, uuid_1.v4)(),
            facilityId,
            reportingPeriod: `Q${quarter} ${year}`,
            generatedAt: new Date(),
            complianceStatus: dashboard.sudanMoHCompliance ? 'compliant' : 'non_compliant',
            overallScore: dashboard.overallScore,
            measures: mohMeasures,
            summary: dashboard.summary,
            recommendations: this.generateRecommendations(mohMeasures)
        };
    }
    /**
     * Generate recommendations
     */
    generateRecommendations(measures) {
        const recommendations = [];
        measures.forEach(measure => {
            if (measure.status === 'below' || measure.status === 'critical') {
                const measureDef = this.SUDAN_MOH_MEASURES.find(m => m.measureId === measure.measureId);
                if (measureDef) {
                    recommendations.push(`Improve ${measureDef.measureName}: Current ${(measure.performanceRate * 100).toFixed(1)}%, Target ${(measureDef.benchmark * 100).toFixed(1)}%`);
                }
            }
        });
        return recommendations;
    }
}
exports.QualityMeasureService = QualityMeasureService;
exports.default = QualityMeasureService;
//# sourceMappingURL=QualityMeasureService.js.map