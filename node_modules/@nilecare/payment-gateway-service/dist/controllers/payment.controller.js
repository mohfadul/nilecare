"use strict";
/**
 * Payment Controller
 * Handles all payment-related HTTP requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const create_payment_dto_1 = require("../dtos/create-payment.dto");
const verify_payment_dto_1 = require("../dtos/verify-payment.dto");
class PaymentController {
    constructor(paymentService, verificationService) {
        this.paymentService = paymentService;
        this.verificationService = verificationService;
    }
    /**
     * Initiate a new payment
     * POST /api/v1/payments/initiate
     */
    async initiatePayment(req, res) {
        try {
            // Validate request body
            const { error, value } = create_payment_dto_1.CreatePaymentDtoValidator.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.details.map(d => d.message)
                });
                return;
            }
            const createPaymentDto = value;
            // Add user context
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
                return;
            }
            // Initiate payment
            const result = await this.paymentService.initiatePayment(createPaymentDto, userId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Initiate payment error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Payment initiation failed'
            });
        }
    }
    /**
     * Get payment by ID
     * GET /api/v1/payments/:id
     */
    async getPayment(req, res) {
        try {
            const { id } = req.params;
            const payment = await this.paymentService.getPaymentById(id);
            if (!payment) {
                res.status(404).json({
                    success: false,
                    error: 'Payment not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: payment
            });
        }
        catch (error) {
            console.error('Get payment error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve payment'
            });
        }
    }
    /**
     * List payments with filters
     * GET /api/v1/payments
     */
    async listPayments(req, res) {
        try {
            const { facilityId, patientId, status, providerName, startDate, endDate, page = 1, limit = 50 } = req.query;
            const filters = {};
            if (facilityId)
                filters.facilityId = facilityId;
            if (patientId)
                filters.patientId = patientId;
            if (status)
                filters.status = status;
            if (providerName)
                filters.providerName = providerName;
            if (startDate && endDate) {
                filters.dateRange = { start: startDate, end: endDate };
            }
            const result = await this.paymentService.listPayments(filters, parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result.payments,
                pagination: {
                    total: result.total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(result.total / parseInt(limit))
                }
            });
        }
        catch (error) {
            console.error('List payments error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve payments'
            });
        }
    }
    /**
     * Verify payment manually
     * POST /api/v1/payments/verify
     */
    async verifyPayment(req, res) {
        try {
            // Validate request body
            const { error, value } = verify_payment_dto_1.VerifyPaymentDtoValidator.validate(req.body);
            if (error) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.details.map(d => d.message)
                });
                return;
            }
            const verifyPaymentDto = value;
            // Add user context
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
                return;
            }
            // Override verifiedBy with actual user ID
            verifyPaymentDto.verifiedBy = userId;
            // Verify payment
            const result = await this.verificationService.verifyPayment(verifyPaymentDto);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Verify payment error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Payment verification failed'
            });
        }
    }
    /**
     * Get pending verifications
     * GET /api/v1/payments/pending-verification
     */
    async getPendingVerifications(req, res) {
        try {
            const { facilityId } = req.query;
            const pendingPayments = await this.verificationService.getPendingVerifications(facilityId);
            res.status(200).json({
                success: true,
                data: pendingPayments,
                count: pendingPayments.length
            });
        }
        catch (error) {
            console.error('Get pending verifications error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve pending verifications'
            });
        }
    }
    /**
     * Cancel payment
     * PATCH /api/v1/payments/:id/cancel
     */
    async cancelPayment(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized'
                });
                return;
            }
            const result = await this.paymentService.cancelPayment(id, reason, userId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Cancel payment error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Payment cancellation failed'
            });
        }
    }
    /**
     * Get payment statistics
     * GET /api/v1/payments/stats
     */
    async getPaymentStats(req, res) {
        try {
            const { facilityId, startDate, endDate } = req.query;
            const stats = await this.paymentService.getPaymentStatistics({
                facilityId: facilityId,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            });
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Get payment stats error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve statistics'
            });
        }
    }
    /**
     * Webhook handler for payment providers
     * POST /api/v1/payments/webhook/:provider
     */
    async handleWebhook(req, res) {
        try {
            const { provider } = req.params;
            const webhookData = req.body;
            await this.paymentService.handleProviderWebhook(provider, webhookData);
            res.status(200).json({
                success: true,
                message: 'Webhook processed successfully'
            });
        }
        catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Webhook processing failed'
            });
        }
    }
}
exports.PaymentController = PaymentController;
exports.default = PaymentController;
//# sourceMappingURL=payment.controller.js.map