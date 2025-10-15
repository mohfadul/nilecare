/**
 * Payment Security Service
 * Handles payment security, encryption, and audit logging
 */
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentEntity } from '../entities/payment.entity';
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
export interface FraudAnalysis {
    riskScore: number;
    fraudFlags: string[];
    recommendation: 'approve' | 'review' | 'decline';
    details: string;
}
export declare class PaymentSecurityService {
    private readonly encryptionAlgorithm;
    private readonly encryptionKey;
    constructor();
    /**
     * Validate payment request
     */
    validatePaymentRequest(paymentData: CreatePaymentDto): Promise<ValidationResult>;
    /**
     * Perform fraud detection
     */
    performFraudDetection(payment: PaymentEntity): Promise<FraudAnalysis>;
    /**
     * Encrypt sensitive payment data
     */
    encryptSensitiveData(data: string): Promise<string>;
    /**
     * Decrypt sensitive payment data
     */
    decryptSensitiveData(encryptedData: string): Promise<string>;
    /**
     * Log payment audit trail
     */
    logPaymentAudit(action: string, paymentId: string, userId: string, details: any): Promise<void>;
    /**
     * Validate webhook signature
     */
    validateWebhookSignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Generate secure payment token
     */
    generatePaymentToken(paymentId: string, expiresInSeconds?: number): string;
    /**
     * Private helper methods
     */
    private checkDuplicatePayment;
    private validatePatientInvoiceRelationship;
    private validateInvoiceStatus;
    private isUnusualAmount;
    private hasHighVelocity;
    private isUnusualTime;
    private isFirstLargeTransaction;
    private hasNegativeHistory;
    private generateFraudDetails;
}
export default PaymentSecurityService;
//# sourceMappingURL=payment-security.service.d.ts.map