"use strict";
/**
 * Sudan-specific validation utilities for NileCare platform
 * Provides validation for Sudan National ID, mobile numbers, and addresses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUDAN_DEFAULTS = exports.VALIDATION_PATTERNS = exports.ADDRESS_VALIDATION_MESSAGES = exports.NATIONAL_ID_VALIDATION_MESSAGES = exports.PHONE_VALIDATION_MESSAGES = exports.SUDAN_STATES = void 0;
exports.isValidSudanMobile = isValidSudanMobile;
exports.formatSudanMobile = formatSudanMobile;
exports.isValidSudanNationalId = isValidSudanNationalId;
exports.isValidSudanPostalCode = isValidSudanPostalCode;
exports.isValidSudanState = isValidSudanState;
exports.validateSudanAddress = validateSudanAddress;
/**
 * Sudan States (18 states as of current administrative division)
 */
exports.SUDAN_STATES = [
    'Khartoum',
    'Gezira',
    'Red Sea',
    'Kassala',
    'Gedaref',
    'White Nile',
    'Blue Nile',
    'Northern',
    'North Kordofan',
    'South Kordofan',
    'West Kordofan',
    'North Darfur',
    'South Darfur',
    'West Darfur',
    'East Darfur',
    'Central Darfur',
    'River Nile',
    'Sennar'
];
/**
 * Validates Sudan mobile phone number
 * Format: +249xxxxxxxxx (9 digits after country code)
 * Valid prefixes: 9, 1 (mobile operators)
 *
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
function isValidSudanMobile(phone) {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    // Pattern: +249 followed by 9 digits starting with 9 or 1
    const sudanMobilePattern = /^\+249[91]\d{8}$/;
    return sudanMobilePattern.test(cleanPhone);
}
/**
 * Formats Sudan mobile number to standard format
 *
 * @param phone - Phone number to format
 * @returns Formatted phone number (+249 XX XXX XXXX)
 */
function formatSudanMobile(phone) {
    const cleanPhone = phone.replace(/[\s-+]/g, '');
    // If starts with 249, add +
    if (cleanPhone.startsWith('249')) {
        const number = cleanPhone.substring(3);
        return `+249 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    }
    // If starts with 0, replace with +249
    if (cleanPhone.startsWith('0')) {
        const number = cleanPhone.substring(1);
        return `+249 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    }
    return phone;
}
/**
 * Validates Sudan National ID
 * Format: Varies by issuing authority, typically alphanumeric
 * Length: 9-12 characters
 *
 * @param nationalId - National ID to validate
 * @returns boolean indicating if ID is valid
 */
function isValidSudanNationalId(nationalId) {
    // Remove spaces and dashes
    const cleanId = nationalId.replace(/[\s-]/g, '');
    // Sudan National ID is typically 9-12 alphanumeric characters
    const nationalIdPattern = /^[A-Z0-9]{9,12}$/i;
    return nationalIdPattern.test(cleanId);
}
/**
 * Validates Sudan postal code
 * Format: 5 digits (11111 format)
 *
 * @param postalCode - Postal code to validate
 * @returns boolean indicating if postal code is valid
 */
function isValidSudanPostalCode(postalCode) {
    const cleanCode = postalCode.replace(/[\s-]/g, '');
    const postalCodePattern = /^\d{5}$/;
    return postalCodePattern.test(cleanCode);
}
/**
 * Validates if a state is a valid Sudan state
 *
 * @param state - State name to validate
 * @returns boolean indicating if state is valid
 */
function isValidSudanState(state) {
    return exports.SUDAN_STATES.includes(state);
}
/**
 * Validates complete Sudan address
 *
 * @param address - Address object to validate
 * @returns Object with validation result and errors
 */
function validateSudanAddress(address) {
    const errors = [];
    if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
        errors.push('Address line 1 must be at least 5 characters');
    }
    if (!address.city || address.city.trim().length < 2) {
        errors.push('City is required');
    }
    if (!address.state) {
        errors.push('State is required');
    }
    else if (!isValidSudanState(address.state)) {
        errors.push(`Invalid Sudan state. Must be one of: ${exports.SUDAN_STATES.join(', ')}`);
    }
    if (address.postalCode && !isValidSudanPostalCode(address.postalCode)) {
        errors.push('Postal code must be 5 digits');
    }
    if (address.country && address.country !== 'Sudan') {
        errors.push('Country must be Sudan');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Phone validation error messages
 */
exports.PHONE_VALIDATION_MESSAGES = {
    INVALID_FORMAT: 'Phone number must be in Sudan format: +249xxxxxxxxx',
    INVALID_PREFIX: 'Phone number must start with +249 followed by 9 or 1',
    INVALID_LENGTH: 'Phone number must have 9 digits after country code (+249)',
    REQUIRED: 'Phone number is required'
};
/**
 * National ID validation error messages
 */
exports.NATIONAL_ID_VALIDATION_MESSAGES = {
    INVALID_FORMAT: 'Sudan National ID must be 9-12 alphanumeric characters',
    REQUIRED: 'Sudan National ID is required',
    ALREADY_EXISTS: 'This Sudan National ID is already registered'
};
/**
 * Address validation error messages
 */
exports.ADDRESS_VALIDATION_MESSAGES = {
    INVALID_STATE: 'Please select a valid Sudan state',
    INVALID_POSTAL_CODE: 'Postal code must be 5 digits',
    REQUIRED_FIELD: 'This field is required'
};
/**
 * Regex patterns for validation
 */
exports.VALIDATION_PATTERNS = {
    SUDAN_MOBILE: /^\+249[91]\d{8}$/,
    SUDAN_NATIONAL_ID: /^[A-Z0-9]{9,12}$/i,
    SUDAN_POSTAL_CODE: /^\d{5}$/
};
/**
 * Default values for Sudan
 */
exports.SUDAN_DEFAULTS = {
    COUNTRY: 'Sudan',
    TIMEZONE: 'Africa/Khartoum',
    LOCALE: 'ar_SD',
    CURRENCY: 'SDG',
    PRIMARY_LANGUAGE: 'Arabic',
    SECONDARY_LANGUAGE: 'English'
};
exports.default = {
    SUDAN_STATES: exports.SUDAN_STATES,
    isValidSudanMobile,
    formatSudanMobile,
    isValidSudanNationalId,
    isValidSudanPostalCode,
    isValidSudanState,
    validateSudanAddress,
    PHONE_VALIDATION_MESSAGES: exports.PHONE_VALIDATION_MESSAGES,
    NATIONAL_ID_VALIDATION_MESSAGES: exports.NATIONAL_ID_VALIDATION_MESSAGES,
    ADDRESS_VALIDATION_MESSAGES: exports.ADDRESS_VALIDATION_MESSAGES,
    VALIDATION_PATTERNS: exports.VALIDATION_PATTERNS,
    SUDAN_DEFAULTS: exports.SUDAN_DEFAULTS
};
//# sourceMappingURL=sudanValidation.js.map