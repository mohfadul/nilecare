/**
 * Payment Audit Service
 * Comprehensive audit logging for all payment operations
 * Compliant with HIPAA and PCI DSS requirements
 */
import { PaymentEntity } from '../entities/payment.entity';
export interface AuditLog {
    id: string;
    action: string;
    resourceType: 'payment' | 'refund' | 'reconciliation';
    resourceId: string;
    userId: string;
    userRole?: string;
    facilityId?: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
}
export declare class PaymentAuditService {
    private db;
    /**
     * Log payment action
     */
    logPaymentAction(action: string, payment: PaymentEntity, userId: string, success?: boolean, details?: any, errorMessage?: string): Promise<void>;
    /**
     * Log payment initiation
     */
    logPaymentInitiated(payment: PaymentEntity, userId: string): Promise<void>;
    /**
     * Log payment verification
     */
    logPaymentVerified(payment: PaymentEntity, verifiedBy: string, verificationMethod: string): Promise<void>;
    /**
     * Log payment confirmed
     */
    logPaymentConfirmed(payment: PaymentEntity): Promise<void>;
    /**
     * Log payment failed
     */
    logPaymentFailed(payment: PaymentEntity, reason: string): Promise<void>;
    /**
     * Log payment cancelled
     */
    logPaymentCancelled(payment: PaymentEntity, cancelledBy: string, reason: string): Promise<void>;
    /**
     * Log refund request
     */
    logRefundRequested(payment: PaymentEntity, refundAmount: number, requestedBy: string, reason: string): Promise<void>;
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(payment: PaymentEntity, riskScore: number, fraudFlags: string[]): Promise<void>;
    /**
     * Get audit trail for payment
     */
    getPaymentAuditTrail(_paymentId: string): Promise<AuditLog[]>;
    /**
     * Get audit logs for user
     */
    getUserAuditLogs(_userId: string, _limit?: number): Promise<AuditLog[]>;
    /**
     * Save audit log (immutable)
     */
    private saveAuditLog;
    /**
     * Generate audit log ID
     */
    private generateAuditId;
}
declare const _default: PaymentAuditService;
export default _default;
//# sourceMappingURL=payment-audit.service.d.ts.map