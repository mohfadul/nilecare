"use strict";
/**
 * Payment Audit Service
 * Comprehensive audit logging for all payment operations
 * Compliant with HIPAA and PCI DSS requirements
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAuditService = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
const crypto_helper_1 = require("./crypto-helper");
class PaymentAuditService {
    constructor() {
        this.db = database_config_1.default;
    }
    /**
     * Log payment action
     */
    async logPaymentAction(action, payment, userId, success = true, details, errorMessage) {
        const auditLog = {
            id: this.generateAuditId(),
            action,
            resourceType: 'payment',
            resourceId: payment.id,
            userId,
            userRole: undefined, // Would be fetched from user context
            facilityId: payment.facilityId,
            details: JSON.stringify({
                paymentId: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                provider: payment.providerId,
                ...details
            }),
            ipAddress: payment.ipAddress,
            userAgent: payment.userAgent,
            timestamp: new Date(),
            success,
            errorMessage
        };
        await this.saveAuditLog(auditLog);
    }
    /**
     * Log payment initiation
     */
    async logPaymentInitiated(payment, userId) {
        await this.logPaymentAction('PAYMENT_INITIATED', payment, userId, true, {
            merchantReference: payment.merchantReference,
            providerFee: payment.providerFee,
            totalFees: payment.totalFees
        });
    }
    /**
     * Log payment verification
     */
    async logPaymentVerified(payment, verifiedBy, verificationMethod) {
        await this.logPaymentAction('PAYMENT_VERIFIED', payment, verifiedBy, true, {
            verificationMethod,
            verifiedAt: payment.verifiedAt
        });
    }
    /**
     * Log payment confirmed
     */
    async logPaymentConfirmed(payment) {
        await this.logPaymentAction('PAYMENT_CONFIRMED', payment, payment.createdBy, true, {
            confirmedAt: payment.confirmedAt,
            transactionId: payment.transactionId
        });
    }
    /**
     * Log payment failed
     */
    async logPaymentFailed(payment, reason) {
        await this.logPaymentAction('PAYMENT_FAILED', payment, payment.createdBy, false, undefined, reason);
    }
    /**
     * Log payment cancelled
     */
    async logPaymentCancelled(payment, cancelledBy, reason) {
        await this.logPaymentAction('PAYMENT_CANCELLED', payment, cancelledBy, true, { reason });
    }
    /**
     * Log refund request
     */
    async logRefundRequested(payment, refundAmount, requestedBy, reason) {
        await this.logPaymentAction('REFUND_REQUESTED', payment, requestedBy, true, {
            refundAmount,
            reason
        });
    }
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(payment, riskScore, fraudFlags) {
        await this.logPaymentAction('SUSPICIOUS_ACTIVITY_DETECTED', payment, payment.createdBy, true, {
            riskScore,
            fraudFlags,
            requiresReview: riskScore >= 60
        });
    }
    /**
     * Get audit trail for payment
     */
    async getPaymentAuditTrail(_paymentId) {
        // In production: Query from audit log table
        // Would use a separate audit database or PostgreSQL for immutability
        return [];
    }
    /**
     * Get audit logs for user
     */
    async getUserAuditLogs(_userId, _limit = 100) {
        // In production: Query audit logs for user
        return [];
    }
    /**
     * Save audit log (immutable)
     */
    async saveAuditLog(auditLog) {
        try {
            // In production: Insert into audit log table
            // NEVER update or delete audit logs (immutable for compliance)
            const sql = `
        INSERT INTO payment_audit_log (
          id, action, resource_type, resource_id,
          user_id, user_role, facility_id,
          details, ip_address, user_agent,
          timestamp, success, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            await this.db.query(sql, [
                auditLog.id,
                auditLog.action,
                auditLog.resourceType,
                auditLog.resourceId,
                auditLog.userId,
                auditLog.userRole || null,
                auditLog.facilityId || null,
                auditLog.details,
                auditLog.ipAddress || null,
                auditLog.userAgent || null,
                auditLog.timestamp,
                auditLog.success,
                auditLog.errorMessage || null
            ]);
            console.log(`[AUDIT] ${auditLog.action} - ${auditLog.resourceId}`);
        }
        catch (error) {
            // Audit logging should never break the application
            // But we should log the error
            console.error('Failed to save audit log:', error);
        }
    }
    /**
     * Generate audit log ID
     */
    generateAuditId() {
        return `AUDIT-${Date.now()}-${(0, crypto_helper_1.generateRandomHex)(8)}`;
    }
}
exports.PaymentAuditService = PaymentAuditService;
exports.default = new PaymentAuditService();
//# sourceMappingURL=payment-audit.service.js.map