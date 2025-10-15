"use strict";
/**
 * Payment Entity
 * Represents a payment transaction in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEntity = exports.VerificationMethod = exports.PaymentStatus = void 0;
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["AWAITING_VERIFICATION"] = "awaiting_verification";
    PaymentStatus["VERIFIED"] = "verified";
    PaymentStatus["CONFIRMED"] = "confirmed";
    PaymentStatus["REJECTED"] = "rejected";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["PARTIALLY_REFUNDED"] = "partially_refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["MANUAL"] = "manual";
    VerificationMethod["API"] = "api";
    VerificationMethod["WEBHOOK"] = "webhook";
    VerificationMethod["CASH_RECEIPT"] = "cash_receipt";
    VerificationMethod["BANK_STATEMENT"] = "bank_statement";
})(VerificationMethod || (exports.VerificationMethod = VerificationMethod = {}));
class PaymentEntity {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = new Date();
    }
    /**
     * Check if payment is pending
     */
    isPending() {
        return this.status === PaymentStatus.PENDING ||
            this.status === PaymentStatus.PROCESSING;
    }
    /**
     * Check if payment is completed
     */
    isCompleted() {
        return this.status === PaymentStatus.CONFIRMED;
    }
    /**
     * Check if payment failed
     */
    isFailed() {
        return this.status === PaymentStatus.FAILED ||
            this.status === PaymentStatus.REJECTED;
    }
    /**
     * Check if payment requires verification
     */
    requiresVerification() {
        return this.status === PaymentStatus.AWAITING_VERIFICATION;
    }
    /**
     * Mark as verified
     */
    markAsVerified(verifiedBy, notes) {
        this.status = PaymentStatus.VERIFIED;
        this.verifiedBy = verifiedBy;
        this.verifiedAt = new Date();
        this.verificationNotes = notes;
        this.updatedAt = new Date();
    }
    /**
     * Mark as confirmed
     */
    markAsConfirmed() {
        this.status = PaymentStatus.CONFIRMED;
        this.confirmedAt = new Date();
        this.updatedAt = new Date();
    }
    /**
     * Mark as failed
     */
    markAsFailed(reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.failedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.PaymentEntity = PaymentEntity;
exports.default = PaymentEntity;
//# sourceMappingURL=payment.entity.js.map