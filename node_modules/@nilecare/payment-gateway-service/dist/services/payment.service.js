"use strict";
/**
 * Payment Service
 * Core business logic for payment processing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const payment_entity_1 = require("../entities/payment.entity");
const payment_repository_1 = __importDefault(require("../repositories/payment.repository"));
// import ProviderRepository from '../repositories/provider.repository';
// Import providers
const bank_of_khartoum_service_1 = __importDefault(require("./providers/bank-of-khartoum.service"));
const zain_cash_service_1 = __importDefault(require("./providers/zain-cash.service"));
const cash_service_1 = __importDefault(require("./providers/cash.service"));
class PaymentService {
    // private providerRepository: ProviderRepository;
    constructor() {
        this.providers = new Map();
        this.paymentRepository = new payment_repository_1.default();
        // this.providerRepository = new ProviderRepository();
        this.initializeProviders();
    }
    /**
     * Initialize payment providers
     */
    initializeProviders() {
        // Load provider configurations (would come from database or config)
        const providerConfigs = {
            bank_of_khartoum: {
                baseURL: process.env.BANK_OF_KHARTOUM_API_URL || 'https://api.bankofkhartoum.com',
                apiKey: process.env.BANK_OF_KHARTOUM_API_KEY,
                apiSecret: process.env.BANK_OF_KHARTOUM_API_SECRET
            },
            zain_cash: {
                baseURL: process.env.ZAIN_CASH_API_URL || 'https://api.zaincash.sd',
                apiKey: process.env.ZAIN_CASH_API_KEY,
                apiSecret: process.env.ZAIN_CASH_API_SECRET,
                merchantId: process.env.ZAIN_CASH_MERCHANT_ID,
                callbackUrl: `${process.env.APP_URL}/api/v1/payments/webhook/zain-cash`
            },
            cash: {
                baseURL: '',
                apiKey: ''
            }
        };
        // Initialize providers
        this.providers.set('bank_of_khartoum', new bank_of_khartoum_service_1.default(providerConfigs.bank_of_khartoum));
        this.providers.set('zain_cash', new zain_cash_service_1.default(providerConfigs.zain_cash));
        this.providers.set('cash', new cash_service_1.default(providerConfigs.cash));
    }
    /**
     * Get provider by name
     */
    getProvider(providerName) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} not found or not configured`);
        }
        return provider;
    }
    /**
     * Initiate payment
     */
    async initiatePayment(createPaymentDto, userId) {
        try {
            // Validate invoice exists and amount matches
            await this.validateInvoice(createPaymentDto.invoiceId, createPaymentDto.amount);
            // Get provider
            const provider = this.getProvider(createPaymentDto.providerName);
            // Create payment entity
            const payment = new payment_entity_1.PaymentEntity({
                invoiceId: createPaymentDto.invoiceId,
                patientId: createPaymentDto.patientId,
                facilityId: createPaymentDto.facilityId,
                providerId: '', // Would be fetched from provider configuration
                amount: createPaymentDto.amount,
                currency: createPaymentDto.currency || 'SDG',
                exchangeRate: 1.0,
                amountInSdg: createPaymentDto.amount,
                merchantReference: this.generateMerchantReference(),
                externalReference: createPaymentDto.externalReference,
                status: payment_entity_1.PaymentStatus.PENDING,
                paymentMethodDetails: this.convertPaymentMethodDetails(createPaymentDto.paymentMethodDetails),
                riskScore: 0,
                isFlaggedSuspicious: false,
                providerFee: 0,
                platformFee: 0,
                totalFees: 0,
                netAmount: createPaymentDto.amount,
                initiatedAt: new Date(),
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Process payment with provider
            const result = await provider.processPayment(createPaymentDto, payment);
            // Update payment with result
            payment.transactionId = result.transactionId;
            payment.status = this.mapStatusToPaymentStatus(result.status);
            // Calculate fees (would be based on provider configuration)
            payment.providerFee = this.calculateProviderFee(payment.amount, createPaymentDto.providerName);
            payment.platformFee = 0; // Configure as needed
            payment.totalFees = payment.providerFee + payment.platformFee;
            payment.netAmount = payment.amount - payment.totalFees;
            // Save payment
            await this.savePayment(payment);
            // Perform fraud detection
            await this.performFraudDetection(payment);
            // Send notification
            await this.sendPaymentNotification(payment, 'initiated');
            // Publish event
            await this.publishPaymentEvent('payment_initiated', payment);
            return {
                success: result.success,
                paymentId: payment.id,
                transactionId: result.transactionId,
                merchantReference: payment.merchantReference,
                status: result.status,
                paymentUrl: result.paymentUrl,
                qrCode: result.qrCode,
                requiresManualVerification: result.requiresManualVerification,
                message: result.message
            };
        }
        catch (error) {
            console.error('Payment initiation error:', error);
            throw new Error(`Payment initiation failed: ${error.message}`);
        }
    }
    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId) {
        return await this.paymentRepository.findById(paymentId);
    }
    /**
     * List payments with filters
     */
    async listPayments(filters, page = 1, limit = 50) {
        return await this.paymentRepository.findWithFilters(filters, page, limit);
    }
    /**
     * Cancel payment
     */
    async cancelPayment(paymentId, reason, _userId) {
        const payment = await this.getPaymentById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }
        if (![payment_entity_1.PaymentStatus.PENDING, payment_entity_1.PaymentStatus.PROCESSING].includes(payment.status)) {
            throw new Error('Payment cannot be cancelled in current status');
        }
        payment.status = payment_entity_1.PaymentStatus.CANCELLED;
        payment.rejectionReason = reason;
        payment.updatedAt = new Date();
        await this.paymentRepository.update(payment);
        // Publish event
        await this.publishPaymentEvent('payment_cancelled', payment);
        return {
            success: true,
            paymentId: payment.id,
            status: 'cancelled'
        };
    }
    /**
     * Get payment statistics
     */
    async getPaymentStatistics(filters) {
        const { payments } = await this.paymentRepository.findWithFilters(filters, 1, 10000);
        const totalPayments = payments.length;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const successfulPayments = payments.filter(p => p.status === payment_entity_1.PaymentStatus.CONFIRMED).length;
        const pendingPayments = payments.filter(p => p.status === payment_entity_1.PaymentStatus.PENDING ||
            p.status === payment_entity_1.PaymentStatus.AWAITING_VERIFICATION).length;
        const failedPayments = payments.filter(p => p.status === payment_entity_1.PaymentStatus.FAILED).length;
        const paymentsByProvider = {};
        const paymentsByStatus = {};
        for (const payment of payments) {
            paymentsByProvider[payment.providerId] = (paymentsByProvider[payment.providerId] || 0) + 1;
            paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
        }
        const stats = {
            totalPayments,
            totalAmount,
            successfulPayments,
            pendingPayments,
            failedPayments,
            averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
            paymentsByProvider,
            paymentsByStatus
        };
        return stats;
    }
    /**
     * Handle provider webhook
     */
    async handleProviderWebhook(providerName, webhookData) {
        try {
            const provider = this.getProvider(providerName);
            // Process webhook
            const result = await provider.handleWebhook(webhookData);
            if (result && result.transactionId) {
                // Find payment by transaction ID
                const payment = await this.getPaymentByTransactionId(result.transactionId);
                if (payment) {
                    // Update payment status
                    payment.status = this.mapStatusToPaymentStatus(result.status);
                    payment.verifiedAt = result.verifiedAt;
                    payment.updatedAt = new Date();
                    if (payment.status === payment_entity_1.PaymentStatus.CONFIRMED) {
                        payment.confirmedAt = new Date();
                    }
                    else if (payment.status === payment_entity_1.PaymentStatus.FAILED) {
                        payment.failedAt = new Date();
                        payment.failureReason = result.message;
                    }
                    await this.paymentRepository.update(payment);
                    // Update invoice status if payment confirmed
                    if (payment.status === payment_entity_1.PaymentStatus.CONFIRMED) {
                        await this.updateInvoiceStatus(payment.invoiceId);
                    }
                    // Publish event
                    await this.publishPaymentEvent('payment_updated', payment);
                }
            }
        }
        catch (error) {
            console.error('Webhook handling error:', error);
            throw error;
        }
    }
    /**
     * Update invoice status based on payments
     */
    async updateInvoiceStatus(invoiceId) {
        // In production: Query all payments for invoice
        // const payments = await this.paymentRepository.find({
        //   where: { invoiceId, status: PaymentStatus.CONFIRMED }
        // });
        // const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        // const invoice = await this.invoiceService.getInvoice(invoiceId);
        // Determine new status
        // let newStatus: string;
        // if (totalPaid >= invoice.totalAmount) {
        //   newStatus = 'paid';
        // } else if (totalPaid > 0) {
        //   newStatus = 'partially_paid';
        // } else {
        //   newStatus = 'unpaid';
        // }
        // await this.invoiceService.updateStatus(invoiceId, newStatus, totalPaid);
        console.log('Invoice status updated for:', invoiceId);
    }
    /**
     * Private helper methods
     */
    async validateInvoice(_invoiceId, _amount) {
        // In production: Validate invoice exists and amount matches
        // const invoice = await this.invoiceService.getInvoice(invoiceId);
        // if (!invoice) {
        //   throw new Error('Invoice not found');
        // }
        // if (invoice.status === 'paid') {
        //   throw new Error('Invoice already paid');
        // }
        // Validate amount logic...
    }
    generateMerchantReference() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `NILE-${timestamp}-${random}`;
    }
    calculateProviderFee(amount, providerName) {
        // Fee structure (would come from provider configuration)
        const feeRates = {
            'bank_of_khartoum': 0.015, // 1.5%
            'faisal_islamic': 0.015, // 1.5%
            'zain_cash': 0.01, // 1.0%
            'mtn_money': 0.01, // 1.0%
            'sudani_cash': 0.01, // 1.0%
            'cash': 0, // 0%
            'visa': 0.025, // 2.5%
            'mastercard': 0.025 // 2.5%
        };
        const rate = feeRates[providerName] || 0;
        return Math.round(amount * rate * 100) / 100;
    }
    mapStatusToPaymentStatus(status) {
        const statusMap = {
            'pending': payment_entity_1.PaymentStatus.PENDING,
            'processing': payment_entity_1.PaymentStatus.PROCESSING,
            'awaiting_verification': payment_entity_1.PaymentStatus.AWAITING_VERIFICATION,
            'confirmed': payment_entity_1.PaymentStatus.CONFIRMED,
            'failed': payment_entity_1.PaymentStatus.FAILED
        };
        return statusMap[status] || payment_entity_1.PaymentStatus.PENDING;
    }
    async savePayment(payment) {
        await this.paymentRepository.create(payment);
        console.log('Payment saved:', payment.id);
    }
    async getPaymentByTransactionId(transactionId) {
        return await this.paymentRepository.findByTransactionId(transactionId);
    }
    async performFraudDetection(_payment) {
        // Implement fraud detection logic
        // - Check unusual amounts
        // - Check velocity (multiple payments in short time)
        // - Check geographic anomalies
        // - Check device fingerprint
        // Update payment.riskScore and payment.fraudFlags
    }
    async sendPaymentNotification(_payment, _eventType) {
        // Send notification to patient
        // await this.notificationService.sendPaymentNotification(payment.patientId, eventType, payment);
        console.log('Notification sent:', _eventType);
    }
    async publishPaymentEvent(_eventType, _payment) {
        // Publish to Kafka
        // await this.eventPublisher.publish('payment-events', {
        //   eventType,
        //   payment
        // });
        console.log('Event published:', _eventType);
    }
    /**
     * Convert DTO payment method details to entity format
     * Handles string to Date conversions
     */
    convertPaymentMethodDetails(details) {
        if (!details)
            return details;
        const converted = { ...details };
        // Convert chequeDate from string to Date if needed
        if (converted.chequeDate && typeof converted.chequeDate === 'string') {
            converted.chequeDate = new Date(converted.chequeDate);
        }
        return converted;
    }
}
exports.PaymentService = PaymentService;
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map