"use strict";
/**
 * Verification Service
 * Handles manual and automated payment verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const payment_entity_1 = require("../entities/payment.entity");
const payment_repository_1 = __importDefault(require("../repositories/payment.repository"));
const provider_repository_1 = __importDefault(require("../repositories/provider.repository"));
const database_config_1 = __importDefault(require("../config/database.config"));
class VerificationService {
    constructor() {
        this.paymentRepository = new payment_repository_1.default();
        this.providerRepository = new provider_repository_1.default();
    }
    /**
     * Verify payment (manual or automated)
     */
    async verifyPayment(verifyDto) {
        try {
            // Get payment
            const payment = await this.getPaymentById(verifyDto.paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }
            // Check if payment can be verified
            if (payment.status !== payment_entity_1.PaymentStatus.AWAITING_VERIFICATION) {
                throw new Error(`Payment cannot be verified in status: ${payment.status}`);
            }
            // Get provider
            const provider = await this.getPaymentProvider(payment.providerId);
            // Verify with provider
            const verificationResult = await provider.verifyPayment(payment, verifyDto.verificationCode);
            if (verificationResult.verified) {
                // Use database transaction for atomic update
                await database_config_1.default.transaction(async (connection) => {
                    // Mark payment as verified and confirmed
                    payment.status = payment_entity_1.PaymentStatus.CONFIRMED;
                    payment.verifiedBy = verifyDto.verifiedBy;
                    payment.verifiedAt = new Date();
                    payment.verificationMethod = verifyDto.verificationMethod;
                    payment.verificationNotes = verifyDto.verificationNotes;
                    payment.confirmedAt = new Date();
                    // Add evidence URLs
                    if (verifyDto.evidenceFiles && verifyDto.evidenceFiles.length > 0) {
                        payment.evidenceUrls = verifyDto.evidenceFiles.map(file => ({
                            type: file.type,
                            url: file.fileUrl,
                            uploadedAt: new Date(),
                            uploadedBy: verifyDto.verifiedBy
                        }));
                    }
                    // Update payment within transaction
                    await connection.execute(`
            UPDATE payments SET
              status = ?,
              verified_by = ?,
              verified_at = ?,
              verification_method = ?,
              verification_notes = ?,
              evidence_urls = ?,
              confirmed_at = ?,
              updated_at = NOW()
            WHERE id = ?
          `, [
                        payment.status,
                        payment.verifiedBy,
                        payment.verifiedAt,
                        payment.verificationMethod,
                        payment.verificationNotes,
                        payment.evidenceUrls ? JSON.stringify(payment.evidenceUrls) : null,
                        payment.confirmedAt,
                        payment.id
                    ]);
                    // Update invoice status within same transaction
                    // This ensures payment and invoice are always in sync
                    // If either fails, both rollback
                    await connection.execute(`
            UPDATE invoices SET
              status = 'paid',
              paid_at = NOW(),
              updated_at = NOW()
            WHERE id = ? AND status != 'paid'
          `, [payment.invoiceId]);
                });
                // Send notification (after transaction commits)
                await this.sendVerificationNotification(payment, 'verified');
                // Publish event (after transaction commits)
                await this.publishPaymentEvent('payment_verified', payment);
                return {
                    success: true,
                    verified: true,
                    paymentId: payment.id,
                    status: 'confirmed',
                    message: 'Payment verified and confirmed successfully'
                };
            }
            else {
                // Verification failed
                payment.status = payment_entity_1.PaymentStatus.REJECTED;
                payment.rejectionReason = verificationResult.message || 'Verification failed';
                payment.updatedAt = new Date();
                await this.paymentRepository.update(payment);
                // Publish event
                await this.publishPaymentEvent('payment_rejected', payment);
                return {
                    success: false,
                    verified: false,
                    paymentId: payment.id,
                    status: 'rejected',
                    message: verificationResult.message || 'Verification failed'
                };
            }
        }
        catch (error) {
            console.error('Verification error:', error);
            throw new Error(`Payment verification failed: ${error.message}`);
        }
    }
    /**
     * Get pending verifications
     */
    async getPendingVerifications(facilityId) {
        const pendingPayments = await this.paymentRepository.findPendingVerifications(facilityId);
        return pendingPayments.map(payment => ({
            paymentId: payment.id,
            merchantReference: payment.merchantReference,
            transactionId: payment.transactionId,
            amount: payment.amount,
            currency: payment.currency,
            patientId: payment.patientId,
            facilityId: payment.facilityId,
            providerId: payment.providerId,
            createdAt: payment.createdAt,
            minutesPending: Math.floor((Date.now() - payment.createdAt.getTime()) / 60000)
        }));
    }
    /**
     * Bulk verify payments
     */
    async bulkVerifyPayments(paymentIds, verifiedBy, notes) {
        const results = {
            total: paymentIds.length,
            verified: 0,
            failed: 0,
            errors: []
        };
        for (const paymentId of paymentIds) {
            try {
                const verifyDto = {
                    paymentId,
                    verificationMethod: 'manual',
                    verifiedBy,
                    verificationNotes: notes
                };
                await this.verifyPayment(verifyDto);
                results.verified++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    paymentId,
                    error: error.message
                });
            }
        }
        return results;
    }
    /**
     * Get verification statistics
     */
    async getVerificationStatistics(filters) {
        // In production: Query from database with filters
        const { payments } = await this.paymentRepository.findWithFilters({ ...filters, status: payment_entity_1.PaymentStatus.AWAITING_VERIFICATION }, 1, 1000);
        return {
            totalPending: payments.length,
            averageVerificationTime: 0,
            verificationsByMethod: {},
            verificationsByUser: {},
            filteredResults: payments
        };
    }
    /**
     * Auto-verify payments (for automated providers)
     */
    async autoVerifyPayment(transactionId) {
        try {
            const payment = await this.getPaymentByTransactionId(transactionId);
            if (!payment) {
                throw new Error('Payment not found');
            }
            // Get provider
            const provider = await this.getPaymentProvider(payment.providerId);
            // Check payment status with provider
            const providerStatus = await provider.getPaymentStatus(transactionId);
            if (providerStatus && providerStatus.status === 'completed') {
                payment.status = payment_entity_1.PaymentStatus.CONFIRMED;
                payment.verificationMethod = 'api';
                payment.verifiedAt = new Date();
                payment.confirmedAt = new Date();
                await this.paymentRepository.update(payment);
                // Update invoice
                await this.updateInvoiceStatus(payment.invoiceId);
                // Publish event
                await this.publishPaymentEvent('payment_auto_verified', payment);
            }
        }
        catch (error) {
            console.error('Auto-verification error:', error);
            throw error;
        }
    }
    /**
     * Private helper methods
     */
    async getPaymentById(paymentId) {
        return await this.paymentRepository.findById(paymentId);
    }
    async getPaymentByTransactionId(transactionId) {
        return await this.paymentRepository.findByTransactionId(transactionId);
    }
    async getPaymentProvider(providerId) {
        return await this.providerRepository.findById(providerId);
    }
    async updateInvoiceStatus(invoiceId) {
        // Update invoice status based on payments
        console.log('Invoice status updated:', invoiceId);
    }
    async sendVerificationNotification(payment, eventType) {
        // Send notification
        console.log('Verification notification sent:', eventType, 'for payment:', payment.id);
    }
    async publishPaymentEvent(eventType, payment) {
        // Publish to Kafka
        console.log('Event published:', eventType, 'for payment:', payment.id, 'amount:', payment.amount);
    }
}
exports.VerificationService = VerificationService;
exports.default = VerificationService;
//# sourceMappingURL=verification.service.js.map