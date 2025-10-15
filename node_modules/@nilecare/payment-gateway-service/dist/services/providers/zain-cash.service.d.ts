/**
 * Zain Cash Payment Provider Service
 * Handles mobile wallet payments through Zain Cash (Zain Bede)
 */
import { BasePaymentProvider, PaymentResult, VerificationResult, RefundResult } from './base-provider.service';
import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';
export declare class ZainCashService extends BasePaymentProvider {
    private readonly merchantId;
    private readonly callbackUrl;
    constructor(providerConfig: any);
    /**
     * Process payment through Zain Cash
     * Initiates mobile wallet payment and returns payment URL
     */
    processPayment(paymentData: CreatePaymentDto, payment: PaymentEntity): Promise<PaymentResult>;
    /**
     * Verify payment status with Zain Cash
     */
    verifyPayment(payment: PaymentEntity, _verificationCode?: string): Promise<VerificationResult>;
    /**
     * Handle Zain Cash webhook
     */
    handleWebhook(webhookData: any): Promise<any>;
    /**
     * Refund payment through Zain Cash
     */
    refundPayment(payment: PaymentEntity, amount: number, reason: string): Promise<RefundResult>;
    /**
     * Get payment status from Zain Cash
     */
    getPaymentStatus(transactionId: string): Promise<any>;
    /**
     * Validate webhook signature
     */
    private validateWebhookSignature;
    /**
     * Map Zain Cash status to our internal status
     */
    private mapZainCashStatus;
}
export default ZainCashService;
//# sourceMappingURL=zain-cash.service.d.ts.map