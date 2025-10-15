"use strict";
/**
 * Payment Provider Entity
 * Represents a payment provider configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProviderEntity = exports.VerificationType = exports.ProviderType = void 0;
var ProviderType;
(function (ProviderType) {
    ProviderType["BANK_CARD"] = "bank_card";
    ProviderType["LOCAL_BANK"] = "local_bank";
    ProviderType["MOBILE_WALLET"] = "mobile_wallet";
    ProviderType["DIGITAL_WALLET"] = "digital_wallet";
    ProviderType["CASH"] = "cash";
    ProviderType["CHEQUE"] = "cheque";
    ProviderType["BANK_TRANSFER"] = "bank_transfer";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
var VerificationType;
(function (VerificationType) {
    VerificationType["MANUAL"] = "manual";
    VerificationType["API_AUTO"] = "api_auto";
    VerificationType["WEBHOOK"] = "webhook";
    VerificationType["HYBRID"] = "hybrid";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
class PaymentProviderEntity {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = new Date();
    }
    /**
     * Check if provider is available
     */
    isAvailable() {
        return this.isActive && !this.isTestMode;
    }
    /**
     * Check if amount is within limits
     */
    isAmountValid(amount) {
        if (this.minTransactionAmount && amount < this.minTransactionAmount) {
            return false;
        }
        if (this.maxTransactionAmount && amount > this.maxTransactionAmount) {
            return false;
        }
        return true;
    }
    /**
     * Check if currency is supported
     */
    isCurrencySupported(currency) {
        return this.supportedCurrencies.includes(currency);
    }
    /**
     * Calculate fee for amount
     */
    calculateFee(amount) {
        if (!this.feeStructure) {
            return 0;
        }
        let fee = (amount * this.feeStructure.percentage / 100) + this.feeStructure.fixedAmount;
        if (this.feeStructure.minFee && fee < this.feeStructure.minFee) {
            fee = this.feeStructure.minFee;
        }
        if (this.feeStructure.maxFee && fee > this.feeStructure.maxFee) {
            fee = this.feeStructure.maxFee;
        }
        return Math.round(fee * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Check if manual verification is required
     */
    requiresManualVerification() {
        return this.verificationType === VerificationType.MANUAL ||
            this.requiresManualApproval;
    }
}
exports.PaymentProviderEntity = PaymentProviderEntity;
exports.default = PaymentProviderEntity;
//# sourceMappingURL=payment-provider.entity.js.map