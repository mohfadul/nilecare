/**
 * HIPAA Compliance Engine
 * Automated compliance checking and reporting
 * Sudan-specific: Includes Sudan healthcare regulations
 */
import { Pool } from 'pg';
export interface HIPAARequirement {
    requirementId: string;
    category: 'administrative' | 'physical' | 'technical';
    section: string;
    title: string;
    description: string;
    required: boolean;
    checkFunction: string;
}
export interface ComplianceCheckResult {
    requirementId: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    score: number;
    evidence: string[];
    issues: string[];
    lastChecked: Date;
}
export declare class ComplianceEngine {
    private pool;
    private readonly HIPAA_REQUIREMENTS;
    constructor(pool: Pool);
    /**
     * Run all compliance checks for a facility
     */
    runComplianceChecks(facilityId: string): Promise<ComplianceCheckResult[]>;
    /**
     * Generate comprehensive compliance report
     */
    generateReport(facilityId: string, startDate?: Date, endDate?: Date): Promise<any>;
    private checkUniqueUserIdentification;
    private checkEmergencyAccessProcedure;
    private checkAutomaticLogoff;
    private checkEncryption;
    private checkAuditControls;
    private checkIntegrityControls;
    private checkAuthentication;
    private checkTransmissionIntegrity;
    private checkTransmissionEncryption;
    private getAccessSummary;
    private getViolations;
    private getSecurityEvents;
    private calculateOverallScore;
    private determineOverallStatus;
    private generateRecommendations;
    /**
     * Schedule automated compliance checks
     */
    scheduleAutomatedChecks(): void;
    private sendComplianceAlert;
    private storeComplianceReport;
    private distributeComplianceReport;
}
export default ComplianceEngine;
//# sourceMappingURL=ComplianceEngine.d.ts.map