"use strict";
/**
 * Zain Cash Payment Provider Service
 * Handles mobile wallet payments through Zain Cash (Zain Bede)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZainCashService = void 0;
const axios_1 = __importDefault(require("axios"));
const base_provider_service_1 = require("./base-provider.service");
class ZainCashService extends base_provider_service_1.BasePaymentProvider {
    constructor(providerConfig) {
        super('zain_cash', providerConfig);
        this.merchantId = providerConfig.merchantId;
        this.callbackUrl = providerConfig.callbackUrl || `${process.env.APP_URL}/api/v1/payments/webhook/zain-cash`;
    }
    /**
     * Process payment through Zain Cash
     * Initiates mobile wallet payment and returns payment URL
     */
    async processPayment(paymentData, payment) {
        try {
            this.validatePaymentData(paymentData);
            // Validate phone number
            if (!paymentData.phoneNumber) {
                throw new Error('Phone number is required for Zain Cash payments');
            }
            if (!paymentData.phoneNumber.match(/^\+249[0-9]{9}$/)) {
                throw new Error('Invalid Sudan phone number format. Use +249XXXXXXXXX');
            }
            // Call Zain Cash API
            const response = await axios_1.default.post(`${this.baseURL}/api/v1/payments/init`, {
                merchant_id: this.merchantId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'SDG',
                customer_msisdn: paymentData.phoneNumber,
                merchant_reference: payment.merchantReference,
                callback_url: this.callbackUrl,
                description: `Healthcare Payment - Invoice ${paymentData.invoiceId}`,
                metadata: {
                    invoice_id: paymentData.invoiceId,
                    patient_id: paymentData.patientId,
                    facility_id: paymentData.facilityId
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            if (response.data.success) {
                const result = {
                    success: true,
                    transactionId: response.data.transaction_id,
                    status: 'processing',
                    paymentUrl: response.data.payment_url,
                    qrCode: response.data.qr_code,
                    message: 'Payment initiated. Redirect to Zain Cash for completion.',
                    requiresManualVerification: false
                };
                this.logProviderInteraction('processPayment', paymentData, result);
                return result;
            }
            else {
                return {
                    success: false,
                    status: 'failed',
                    message: response.data.message || 'Payment initiation failed'
                };
            }
        }
        catch (error) {
            console.error('Zain Cash payment error:', error);
            return {
                success: false,
                status: 'failed',
                message: error.response?.data?.message || error.message || 'Payment processing failed'
            };
        }
    }
    /**
     * Verify payment status with Zain Cash
     */
    async verifyPayment(payment, _verificationCode) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/api/v1/payments/${payment.transactionId}/status`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 10000
            });
            if (response.data.status === 'completed') {
                return {
                    success: true,
                    verified: true,
                    verifiedAt: new Date(),
                    message: 'Payment verified successfully'
                };
            }
            else if (response.data.status === 'failed') {
                return {
                    success: false,
                    verified: false,
                    message: response.data.failure_reason || 'Payment failed'
                };
            }
            else {
                return {
                    success: true,
                    verified: false,
                    message: 'Payment still processing'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                verified: false,
                message: error.message || 'Verification failed'
            };
        }
    }
    /**
     * Handle Zain Cash webhook
     */
    async handleWebhook(webhookData) {
        try {
            // Validate webhook signature
            const isValid = this.validateWebhookSignature(webhookData);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }
            const { transaction_id, status, amount, customer_msisdn } = webhookData;
            this.logProviderInteraction('handleWebhook', webhookData, { transaction_id, status });
            return {
                transactionId: transaction_id,
                status: this.mapZainCashStatus(status),
                amount,
                phoneNumber: customer_msisdn,
                verifiedAt: new Date()
            };
        }
        catch (error) {
            console.error('Zain Cash webhook error:', error);
            throw error;
        }
    }
    /**
     * Refund payment through Zain Cash
     */
    async refundPayment(payment, amount, reason) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/api/v1/refunds`, {
                merchant_id: this.merchantId,
                transaction_id: payment.transactionId,
                refund_amount: amount,
                reason: reason
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            if (response.data.success) {
                return {
                    success: true,
                    refundId: response.data.refund_id,
                    status: 'completed',
                    message: 'Refund processed successfully'
                };
            }
            else {
                return {
                    success: false,
                    status: 'failed',
                    message: response.data.message || 'Refund failed'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                status: 'failed',
                message: error.response?.data?.message || error.message || 'Refund failed'
            };
        }
    }
    /**
     * Get payment status from Zain Cash
     */
    async getPaymentStatus(transactionId) {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/api/v1/payments/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: 10000
            });
            return response.data;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validate webhook signature
     */
    validateWebhookSignature(webhookData) {
        if (!webhookData || !webhookData.signature) {
            return false;
        }
        if (!this.apiSecret) {
            console.error('API secret not configured for webhook validation');
            return false;
        }
        try {
            // Create payload for signature verification
            const { signature, ...payload } = webhookData;
            const payloadString = JSON.stringify(payload);
            // Calculate expected signature using HMAC-SHA256
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', this.apiSecret)
                .update(payloadString)
                .digest('hex');
            // Timing-safe comparison to prevent timing attacks
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('Webhook signature validation error:', error);
            return false;
        }
    }
    /**
     * Map Zain Cash status to our internal status
     */
    mapZainCashStatus(zainStatus) {
        const statusMap = {
            'pending': 'processing',
            'processing': 'processing',
            'completed': 'confirmed',
            'successful': 'confirmed',
            'failed': 'failed',
            'cancelled': 'cancelled',
            'expired': 'failed'
        };
        return statusMap[zainStatus] || 'pending';
    }
}
exports.ZainCashService = ZainCashService;
exports.default = ZainCashService;
//# sourceMappingURL=zain-cash.service.js.map