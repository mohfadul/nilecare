/**
 * PHI (Protected Health Information) Audit Service
 * HIPAA Compliance Framework Implementation
 * Tracks all access to protected health information
 * Sudan-specific: Includes Sudan National ID access tracking
 */
import { Pool } from 'pg';
import { EventEmitter } from 'events';
export interface PHIAccessLog {
    id: string;
    userId: string;
    userName?: string;
    userRole?: string;
    patientId: string;
    patientMRN?: string;
    action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
    resourceType: string;
    resourceId: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    facilityId: string;
    tenantId: string;
    sessionId?: string;
    requestId?: string;
    accessReason?: string;
    dataFields?: string[];
    success: boolean;
    errorMessage?: string;
    duration?: number;
}
export interface ComplianceReport {
    reportId: string;
    facilityId: string;
    facilityName: string;
    reportPeriod: {
        start: Date;
        end: Date;
    };
    generatedAt: Date;
    generatedBy: string;
    summary: ComplianceSummary;
    accessMetrics: AccessMetrics;
    securityMetrics: SecurityMetrics;
    violations: Violation[];
    recommendations: Recommendation[];
    hipaaChecklist: HIPAAChecklistItem[];
}
export interface ComplianceSummary {
    totalPHIAccess: number;
    uniqueUsers: number;
    uniquePatients: number;
    unauthorizedAttempts: number;
    dataBreaches: number;
    complianceScore: number;
    overallStatus: 'compliant' | 'non_compliant' | 'needs_attention';
}
export interface AccessMetrics {
    accessByAction: Record<string, number>;
    accessByUser: Array<{
        userId: string;
        userName: string;
        count: number;
    }>;
    accessByResourceType: Record<string, number>;
    accessByTimeOfDay: Record<number, number>;
    peakAccessTimes: Array<{
        hour: number;
        count: number;
    }>;
    averageAccessDuration: number;
}
export interface SecurityMetrics {
    failedLoginAttempts: number;
    suspiciousActivities: number;
    dataExportCount: number;
    bulkAccessCount: number;
    afterHoursAccess: number;
    unusualLocationAccess: number;
}
export interface Violation {
    violationId: string;
    type: 'unauthorized_access' | 'data_breach' | 'policy_violation' | 'security_incident';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: Date;
    userId?: string;
    patientId?: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    remediation?: string;
}
export interface Recommendation {
    recommendationId: string;
    category: 'security' | 'compliance' | 'training' | 'policy';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    actionItems: string[];
}
export interface HIPAAChecklistItem {
    checkId: string;
    category: 'administrative' | 'physical' | 'technical';
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    evidence?: string;
    lastVerified?: Date;
}
export declare class PHIAuditService extends EventEmitter {
    private pool;
    private readonly TABLE_NAME;
    constructor(pool: Pool);
    /**
     * Log PHI access event
     * @param access - PHI access details
     */
    logPHIAccess(access: Omit<PHIAccessLog, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Log failed PHI access attempt
     * @param access - Failed access details
     * @param errorMessage - Error message
     */
    logFailedPHIAccess(access: Omit<PHIAccessLog, 'id' | 'timestamp' | 'success'>, errorMessage: string): Promise<void>;
    /**
     * Generate HIPAA compliance report for facility
     * @param facilityId - Facility UUID
     * @param startDate - Report start date
     * @param endDate - Report end date
     */
    generateComplianceReport(facilityId: string, startDate: Date, endDate: Date): Promise<ComplianceReport>;
    /**
     * Generate compliance summary
     */
    private generateComplianceSummary;
    /**
     * Generate access metrics
     */
    private generateAccessMetrics;
    /**
     * Generate security metrics
     */
    private generateSecurityMetrics;
    /**
     * Get violations
     */
    private getViolations;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get HIPAA checklist
     */
    private getHIPAAChecklist;
    /**
     * Calculate compliance score
     */
    private calculateComplianceScore;
    /**
     * Check for suspicious activity
     */
    private checkSuspiciousActivity;
    /**
     * Check for unauthorized access patterns
     */
    private checkUnauthorizedAccessPattern;
    /**
     * Store compliance report
     */
    private storeComplianceReport;
    /**
     * Get patient access history
     * @param patientId - Patient UUID
     * @param limit - Number of records to return
     */
    getPatientAccessHistory(patientId: string, limit?: number): Promise<PHIAccessLog[]>;
    /**
     * Get user access history
     * @param userId - User UUID
     * @param limit - Number of records to return
     */
    getUserAccessHistory(userId: string, limit?: number): Promise<PHIAccessLog[]>;
}
export default PHIAuditService;
//# sourceMappingURL=PHIAuditService.d.ts.map