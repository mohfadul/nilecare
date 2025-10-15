"use strict";
/**
 * Stripe Payment Verification Service (PCI-DSS Compliant)
 *
 * SECURITY NOTES:
 * - NEVER handles raw card data on the server
 * - Requires frontend tokenization via Stripe.js/Elements
 * - Follows PCI-DSS SAQ-A compliance requirements
 * - Uses Payment Intents API for SCA compliance
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeVerificationService = void 0;
const stripe_1 = __importDefault(require("stripe"));
class StripeVerificationService {
    constructor(logger) {
        this.logger = logger;
        // Validate Stripe key on initialization
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        this.stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2023-10-16',
            typescript: true,
        });
        this.logger.info('Stripe Verification Service initialized');
    }
    /**
     * Verify payment using Payment Intent (PCI-DSS Compliant)
     *
     * SECURITY: This method NEVER receives raw card data.
     * Card tokenization must happen on the frontend using Stripe.js
     */
    async verifyPayment(paymentData) {
        try {
            // Validate input
            this.validatePaymentData(paymentData);
            // Create Payment Intent with payment method from frontend
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: this.convertToCents(paymentData.amount),
                currency: paymentData.currency.toLowerCase(),
                payment_method: paymentData.paymentMethodId, // ✅ Token from frontend
                description: paymentData.description,
                metadata: {
                    userId: paymentData.userId,
                    patientId: paymentData.patientId,
                    invoiceId: paymentData.invoiceId,
                    ...paymentData.metadata,
                },
                confirm: true, // Automatically confirm
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never', // For SCA compliance
                },
                statement_descriptor: 'NILECARE',
                statement_descriptor_suffix: 'HEALTHCARE',
            });
            return this.handlePaymentIntentResponse(paymentIntent, paymentData);
        }
        catch (error) {
            this.logger.error('Payment verification error', {
                error: error.message,
                type: error.type,
                code: error.code,
                userId: paymentData.userId,
                // ✅ SECURITY: Never log full error stack in production
                ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
            });
            return {
                success: false,
                error: this.sanitizeErrorMessage(error),
                status: 'failed',
            };
        }
    }
    /**
     * Handle Payment Intent response based on status
     */
    handlePaymentIntentResponse(paymentIntent, paymentData) {
        switch (paymentIntent.status) {
            case 'succeeded':
                this.logger.info('Payment verified successfully', {
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    userId: paymentData.userId,
                    patientId: paymentData.patientId,
                });
                return {
                    success: true,
                    transactionId: paymentIntent.id,
                    status: 'verified',
                };
            case 'requires_action':
                // 3D Secure authentication required
                this.logger.info('Payment requires additional authentication', {
                    paymentIntentId: paymentIntent.id,
                    userId: paymentData.userId,
                });
                return {
                    success: false,
                    transactionId: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret || undefined,
                    status: 'requires_action',
                    nextAction: paymentIntent.next_action
                        ? {
                            type: paymentIntent.next_action.type,
                            url: paymentIntent.next_action.redirect_to_url?.url,
                        }
                        : undefined,
                };
            case 'requires_payment_method':
            case 'requires_confirmation':
                this.logger.warn('Payment requires additional information', {
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                    userId: paymentData.userId,
                });
                return {
                    success: false,
                    error: 'Payment method declined. Please try another payment method.',
                    status: 'failed',
                };
            case 'processing':
                return {
                    success: false,
                    transactionId: paymentIntent.id,
                    status: 'pending',
                };
            case 'canceled':
                return {
                    success: false,
                    error: 'Payment was canceled',
                    status: 'failed',
                };
            default:
                this.logger.warn('Unexpected payment intent status', {
                    paymentIntentId: paymentIntent.id,
                    status: paymentIntent.status,
                });
                return {
                    success: false,
                    error: paymentIntent.last_payment_error?.message || 'Payment failed',
                    status: 'failed',
                };
        }
    }
    /**
     * Validate payment data (server-side validation)
     * ✅ SECURITY: Only validates non-sensitive data
     */
    validatePaymentData(paymentData) {
        // Validate required fields
        if (!paymentData.paymentMethodId) {
            throw new Error('Payment method ID is required');
        }
        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        if (!paymentData.currency) {
            throw new Error('Currency is required');
        }
        // Validate currency format (ISO 4217)
        if (!/^[A-Z]{3}$/.test(paymentData.currency.toUpperCase())) {
            throw new Error('Invalid currency code');
        }
        // Validate amount limits (Sudan regulations)
        const maxAmount = 1000000; // 1 million SDG
        const minAmount = 1; // 1 SDG
        if (paymentData.amount < minAmount) {
            throw new Error(`Amount must be at least ${minAmount} ${paymentData.currency}`);
        }
        if (paymentData.amount > maxAmount) {
            throw new Error(`Amount exceeds maximum of ${maxAmount} ${paymentData.currency}`);
        }
        // Validate metadata
        if (!paymentData.userId || !paymentData.patientId || !paymentData.invoiceId) {
            throw new Error('Missing required metadata (userId, patientId, invoiceId)');
        }
    }
    /**
     * Convert amount to cents (Stripe requires smallest currency unit)
     */
    convertToCents(amount) {
        return Math.round(amount * 100);
    }
    /**
     * Sanitize error messages to prevent information leakage
     * ✅ SECURITY: Never expose Stripe internal errors to clients
     */
    sanitizeErrorMessage(error) {
        // Map Stripe error codes to user-friendly messages
        const errorMessages = {
            card_declined: 'Your card was declined. Please try another payment method.',
            insufficient_funds: 'Insufficient funds. Please try another payment method.',
            expired_card: 'Your card has expired. Please use a different card.',
            incorrect_cvc: 'Incorrect security code. Please check your card details.',
            processing_error: 'An error occurred processing your payment. Please try again.',
            invalid_expiry_month: 'Invalid expiration month. Please check your card details.',
            invalid_expiry_year: 'Invalid expiration year. Please check your card details.',
        };
        if (error.code && errorMessages[error.code]) {
            return errorMessages[error.code];
        }
        // Generic error for unknown Stripe errors
        if (error.type?.startsWith('Stripe')) {
            return 'Payment processing error. Please try again or contact support.';
        }
        // For validation errors, return the message
        if (error.message && !error.type) {
            return error.message;
        }
        return 'An unexpected error occurred. Please try again.';
    }
    /**
     * Refund payment
     */
    async refundPayment(paymentIntentId, amount, reason) {
        try {
            const refundParams = {
                payment_intent: paymentIntentId,
                reason: reason || 'requested_by_customer',
            };
            if (amount) {
                refundParams.amount = this.convertToCents(amount);
            }
            const refund = await this.stripe.refunds.create(refundParams);
            this.logger.info('Payment refund processed', {
                paymentIntentId,
                refundId: refund.id,
                amount: refund.amount,
                reason: refund.reason,
            });
            return refund;
        }
        catch (error) {
            this.logger.error('Refund processing failed', {
                paymentIntentId,
                error: error.message,
                code: error.code,
            });
            throw new Error(this.sanitizeErrorMessage(error));
        }
    }
    /**
     * Retrieve payment details
     */
    async getPaymentDetails(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve payment details', {
                paymentIntentId,
                error: error.message,
            });
            throw new Error('Failed to retrieve payment details');
        }
    }
    /**
     * Create setup intent for saving payment method
     * (for subscription/recurring payments)
     */
    async createSetupIntent(customerId) {
        try {
            return await this.stripe.setupIntents.create({
                customer: customerId,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to create setup intent', {
                customerId,
                error: error.message,
            });
            throw new Error('Failed to create setup intent');
        }
    }
    /**
     * List payment methods for customer
     */
    async listPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            this.logger.error('Failed to list payment methods', {
                customerId,
                error: error.message,
            });
            return [];
        }
    }
}
exports.StripeVerificationService = StripeVerificationService;
exports.default = StripeVerificationService;
//# sourceMappingURL=stripe-verification.service.js.map