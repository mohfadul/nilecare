/**
 * Base Payment Provider Service
 * Abstract base class for all payment provider implementations
 */
import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';
export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'awaiting_verification';
    paymentUrl?: string;
    qrCode?: string;
    message: string;
    requiresManualVerification?: boolean;
    providerResponse?: any;
}
export interface VerificationResult {
    success: boolean;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    message?: string;
}
export interface RefundResult {
    success: boolean;
    refundId?: string;
    status: 'pending' | 'completed' | 'failed';
    message: string;
}
export declare abstract class BasePaymentProvider {
    protected providerName: string;
    protected providerConfig: any;
    protected baseURL: string;
    protected apiKey: string;
    protected apiSecret?: string;
    constructor(providerName: string, providerConfig: any);
    /**
     * Process payment (must be implemented by each provider)
     */
    abstract processPayment(paymentData: CreatePaymentDto, payment: PaymentEntity): Promise<PaymentResult>;
    /**
     * Verify payment (must be implemented by each provider)
     */
    abstract verifyPayment(payment: PaymentEntity, verificationCode?: string): Promise<VerificationResult>;
    /**
     * Refund payment (optional, can be overridden)
     */
    refundPayment(_payment: PaymentEntity, _amount: number, _reason: string): Promise<RefundResult>;
    /**
     * Get payment status from provider (optional)
     */
    getPaymentStatus(_transactionId: string): Promise<any>;
    /**
     * Handle webhook (optional)
     */
    handleWebhook(_webhookData: any): Promise<void>;
    /**
     * Validate payment data before processing
     */
    protected validatePaymentData(paymentData: CreatePaymentDto): void;
    /**
     * Generate unique transaction ID
     */
    protected generateTransactionId(): string;
    /**
     * Log provider interaction
     */
    protected logProviderInteraction(action: string, data: any, result: any): void;
}
export default BasePaymentProvider;
//# sourceMappingURL=base-provider.service.d.ts.map