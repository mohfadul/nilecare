"use strict";
/**
 * Create Payment DTO
 * Data Transfer Object for initiating a payment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePaymentDtoValidator = void 0;
const joi_1 = __importDefault(require("joi"));
class CreatePaymentDtoValidator {
    /**
     * Validate create payment DTO
     */
    static validate(data) {
        return this.schema.validate(data, { abortEarly: false });
    }
}
exports.CreatePaymentDtoValidator = CreatePaymentDtoValidator;
/**
 * Validation schema
 */
CreatePaymentDtoValidator.schema = joi_1.default.object({
    invoiceId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Invoice ID must be a valid UUID',
        'any.required': 'Invoice ID is required'
    }),
    patientId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Patient ID must be a valid UUID',
        'any.required': 'Patient ID is required'
    }),
    facilityId: joi_1.default.string().uuid().required()
        .messages({
        'string.guid': 'Facility ID must be a valid UUID',
        'any.required': 'Facility ID is required'
    }),
    providerName: joi_1.default.string().required().valid(
    // Bank cards
    'visa', 'mastercard', 
    // Local banks
    'bank_of_khartoum', 'faisal_islamic', 'omdurman_national', 
    // Mobile wallets
    'zain_cash', 'mtn_money', 'sudani_cash', 'bankak', 
    // Traditional
    'cash', 'cheque', 'bank_transfer').messages({
        'any.required': 'Payment provider is required',
        'any.only': 'Invalid payment provider'
    }),
    amount: joi_1.default.number().positive().precision(2).required()
        .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
    }),
    currency: joi_1.default.string().length(3).uppercase().default('SDG')
        .messages({
        'string.length': 'Currency must be a 3-letter code',
        'string.uppercase': 'Currency must be uppercase'
    }),
    externalReference: joi_1.default.string().max(255).optional(),
    paymentMethodDetails: joi_1.default.object({
        phoneNumber: joi_1.default.string().pattern(/^\+249[0-9]{9}$/).optional()
            .messages({
            'string.pattern.base': 'Phone number must be in Sudan format (+249XXXXXXXXX)'
        }),
        walletName: joi_1.default.string().max(100).optional(),
        denominationBreakdown: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.number()).optional(),
        receivedBy: joi_1.default.string().max(255).optional(),
        chequeNumber: joi_1.default.string().max(50).optional(),
        bank: joi_1.default.string().max(100).optional(),
        chequeDate: joi_1.default.date().iso().optional(),
        accountNumber: joi_1.default.string().max(50).optional(),
        bankName: joi_1.default.string().max(100).optional(),
        transferReference: joi_1.default.string().max(255).optional()
    }).optional(),
    metadata: joi_1.default.object().optional(),
    sudanState: joi_1.default.string().valid('Khartoum', 'Gezira', 'Red Sea', 'Kassala', 'Gedaref', 'White Nile', 'Blue Nile', 'Northern', 'River Nile', 'North Kordofan', 'South Kordofan', 'West Kordofan', 'North Darfur', 'South Darfur', 'West Darfur', 'East Darfur', 'Central Darfur', 'Sennar').optional(),
    phoneNumber: joi_1.default.string().pattern(/^\+249[0-9]{9}$/).optional()
        .messages({
        'string.pattern.base': 'Phone number must be in Sudan format (+249XXXXXXXXX)'
    })
});
//# sourceMappingURL=create-payment.dto.js.map