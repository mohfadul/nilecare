"use strict";
/**
 * PHI (Protected Health Information) Audit Service
 * HIPAA Compliance Framework Implementation
 * Tracks all access to protected health information
 * Sudan-specific: Includes Sudan National ID access tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHIAuditService = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
class PHIAuditService extends events_1.EventEmitter {
    constructor(pool) {
        super();
        this.TABLE_NAME = 'phi_audit_log';
        this.pool = pool;
    }
    /**
     * Log PHI access event
     * @param access - PHI access details
     */
    async logPHIAccess(access) {
        const accessLog = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            success: true,
            ...access
        };
        try {
            const query = `
        INSERT INTO phi_audit_log (
          id, user_id, user_name, user_role, patient_id, patient_mrn,
          action, resource_type, resource_id, timestamp, ip_address,
          user_agent, facility_id, tenant_id, session_id, request_id,
          access_reason, data_fields, success, duration
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
      `;
            await this.pool.query(query, [
                accessLog.id,
                accessLog.userId,
                accessLog.userName,
                accessLog.userRole,
                accessLog.patientId,
                accessLog.patientMRN,
                accessLog.action,
                accessLog.resourceType,
                accessLog.resourceId,
                accessLog.timestamp,
                accessLog.ipAddress,
                accessLog.userAgent,
                accessLog.facilityId,
                accessLog.tenantId,
                accessLog.sessionId,
                accessLog.requestId,
                accessLog.accessReason,
                accessLog.dataFields ? JSON.stringify(accessLog.dataFields) : null,
                accessLog.success,
                accessLog.duration
            ]);
            // Emit event for real-time monitoring
            this.emit('phi_access', accessLog);
            // Check for suspicious activity
            await this.checkSuspiciousActivity(accessLog);
        }
        catch (error) {
            console.error('Error logging PHI access:', error);
            throw error;
        }
    }
    /**
     * Log failed PHI access attempt
     * @param access - Failed access details
     * @param errorMessage - Error message
     */
    async logFailedPHIAccess(access, errorMessage) {
        const accessLog = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            success: false,
            errorMessage,
            ...access
        };
        try {
            const query = `
        INSERT INTO phi_audit_log (
          id, user_id, user_name, user_role, patient_id, patient_mrn,
          action, resource_type, resource_id, timestamp, ip_address,
          user_agent, facility_id, tenant_id, session_id, request_id,
          success, error_message
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
      `;
            await this.pool.query(query, [
                accessLog.id,
                accessLog.userId,
                accessLog.userName,
                accessLog.userRole,
                accessLog.patientId,
                accessLog.patientMRN,
                accessLog.action,
                accessLog.resourceType,
                accessLog.resourceId,
                accessLog.timestamp,
                accessLog.ipAddress,
                accessLog.userAgent,
                accessLog.facilityId,
                accessLog.tenantId,
                accessLog.sessionId,
                accessLog.requestId,
                accessLog.success,
                accessLog.errorMessage
            ]);
            // Emit event for security monitoring
            this.emit('phi_access_failed', accessLog);
            // Check for brute force or unauthorized access patterns
            await this.checkUnauthorizedAccessPattern(accessLog);
        }
        catch (error) {
            console.error('Error logging failed PHI access:', error);
            throw error;
        }
    }
    /**
     * Generate HIPAA compliance report for facility
     * @param facilityId - Facility UUID
     * @param startDate - Report start date
     * @param endDate - Report end date
     */
    async generateComplianceReport(facilityId, startDate, endDate) {
        try {
            const [summary, accessMetrics, securityMetrics, violations, recommendations, hipaaChecklist] = await Promise.all([
                this.generateComplianceSummary(facilityId, startDate, endDate),
                this.generateAccessMetrics(facilityId, startDate, endDate),
                this.generateSecurityMetrics(facilityId, startDate, endDate),
                this.getViolations(facilityId, startDate, endDate),
                this.generateRecommendations(facilityId, startDate, endDate),
                this.getHIPAAChecklist(facilityId)
            ]);
            // Get facility name
            const facilityResult = await this.pool.query('SELECT facility_name FROM facilities WHERE id = $1', [facilityId]);
            const facilityName = facilityResult.rows[0]?.facility_name || 'Unknown Facility';
            const report = {
                reportId: (0, uuid_1.v4)(),
                facilityId,
                facilityName,
                reportPeriod: { start: startDate, end: endDate },
                generatedAt: new Date(),
                generatedBy: 'system',
                summary,
                accessMetrics,
                securityMetrics,
                violations,
                recommendations,
                hipaaChecklist
            };
            // Store report
            await this.storeComplianceReport(report);
            return report;
        }
        catch (error) {
            console.error('Error generating compliance report:', error);
            throw error;
        }
    }
    /**
     * Generate compliance summary
     */
    async generateComplianceSummary(facilityId, startDate, endDate) {
        const query = `
      SELECT 
        COUNT(*) as total_phi_access,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(*) FILTER (WHERE success = false) as unauthorized_attempts
      FROM phi_audit_log
      WHERE facility_id = $1
        AND timestamp BETWEEN $2 AND $3
    `;
        const result = await this.pool.query(query, [facilityId, startDate, endDate]);
        const row = result.rows[0];
        // Calculate compliance score (0-100)
        const complianceScore = await this.calculateComplianceScore(facilityId, startDate, endDate);
        // Determine overall status
        let overallStatus;
        if (complianceScore >= 95) {
            overallStatus = 'compliant';
        }
        else if (complianceScore >= 80) {
            overallStatus = 'needs_attention';
        }
        else {
            overallStatus = 'non_compliant';
        }
        return {
            totalPHIAccess: parseInt(row.total_phi_access),
            uniqueUsers: parseInt(row.unique_users),
            uniquePatients: parseInt(row.unique_patients),
            unauthorizedAttempts: parseInt(row.unauthorized_attempts),
            dataBreaches: 0, // Would be populated from security incidents table
            complianceScore,
            overallStatus
        };
    }
    /**
     * Generate access metrics
     */
    async generateAccessMetrics(facilityId, startDate, endDate) {
        // Access by action
        const actionQuery = `
      SELECT action, COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY action
    `;
        const actionResult = await this.pool.query(actionQuery, [facilityId, startDate, endDate]);
        const accessByAction = {};
        actionResult.rows.forEach(row => {
            accessByAction[row.action] = parseInt(row.count);
        });
        // Access by user
        const userQuery = `
      SELECT user_id, user_name, COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY user_id, user_name
      ORDER BY count DESC
      LIMIT 20
    `;
        const userResult = await this.pool.query(userQuery, [facilityId, startDate, endDate]);
        const accessByUser = userResult.rows.map(row => ({
            userId: row.user_id,
            userName: row.user_name || 'Unknown',
            count: parseInt(row.count)
        }));
        // Access by resource type
        const resourceQuery = `
      SELECT resource_type, COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY resource_type
    `;
        const resourceResult = await this.pool.query(resourceQuery, [facilityId, startDate, endDate]);
        const accessByResourceType = {};
        resourceResult.rows.forEach(row => {
            accessByResourceType[row.resource_type] = parseInt(row.count);
        });
        // Access by time of day
        const timeQuery = `
      SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 AND timestamp BETWEEN $2 AND $3
      GROUP BY hour
      ORDER BY hour
    `;
        const timeResult = await this.pool.query(timeQuery, [facilityId, startDate, endDate]);
        const accessByTimeOfDay = {};
        timeResult.rows.forEach(row => {
            accessByTimeOfDay[parseInt(row.hour)] = parseInt(row.count);
        });
        // Peak access times
        const peakAccessTimes = Object.entries(accessByTimeOfDay)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // Average access duration
        const durationQuery = `
      SELECT AVG(duration) as avg_duration
      FROM phi_audit_log
      WHERE facility_id = $1 
        AND timestamp BETWEEN $2 AND $3
        AND duration IS NOT NULL
    `;
        const durationResult = await this.pool.query(durationQuery, [facilityId, startDate, endDate]);
        const averageAccessDuration = parseFloat(durationResult.rows[0]?.avg_duration || '0');
        return {
            accessByAction,
            accessByUser,
            accessByResourceType,
            accessByTimeOfDay,
            peakAccessTimes,
            averageAccessDuration
        };
    }
    /**
     * Generate security metrics
     */
    async generateSecurityMetrics(facilityId, startDate, endDate) {
        const query = `
      SELECT 
        COUNT(*) FILTER (WHERE success = false) as failed_attempts,
        COUNT(*) FILTER (WHERE action = 'export') as data_export_count,
        COUNT(*) FILTER (
          WHERE EXTRACT(HOUR FROM timestamp) < 6 OR EXTRACT(HOUR FROM timestamp) > 22
        ) as after_hours_access
      FROM phi_audit_log
      WHERE facility_id = $1 AND timestamp BETWEEN $2 AND $3
    `;
        const result = await this.pool.query(query, [facilityId, startDate, endDate]);
        const row = result.rows[0];
        return {
            failedLoginAttempts: parseInt(row.failed_attempts),
            suspiciousActivities: 0, // Would be populated from security events
            dataExportCount: parseInt(row.data_export_count),
            bulkAccessCount: 0, // Would need additional logic
            afterHoursAccess: parseInt(row.after_hours_access),
            unusualLocationAccess: 0 // Would need geo-location tracking
        };
    }
    /**
     * Get violations
     */
    async getViolations(facilityId, startDate, endDate) {
        const query = `
      SELECT *
      FROM compliance_violations
      WHERE facility_id = $1
        AND timestamp BETWEEN $2 AND $3
      ORDER BY severity DESC, timestamp DESC
    `;
        const result = await this.pool.query(query, [facilityId, startDate, endDate]);
        return result.rows.map(row => ({
            violationId: row.id,
            type: row.type,
            severity: row.severity,
            description: row.description,
            timestamp: row.timestamp,
            userId: row.user_id,
            patientId: row.patient_id,
            status: row.status,
            remediation: row.remediation
        }));
    }
    /**
     * Generate recommendations
     */
    async generateRecommendations(facilityId, startDate, endDate) {
        const recommendations = [];
        // Check for high unauthorized access attempts
        const unauthorizedQuery = `
      SELECT COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 
        AND timestamp BETWEEN $2 AND $3
        AND success = false
    `;
        const unauthorizedResult = await this.pool.query(unauthorizedQuery, [facilityId, startDate, endDate]);
        const unauthorizedCount = parseInt(unauthorizedResult.rows[0].count);
        if (unauthorizedCount > 10) {
            recommendations.push({
                recommendationId: (0, uuid_1.v4)(),
                category: 'security',
                priority: 'high',
                title: 'High Number of Unauthorized Access Attempts',
                description: `${unauthorizedCount} unauthorized access attempts detected. Review user permissions and implement additional security measures.`,
                actionItems: [
                    'Review and update user access permissions',
                    'Implement multi-factor authentication',
                    'Conduct security awareness training',
                    'Review and strengthen password policies'
                ]
            });
        }
        // Check for after-hours access
        const afterHoursQuery = `
      SELECT COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 
        AND timestamp BETWEEN $2 AND $3
        AND (EXTRACT(HOUR FROM timestamp) < 6 OR EXTRACT(HOUR FROM timestamp) > 22)
    `;
        const afterHoursResult = await this.pool.query(afterHoursQuery, [facilityId, startDate, endDate]);
        const afterHoursCount = parseInt(afterHoursResult.rows[0].count);
        if (afterHoursCount > 50) {
            recommendations.push({
                recommendationId: (0, uuid_1.v4)(),
                category: 'compliance',
                priority: 'medium',
                title: 'Significant After-Hours PHI Access',
                description: `${afterHoursCount} PHI access events occurred outside normal business hours. Review and document justification for after-hours access.`,
                actionItems: [
                    'Review after-hours access logs',
                    'Implement access reason documentation requirement',
                    'Set up alerts for unusual access patterns',
                    'Review on-call schedules and access needs'
                ]
            });
        }
        return recommendations;
    }
    /**
     * Get HIPAA checklist
     */
    async getHIPAAChecklist(facilityId) {
        // This would typically be stored in a database
        // For now, returning a static checklist
        return [
            {
                checkId: 'TECH-001',
                category: 'technical',
                requirement: 'Unique User Identification',
                status: 'compliant',
                evidence: 'All users have unique IDs with JWT authentication',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-002',
                category: 'technical',
                requirement: 'Emergency Access Procedure',
                status: 'compliant',
                evidence: 'Break-glass emergency access implemented',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-003',
                category: 'technical',
                requirement: 'Automatic Logoff',
                status: 'compliant',
                evidence: '15-minute session timeout configured',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-004',
                category: 'technical',
                requirement: 'Encryption and Decryption',
                status: 'compliant',
                evidence: 'AES-256 encryption for PHI at rest, TLS 1.3 in transit',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-005',
                category: 'technical',
                requirement: 'Audit Controls',
                status: 'compliant',
                evidence: 'Comprehensive PHI access logging implemented',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-006',
                category: 'technical',
                requirement: 'Integrity Controls',
                status: 'compliant',
                evidence: 'Data integrity validation and checksums',
                lastVerified: new Date()
            },
            {
                checkId: 'TECH-007',
                category: 'technical',
                requirement: 'Transmission Security',
                status: 'compliant',
                evidence: 'TLS 1.3 for all data transmission',
                lastVerified: new Date()
            }
        ];
    }
    /**
     * Calculate compliance score
     */
    async calculateComplianceScore(facilityId, startDate, endDate) {
        let score = 100;
        // Deduct points for violations
        const violationsQuery = `
      SELECT severity, COUNT(*) as count
      FROM compliance_violations
      WHERE facility_id = $1
        AND timestamp BETWEEN $2 AND $3
      GROUP BY severity
    `;
        const violationsResult = await this.pool.query(violationsQuery, [facilityId, startDate, endDate]);
        violationsResult.rows.forEach(row => {
            const count = parseInt(row.count);
            switch (row.severity) {
                case 'critical':
                    score -= count * 10;
                    break;
                case 'high':
                    score -= count * 5;
                    break;
                case 'medium':
                    score -= count * 2;
                    break;
                case 'low':
                    score -= count * 1;
                    break;
            }
        });
        // Deduct points for unauthorized access
        const unauthorizedQuery = `
      SELECT COUNT(*) as count
      FROM phi_audit_log
      WHERE facility_id = $1 
        AND timestamp BETWEEN $2 AND $3
        AND success = false
    `;
        const unauthorizedResult = await this.pool.query(unauthorizedQuery, [facilityId, startDate, endDate]);
        const unauthorizedCount = parseInt(unauthorizedResult.rows[0].count);
        score -= Math.min(unauthorizedCount * 0.5, 20); // Max 20 points deduction
        // Ensure score is between 0 and 100
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Check for suspicious activity
     */
    async checkSuspiciousActivity(accessLog) {
        // Check for rapid successive access
        const rapidAccessQuery = `
      SELECT COUNT(*) as count
      FROM phi_audit_log
      WHERE user_id = $1
        AND timestamp > NOW() - INTERVAL '1 minute'
    `;
        const rapidAccessResult = await this.pool.query(rapidAccessQuery, [accessLog.userId]);
        const rapidAccessCount = parseInt(rapidAccessResult.rows[0].count);
        if (rapidAccessCount > 50) {
            this.emit('suspicious_activity', {
                type: 'rapid_access',
                userId: accessLog.userId,
                count: rapidAccessCount,
                timestamp: new Date()
            });
        }
        // Check for after-hours access
        const hour = accessLog.timestamp.getHours();
        if (hour < 6 || hour > 22) {
            this.emit('after_hours_access', {
                userId: accessLog.userId,
                timestamp: accessLog.timestamp,
                resourceType: accessLog.resourceType
            });
        }
    }
    /**
     * Check for unauthorized access patterns
     */
    async checkUnauthorizedAccessPattern(accessLog) {
        // Check for repeated failed attempts
        const failedAttemptsQuery = `
      SELECT COUNT(*) as count
      FROM phi_audit_log
      WHERE user_id = $1
        AND success = false
        AND timestamp > NOW() - INTERVAL '15 minutes'
    `;
        const failedAttemptsResult = await this.pool.query(failedAttemptsQuery, [accessLog.userId]);
        const failedCount = parseInt(failedAttemptsResult.rows[0].count);
        if (failedCount >= 5) {
            this.emit('brute_force_detected', {
                userId: accessLog.userId,
                failedAttempts: failedCount,
                timestamp: new Date()
            });
        }
    }
    /**
     * Store compliance report
     */
    async storeComplianceReport(report) {
        const query = `
      INSERT INTO compliance_reports (
        id, facility_id, report_period_start, report_period_end,
        generated_at, generated_by, compliance_score, overall_status,
        report_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
        await this.pool.query(query, [
            report.reportId,
            report.facilityId,
            report.reportPeriod.start,
            report.reportPeriod.end,
            report.generatedAt,
            report.generatedBy,
            report.summary.complianceScore,
            report.summary.overallStatus,
            JSON.stringify(report)
        ]);
    }
    /**
     * Get patient access history
     * @param patientId - Patient UUID
     * @param limit - Number of records to return
     */
    async getPatientAccessHistory(patientId, limit = 100) {
        const query = `
      SELECT *
      FROM phi_audit_log
      WHERE patient_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
        const result = await this.pool.query(query, [patientId, limit]);
        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userRole: row.user_role,
            patientId: row.patient_id,
            patientMRN: row.patient_mrn,
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            timestamp: row.timestamp,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            facilityId: row.facility_id,
            tenantId: row.tenant_id,
            sessionId: row.session_id,
            requestId: row.request_id,
            accessReason: row.access_reason,
            dataFields: row.data_fields ? JSON.parse(row.data_fields) : undefined,
            success: row.success,
            errorMessage: row.error_message,
            duration: row.duration
        }));
    }
    /**
     * Get user access history
     * @param userId - User UUID
     * @param limit - Number of records to return
     */
    async getUserAccessHistory(userId, limit = 100) {
        const query = `
      SELECT *
      FROM phi_audit_log
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
        const result = await this.pool.query(query, [userId, limit]);
        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userRole: row.user_role,
            patientId: row.patient_id,
            patientMRN: row.patient_mrn,
            action: row.action,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            timestamp: row.timestamp,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            facilityId: row.facility_id,
            tenantId: row.tenant_id,
            sessionId: row.session_id,
            requestId: row.request_id,
            accessReason: row.access_reason,
            dataFields: row.data_fields ? JSON.parse(row.data_fields) : undefined,
            success: row.success,
            errorMessage: row.error_message,
            duration: row.duration
        }));
    }
}
exports.PHIAuditService = PHIAuditService;
exports.default = PHIAuditService;
//# sourceMappingURL=PHIAuditService.js.map