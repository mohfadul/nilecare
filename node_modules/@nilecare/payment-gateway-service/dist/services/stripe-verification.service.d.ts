/**
 * Stripe Payment Verification Service (PCI-DSS Compliant)
 *
 * SECURITY NOTES:
 * - NEVER handles raw card data on the server
 * - Requires frontend tokenization via Stripe.js/Elements
 * - Follows PCI-DSS SAQ-A compliance requirements
 * - Uses Payment Intents API for SCA compliance
 */
import Stripe from 'stripe';
import winston from 'winston';
export interface SecurePaymentVerificationData {
    paymentMethodId: string;
    amount: number;
    currency: string;
    description: string;
    userId: string;
    patientId: string;
    invoiceId: string;
    metadata?: Record<string, string>;
}
export interface PaymentVerificationResult {
    success: boolean;
    transactionId?: string;
    clientSecret?: string;
    error?: string;
    status: 'verified' | 'failed' | 'pending' | 'requires_action';
    nextAction?: {
        type: string;
        url?: string;
    };
}
export declare class StripeVerificationService {
    private stripe;
    private logger;
    constructor(logger: winston.Logger);
    /**
     * Verify payment using Payment Intent (PCI-DSS Compliant)
     *
     * SECURITY: This method NEVER receives raw card data.
     * Card tokenization must happen on the frontend using Stripe.js
     */
    verifyPayment(paymentData: SecurePaymentVerificationData): Promise<PaymentVerificationResult>;
    /**
     * Handle Payment Intent response based on status
     */
    private handlePaymentIntentResponse;
    /**
     * Validate payment data (server-side validation)
     * ✅ SECURITY: Only validates non-sensitive data
     */
    private validatePaymentData;
    /**
     * Convert amount to cents (Stripe requires smallest currency unit)
     */
    private convertToCents;
    /**
     * Sanitize error messages to prevent information leakage
     * ✅ SECURITY: Never expose Stripe internal errors to clients
     */
    private sanitizeErrorMessage;
    /**
     * Refund payment
     */
    refundPayment(paymentIntentId: string, amount?: number, reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'): Promise<Stripe.Refund>;
    /**
     * Retrieve payment details
     */
    getPaymentDetails(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
    /**
     * Create setup intent for saving payment method
     * (for subscription/recurring payments)
     */
    createSetupIntent(customerId: string): Promise<Stripe.SetupIntent>;
    /**
     * List payment methods for customer
     */
    listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]>;
}
export default StripeVerificationService;
//# sourceMappingURL=stripe-verification.service.d.ts.map