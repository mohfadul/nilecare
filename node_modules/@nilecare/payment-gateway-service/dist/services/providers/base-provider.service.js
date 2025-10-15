"use strict";
/**
 * Base Payment Provider Service
 * Abstract base class for all payment provider implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePaymentProvider = void 0;
class BasePaymentProvider {
    constructor(providerName, providerConfig) {
        this.providerName = providerName;
        this.providerConfig = providerConfig;
        this.baseURL = providerConfig.baseURL;
        this.apiKey = providerConfig.apiKey;
        this.apiSecret = providerConfig.apiSecret;
    }
    /**
     * Refund payment (optional, can be overridden)
     */
    async refundPayment(_payment, _amount, _reason) {
        return {
            success: false,
            status: 'failed',
            message: 'Refunds not supported for this provider'
        };
    }
    /**
     * Get payment status from provider (optional)
     */
    async getPaymentStatus(_transactionId) {
        return null;
    }
    /**
     * Handle webhook (optional)
     */
    async handleWebhook(_webhookData) {
        // Override in providers that support webhooks
    }
    /**
     * Validate payment data before processing
     */
    validatePaymentData(paymentData) {
        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        if (!paymentData.invoiceId) {
            throw new Error('Invoice ID is required');
        }
        if (!paymentData.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!paymentData.facilityId) {
            throw new Error('Facility ID is required');
        }
    }
    /**
     * Generate unique transaction ID
     */
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `${this.providerName.toUpperCase()}-${timestamp}-${random}`;
    }
    /**
     * Log provider interaction
     */
    logProviderInteraction(action, data, result) {
        console.log(`[${this.providerName}] ${action}`, {
            data,
            result,
            timestamp: new Date().toISOString()
        });
    }
}
exports.BasePaymentProvider = BasePaymentProvider;
exports.default = BasePaymentProvider;
//# sourceMappingURL=base-provider.service.js.map