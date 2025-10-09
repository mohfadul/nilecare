/**
 * Payment Audit Service
 * Comprehensive audit logging for all payment operations
 * Compliant with HIPAA and PCI DSS requirements
 */

import DatabaseConfig from '../config/database.config';
import { PaymentEntity } from '../entities/payment.entity';
import { generateRandomHex } from './crypto-helper';

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

export class PaymentAuditService {
  private db = DatabaseConfig;

  /**
   * Log payment action
   */
  async logPaymentAction(
    action: string,
    payment: PaymentEntity,
    userId: string,
    success: boolean = true,
    details?: any,
    errorMessage?: string
  ): Promise<void> {
    const auditLog: AuditLog = {
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
  async logPaymentInitiated(payment: PaymentEntity, userId: string): Promise<void> {
    await this.logPaymentAction(
      'PAYMENT_INITIATED',
      payment,
      userId,
      true,
      {
        merchantReference: payment.merchantReference,
        providerFee: payment.providerFee,
        totalFees: payment.totalFees
      }
    );
  }

  /**
   * Log payment verification
   */
  async logPaymentVerified(
    payment: PaymentEntity,
    verifiedBy: string,
    verificationMethod: string
  ): Promise<void> {
    await this.logPaymentAction(
      'PAYMENT_VERIFIED',
      payment,
      verifiedBy,
      true,
      {
        verificationMethod,
        verifiedAt: payment.verifiedAt
      }
    );
  }

  /**
   * Log payment confirmed
   */
  async logPaymentConfirmed(payment: PaymentEntity): Promise<void> {
    await this.logPaymentAction(
      'PAYMENT_CONFIRMED',
      payment,
      payment.createdBy,
      true,
      {
        confirmedAt: payment.confirmedAt,
        transactionId: payment.transactionId
      }
    );
  }

  /**
   * Log payment failed
   */
  async logPaymentFailed(
    payment: PaymentEntity,
    reason: string
  ): Promise<void> {
    await this.logPaymentAction(
      'PAYMENT_FAILED',
      payment,
      payment.createdBy,
      false,
      undefined,
      reason
    );
  }

  /**
   * Log payment cancelled
   */
  async logPaymentCancelled(
    payment: PaymentEntity,
    cancelledBy: string,
    reason: string
  ): Promise<void> {
    await this.logPaymentAction(
      'PAYMENT_CANCELLED',
      payment,
      cancelledBy,
      true,
      { reason }
    );
  }

  /**
   * Log refund request
   */
  async logRefundRequested(
    payment: PaymentEntity,
    refundAmount: number,
    requestedBy: string,
    reason: string
  ): Promise<void> {
    await this.logPaymentAction(
      'REFUND_REQUESTED',
      payment,
      requestedBy,
      true,
      {
        refundAmount,
        reason
      }
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    payment: PaymentEntity,
    riskScore: number,
    fraudFlags: string[]
  ): Promise<void> {
    await this.logPaymentAction(
      'SUSPICIOUS_ACTIVITY_DETECTED',
      payment,
      payment.createdBy,
      true,
      {
        riskScore,
        fraudFlags,
        requiresReview: riskScore >= 60
      }
    );
  }

  /**
   * Get audit trail for payment
   */
  async getPaymentAuditTrail(_paymentId: string): Promise<AuditLog[]> {
    // In production: Query from audit log table
    // Would use a separate audit database or PostgreSQL for immutability
    return [];
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(_userId: string, _limit: number = 100): Promise<AuditLog[]> {
    // In production: Query audit logs for user
    return [];
  }

  /**
   * Save audit log (immutable)
   */
  private async saveAuditLog(auditLog: AuditLog): Promise<void> {
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

    } catch (error: any) {
      // Audit logging should never break the application
      // But we should log the error
      console.error('Failed to save audit log:', error);
    }
  }

  /**
   * Generate audit log ID
   */
  private generateAuditId(): string {
    return `AUDIT-${Date.now()}-${generateRandomHex(8)}`;
  }
}

export default new PaymentAuditService();

