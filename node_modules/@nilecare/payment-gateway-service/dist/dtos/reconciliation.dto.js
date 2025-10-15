"use strict";
/**
 * Reconciliation DTO
 * Data Transfer Object for payment reconciliation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationDtoValidator = exports.ResolutionAction = void 0;
const joi_1 = __importDefault(require("joi"));
var ResolutionAction;
(function (ResolutionAction) {
    ResolutionAction["ADJUST_PAYMENT"] = "adjust_payment";
    ResolutionAction["REFUND"] = "refund";
    ResolutionAction["WRITE_OFF"] = "write_off";
    ResolutionAction["CONTACT_PROVIDER"] = "contact_provider";
    ResolutionAction["NONE"] = "none";
})(ResolutionAction || (exports.ResolutionAction = ResolutionAction = {}));
class ReconciliationDtoValidator {
    /**
     * Validate reconciliation DTO
     */
    static validate(data) {
        return this.schema.validate(data, { abortEarly: false });
    }
    /**
     * Validate resolve discrepancy DTO
     */
    static validateResolve(data) {
        return this.resolveSchema.validate(data, { abortEarly: false });
    }
}
exports.ReconciliationDtoValidator = ReconciliationDtoValidator;
/**
 * Validation schema for reconciliation
 */
ReconciliationDtoValidator.schema = joi_1.default.object({
    paymentId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Payment ID must be a valid UUID',
        'any.required': 'Payment ID is required'
    }),
    externalTransactionId: joi_1.default.string().max(255).optional(),
    externalAmount: joi_1.default.number().positive().precision(2).required()
        .messages({
        'number.base': 'External amount must be a number',
        'number.positive': 'External amount must be positive',
        'any.required': 'External amount is required'
    }),
    externalCurrency: joi_1.default.string().length(3).uppercase().default('SDG')
        .messages({
        'string.length': 'Currency must be a 3-letter code'
    }),
    externalFee: joi_1.default.number().min(0).precision(2).optional()
        .messages({
        'number.min': 'External fee cannot be negative'
    }),
    transactionDate: joi_1.default.date().iso().required()
        .messages({
        'date.base': 'Transaction date must be a valid date',
        'any.required': 'Transaction date is required'
    }),
    bankStatementId: joi_1.default.string().uuid().optional(),
    statementLineNumber: joi_1.default.number().integer().positive().optional(),
    statementFileUrl: joi_1.default.string().uri().optional()
});
/**
 * Validation schema for resolving discrepancy
 */
ReconciliationDtoValidator.resolveSchema = joi_1.default.object({
    reconciliationId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Reconciliation ID must be a valid UUID',
        'any.required': 'Reconciliation ID is required'
    }),
    resolutionAction: joi_1.default.string().required().valid('adjust_payment', 'refund', 'write_off', 'contact_provider', 'none').messages({
        'any.required': 'Resolution action is required',
        'any.only': 'Invalid resolution action'
    }),
    resolutionNotes: joi_1.default.string().min(10).max(1000).required()
        .messages({
        'string.min': 'Resolution notes must be at least 10 characters',
        'string.max': 'Resolution notes cannot exceed 1000 characters',
        'any.required': 'Resolution notes are required'
    }),
    resolvedBy: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Resolved by must be a valid user UUID',
        'any.required': 'Resolved by is required'
    })
});
//# sourceMappingURL=reconciliation.dto.js.map