/**
 * Payment Service
 * Core business logic for payment processing
 */
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentEntity } from '../entities/payment.entity';
export interface PaymentStatistics {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    averageAmount: number;
    paymentsByProvider: Record<string, number>;
    paymentsByStatus: Record<string, number>;
}
export declare class PaymentService {
    private providers;
    private paymentRepository;
    constructor();
    /**
     * Initialize payment providers
     */
    private initializeProviders;
    /**
     * Get provider by name
     */
    private getProvider;
    /**
     * Initiate payment
     */
    initiatePayment(createPaymentDto: CreatePaymentDto, userId: string): Promise<any>;
    /**
     * Get payment by ID
     */
    getPaymentById(paymentId: string): Promise<PaymentEntity | null>;
    /**
     * List payments with filters
     */
    listPayments(filters: any, page?: number, limit?: number): Promise<any>;
    /**
     * Cancel payment
     */
    cancelPayment(paymentId: string, reason: string, _userId: string): Promise<any>;
    /**
     * Get payment statistics
     */
    getPaymentStatistics(filters: any): Promise<PaymentStatistics>;
    /**
     * Handle provider webhook
     */
    handleProviderWebhook(providerName: string, webhookData: any): Promise<void>;
    /**
     * Update invoice status based on payments
     */
    updateInvoiceStatus(invoiceId: string): Promise<void>;
    /**
     * Private helper methods
     */
    private validateInvoice;
    private generateMerchantReference;
    private calculateProviderFee;
    private mapStatusToPaymentStatus;
    private savePayment;
    private getPaymentByTransactionId;
    private performFraudDetection;
    private sendPaymentNotification;
    private publishPaymentEvent;
    /**
     * Convert DTO payment method details to entity format
     * Handles string to Date conversions
     */
    private convertPaymentMethodDetails;
}
export default PaymentService;
//# sourceMappingURL=payment.service.d.ts.map