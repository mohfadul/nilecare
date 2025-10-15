/**
 * Bank of Khartoum Payment Provider Service
 * Handles payments through Bank of Khartoum
 */
import { BasePaymentProvider, PaymentResult, VerificationResult, RefundResult } from './base-provider.service';
import { CreatePaymentDto } from '../../dtos/create-payment.dto';
import { PaymentEntity } from '../../entities/payment.entity';
export declare class BankOfKhartoumService extends BasePaymentProvider {
    constructor(providerConfig: any);
    /**
     * Process payment through Bank of Khartoum
     * Currently supports manual verification with future API integration
     */
    processPayment(paymentData: CreatePaymentDto, _payment: PaymentEntity): Promise<PaymentResult>;
    /**
     * Verify payment manually by admin
     */
    verifyPayment(_payment: PaymentEntity, _verificationCode?: string): Promise<VerificationResult>;
    /**
     * Refund payment through Bank of Khartoum
     */
    refundPayment(_payment: PaymentEntity, _amount: number, _reason: string): Promise<RefundResult>;
    /**
     * Get payment status from Bank of Khartoum API
     */
    getPaymentStatus(_transactionId: string): Promise<any>;
}
export default BankOfKhartoumService;
//# sourceMappingURL=bank-of-khartoum.service.d.ts.map