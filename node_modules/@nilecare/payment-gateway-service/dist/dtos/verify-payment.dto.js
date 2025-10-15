"use strict";
/**
 * Verify Payment DTO
 * Data Transfer Object for verifying a payment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyPaymentDtoValidator = exports.VerificationMethod = void 0;
const joi_1 = __importDefault(require("joi"));
var VerificationMethod;
(function (VerificationMethod) {
    VerificationMethod["MANUAL"] = "manual";
    VerificationMethod["API"] = "api";
    VerificationMethod["WEBHOOK"] = "webhook";
    VerificationMethod["CASH_RECEIPT"] = "cash_receipt";
    VerificationMethod["BANK_STATEMENT"] = "bank_statement";
})(VerificationMethod || (exports.VerificationMethod = VerificationMethod = {}));
class VerifyPaymentDtoValidator {
    /**
     * Validate verify payment DTO
     */
    static validate(data) {
        return this.schema.validate(data, { abortEarly: false });
    }
}
exports.VerifyPaymentDtoValidator = VerifyPaymentDtoValidator;
/**
 * Validation schema
 */
VerifyPaymentDtoValidator.schema = joi_1.default.object({
    paymentId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Payment ID must be a valid UUID',
        'any.required': 'Payment ID is required'
    }),
    verificationCode: joi_1.default.string().max(50).optional(),
    verificationMethod: joi_1.default.string().required().valid('manual', 'api', 'webhook', 'cash_receipt', 'bank_statement').messages({
        'any.required': 'Verification method is required',
        'any.only': 'Invalid verification method'
    }),
    verifiedBy: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Verified by must be a valid user UUID',
        'any.required': 'Verified by is required'
    }),
    verificationNotes: joi_1.default.string().max(1000).optional(),
    evidenceFiles: joi_1.default.array().items(joi_1.default.object({
        type: joi_1.default.string().valid('receipt', 'screenshot', 'bank_statement', 'cheque_photo', 'other').required(),
        fileUrl: joi_1.default.string().uri().required(),
        fileName: joi_1.default.string().max(255).optional(),
        fileSize: joi_1.default.number().integer().positive().optional()
    })).optional()
});
//# sourceMappingURL=verify-payment.dto.js.map