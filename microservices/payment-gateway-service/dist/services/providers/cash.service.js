"use strict";
/**
 * Cash Payment Provider Service
 * Handles cash payments with manual verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashService = void 0;
const base_provider_service_1 = require("./base-provider.service");
class CashService extends base_provider_service_1.BasePaymentProvider {
    constructor(providerConfig) {
        super('cash', providerConfig);
    }
    /**
     * Process cash payment
     * Generates receipt and marks for manual verification
     */
    async processPayment(paymentData, _payment) {
        try {
            this.validatePaymentData(paymentData);
            // Generate receipt number
            const receiptNumber = await this.generateReceiptNumber();
            const result = {
                success: true,
                transactionId: receiptNumber,
                status: 'awaiting_verification',
                message: 'Cash payment recorded. Pending staff confirmation.',
                requiresManualVerification: true
            };
            this.logProviderInteraction('processPayment', paymentData, result);
            return result;
        }
        catch (error) {
            return {
                success: false,
                status: 'failed',
                message: error.message || 'Cash payment processing failed'
            };
        }
    }
    /**
     * Verify cash payment manually
     */
    async verifyPayment(payment, _verificationCode) {
        try {
            // Validate cash payment details
            if (!payment.paymentMethodDetails?.receivedBy) {
                throw new Error('Staff member name is required for cash payment verification');
            }
            // Optionally validate denomination breakdown
            if (payment.paymentMethodDetails?.denominationBreakdown) {
                const total = this.calculateDenominationTotal(payment.paymentMethodDetails.denominationBreakdown);
                if (Math.abs(total - payment.amount) > 0.01) {
                    throw new Error(`Denomination breakdown (${total} SDG) does not match payment amount (${payment.amount} SDG)`);
                }
            }
            return {
                success: true,
                verified: true,
                verifiedAt: new Date(),
                message: 'Cash payment verified successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                verified: false,
                message: error.message || 'Cash payment verification failed'
            };
        }
    }
    /**
     * Refund cash payment
     * Creates refund request for manual processing
     */
    async refundPayment(_payment, _amount, _reason) {
        try {
            // Cash refunds are processed manually
            const refundId = `CASH-REFUND-${Date.now()}`;
            return {
                success: true,
                refundId,
                status: 'pending',
                message: 'Cash refund request created. Please process manually at cash counter.'
            };
        }
        catch (error) {
            return {
                success: false,
                status: 'failed',
                message: error.message || 'Refund creation failed'
            };
        }
    }
    /**
     * Generate unique receipt number
     */
    async generateReceiptNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = date.getTime();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `CASH-${year}${month}${day}-${timestamp}-${random}`;
    }
    /**
     * Calculate total from denomination breakdown
     */
    calculateDenominationTotal(breakdown) {
        let total = 0;
        for (const [denomination, count] of Object.entries(breakdown)) {
            const value = parseFloat(denomination);
            if (!isNaN(value) && count > 0) {
                total += value * count;
            }
        }
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Validate denomination breakdown
     */
    validateDenominationBreakdown(breakdown, expectedAmount) {
        const total = this.calculateDenominationTotal(breakdown);
        const difference = Math.abs(total - expectedAmount);
        return {
            valid: difference < 0.01,
            total,
            difference
        };
    }
    /**
     * Generate cash receipt data for printing
     */
    generateReceiptData(payment) {
        return {
            receiptNumber: payment.transactionId,
            date: payment.createdAt,
            amount: payment.amount,
            currency: payment.currency,
            patientId: payment.patientId,
            invoiceId: payment.invoiceId,
            facilityId: payment.facilityId,
            receivedBy: payment.paymentMethodDetails?.receivedBy,
            denominationBreakdown: payment.paymentMethodDetails?.denominationBreakdown,
            verifiedBy: payment.verifiedBy,
            verifiedAt: payment.verifiedAt
        };
    }
}
exports.CashService = CashService;
exports.default = CashService;
//# sourceMappingURL=cash.service.js.map