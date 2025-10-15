"use strict";
/**
 * Express middleware for Sudan-specific validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSudanFacilityData = exports.validateSudanPatientData = exports.validateSudanAddressMiddleware = exports.validateSudanNationalId = exports.validateSudanPhone = void 0;
const sudanValidation_1 = require("../utils/sudanValidation");
/**
 * Middleware to validate Sudan mobile phone number
 */
const validateSudanPhone = (field = 'phone') => {
    return (req, res, next) => {
        const phone = req.body[field];
        if (!phone) {
            return res.status(400).json({
                success: false,
                error: sudanValidation_1.PHONE_VALIDATION_MESSAGES.REQUIRED,
                field
            });
        }
        if (!(0, sudanValidation_1.isValidSudanMobile)(phone)) {
            return res.status(400).json({
                success: false,
                error: sudanValidation_1.PHONE_VALIDATION_MESSAGES.INVALID_FORMAT,
                field,
                example: '+249912345678'
            });
        }
        next();
    };
};
exports.validateSudanPhone = validateSudanPhone;
/**
 * Middleware to validate Sudan National ID
 */
const validateSudanNationalId = (field = 'sudan_national_id') => {
    return (req, res, next) => {
        const nationalId = req.body[field] || req.body.sudanNationalId;
        if (!nationalId) {
            return res.status(400).json({
                success: false,
                error: sudanValidation_1.NATIONAL_ID_VALIDATION_MESSAGES.REQUIRED,
                field
            });
        }
        if (!(0, sudanValidation_1.isValidSudanNationalId)(nationalId)) {
            return res.status(400).json({
                success: false,
                error: sudanValidation_1.NATIONAL_ID_VALIDATION_MESSAGES.INVALID_FORMAT,
                field
            });
        }
        next();
    };
};
exports.validateSudanNationalId = validateSudanNationalId;
/**
 * Middleware to validate Sudan address
 */
const validateSudanAddressMiddleware = (req, res, next) => {
    const address = {
        addressLine1: req.body.address_line1 || req.body.addressLine1,
        addressLine2: req.body.address_line2 || req.body.addressLine2,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postal_code || req.body.postalCode,
        country: req.body.country || 'Sudan'
    };
    const validation = (0, sudanValidation_1.validateSudanAddress)(address);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: 'Invalid address',
            errors: validation.errors
        });
    }
    // Normalize the address format in request body
    req.body.address = {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: 'Sudan'
    };
    next();
};
exports.validateSudanAddressMiddleware = validateSudanAddressMiddleware;
/**
 * Middleware to validate patient data for Sudan
 */
const validateSudanPatientData = (req, res, next) => {
    const errors = [];
    // Validate Sudan National ID
    if (req.body.sudan_national_id || req.body.sudanNationalId) {
        const nationalId = req.body.sudan_national_id || req.body.sudanNationalId;
        if (!(0, sudanValidation_1.isValidSudanNationalId)(nationalId)) {
            errors.push(sudanValidation_1.NATIONAL_ID_VALIDATION_MESSAGES.INVALID_FORMAT);
        }
    }
    // Validate phone number
    if (req.body.phone) {
        if (!(0, sudanValidation_1.isValidSudanMobile)(req.body.phone)) {
            errors.push(sudanValidation_1.PHONE_VALIDATION_MESSAGES.INVALID_FORMAT);
        }
    }
    // Validate emergency contact phone
    if (req.body.emergency_contact_phone || req.body.emergencyContactPhone) {
        const emergencyPhone = req.body.emergency_contact_phone || req.body.emergencyContactPhone;
        if (!(0, sudanValidation_1.isValidSudanMobile)(emergencyPhone)) {
            errors.push(`Emergency contact ${sudanValidation_1.PHONE_VALIDATION_MESSAGES.INVALID_FORMAT}`);
        }
    }
    // Validate address if provided
    if (req.body.state || req.body.city || req.body.address_line1) {
        const address = {
            addressLine1: req.body.address_line1 || req.body.addressLine1,
            addressLine2: req.body.address_line2 || req.body.addressLine2,
            city: req.body.city,
            state: req.body.state,
            postalCode: req.body.postal_code || req.body.postalCode,
            country: req.body.country || 'Sudan'
        };
        const addressValidation = (0, sudanValidation_1.validateSudanAddress)(address);
        if (!addressValidation.isValid) {
            errors.push(...addressValidation.errors);
        }
    }
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors
        });
    }
    // Set default values for Sudan
    req.body.country = 'Sudan';
    req.body.primary_language = req.body.primary_language || 'Arabic';
    next();
};
exports.validateSudanPatientData = validateSudanPatientData;
/**
 * Middleware to validate facility data for Sudan
 */
const validateSudanFacilityData = (req, res, next) => {
    const errors = [];
    // Validate phone number
    if (req.body.phone) {
        if (!(0, sudanValidation_1.isValidSudanMobile)(req.body.phone)) {
            errors.push(sudanValidation_1.PHONE_VALIDATION_MESSAGES.INVALID_FORMAT);
        }
    }
    // Validate fax if provided
    if (req.body.fax && !(0, sudanValidation_1.isValidSudanMobile)(req.body.fax)) {
        errors.push(`Fax ${sudanValidation_1.PHONE_VALIDATION_MESSAGES.INVALID_FORMAT}`);
    }
    // Validate address
    const address = {
        addressLine1: req.body.address_line1 || req.body.addressLine1,
        addressLine2: req.body.address_line2 || req.body.addressLine2,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postal_code || req.body.postalCode,
        country: req.body.country || 'Sudan'
    };
    const addressValidation = (0, sudanValidation_1.validateSudanAddress)(address);
    if (!addressValidation.isValid) {
        errors.push(...addressValidation.errors);
    }
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors
        });
    }
    // Set default values for Sudan
    req.body.country = 'Sudan';
    req.body.timezone = req.body.timezone || 'Africa/Khartoum';
    next();
};
exports.validateSudanFacilityData = validateSudanFacilityData;
exports.default = {
    validateSudanPhone: exports.validateSudanPhone,
    validateSudanNationalId: exports.validateSudanNationalId,
    validateSudanAddressMiddleware: exports.validateSudanAddressMiddleware,
    validateSudanPatientData: exports.validateSudanPatientData,
    validateSudanFacilityData: exports.validateSudanFacilityData
};
//# sourceMappingURL=sudanValidationMiddleware.js.map