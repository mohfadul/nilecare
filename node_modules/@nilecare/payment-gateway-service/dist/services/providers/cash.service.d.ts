/**
 * Cash Payment Provider Service
 * Handles cash payments with manual verification
 */
import { BasePaymentProvider, PaymentResult, VerificationResult, RefundResult } from './base-provider.service';
import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';
export declare class CashService extends BasePaymentProvider {
    constructor(providerConfig: any);
    /**
     * Process cash payment
     * Generates receipt and marks for manual verification
     */
    processPayment(paymentData: CreatePaymentDto, _payment: PaymentEntity): Promise<PaymentResult>;
    /**
     * Verify cash payment manually
     */
    verifyPayment(payment: PaymentEntity, _verificationCode?: string): Promise<VerificationResult>;
    /**
     * Refund cash payment
     * Creates refund request for manual processing
     */
    refundPayment(_payment: PaymentEntity, _amount: number, _reason: string): Promise<RefundResult>;
    /**
     * Generate unique receipt number
     */
    private generateReceiptNumber;
    /**
     * Calculate total from denomination breakdown
     */
    private calculateDenominationTotal;
    /**
     * Validate denomination breakdown
     */
    validateDenominationBreakdown(breakdown: Record<string, number>, expectedAmount: number): {
        valid: boolean;
        total: number;
        difference: number;
    };
    /**
     * Generate cash receipt data for printing
     */
    generateReceiptData(payment: PaymentEntity): any;
}
export default CashService;
//# sourceMappingURL=cash.service.d.ts.map