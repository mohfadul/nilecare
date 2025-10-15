/**
 * Sudan-specific validation utilities for NileCare platform
 * Provides validation for Sudan National ID, mobile numbers, and addresses
 */
/**
 * Sudan States (18 states as of current administrative division)
 */
export declare const SUDAN_STATES: readonly ["Khartoum", "Gezira", "Red Sea", "Kassala", "Gedaref", "White Nile", "Blue Nile", "Northern", "North Kordofan", "South Kordofan", "West Kordofan", "North Darfur", "South Darfur", "West Darfur", "East Darfur", "Central Darfur", "River Nile", "Sennar"];
export type SudanState = typeof SUDAN_STATES[number];
/**
 * Validates Sudan mobile phone number
 * Format: +249xxxxxxxxx (9 digits after country code)
 * Valid prefixes: 9, 1 (mobile operators)
 *
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
export declare function isValidSudanMobile(phone: string): boolean;
/**
 * Formats Sudan mobile number to standard format
 *
 * @param phone - Phone number to format
 * @returns Formatted phone number (+249 XX XXX XXXX)
 */
export declare function formatSudanMobile(phone: string): string;
/**
 * Validates Sudan National ID
 * Format: Varies by issuing authority, typically alphanumeric
 * Length: 9-12 characters
 *
 * @param nationalId - National ID to validate
 * @returns boolean indicating if ID is valid
 */
export declare function isValidSudanNationalId(nationalId: string): boolean;
/**
 * Validates Sudan postal code
 * Format: 5 digits (11111 format)
 *
 * @param postalCode - Postal code to validate
 * @returns boolean indicating if postal code is valid
 */
export declare function isValidSudanPostalCode(postalCode: string): boolean;
/**
 * Validates if a state is a valid Sudan state
 *
 * @param state - State name to validate
 * @returns boolean indicating if state is valid
 */
export declare function isValidSudanState(state: string): boolean;
/**
 * Address validation for Sudan
 */
export interface SudanAddress {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: SudanState;
    postalCode?: string;
    country: string;
}
/**
 * Validates complete Sudan address
 *
 * @param address - Address object to validate
 * @returns Object with validation result and errors
 */
export declare function validateSudanAddress(address: Partial<SudanAddress>): {
    isValid: boolean;
    errors: string[];
};
/**
 * Phone validation error messages
 */
export declare const PHONE_VALIDATION_MESSAGES: {
    INVALID_FORMAT: string;
    INVALID_PREFIX: string;
    INVALID_LENGTH: string;
    REQUIRED: string;
};
/**
 * National ID validation error messages
 */
export declare const NATIONAL_ID_VALIDATION_MESSAGES: {
    INVALID_FORMAT: string;
    REQUIRED: string;
    ALREADY_EXISTS: string;
};
/**
 * Address validation error messages
 */
export declare const ADDRESS_VALIDATION_MESSAGES: {
    INVALID_STATE: string;
    INVALID_POSTAL_CODE: string;
    REQUIRED_FIELD: string;
};
/**
 * Regex patterns for validation
 */
export declare const VALIDATION_PATTERNS: {
    SUDAN_MOBILE: RegExp;
    SUDAN_NATIONAL_ID: RegExp;
    SUDAN_POSTAL_CODE: RegExp;
};
/**
 * Default values for Sudan
 */
export declare const SUDAN_DEFAULTS: {
    COUNTRY: string;
    TIMEZONE: string;
    LOCALE: string;
    CURRENCY: string;
    PRIMARY_LANGUAGE: string;
    SECONDARY_LANGUAGE: string;
};
declare const _default: {
    SUDAN_STATES: readonly ["Khartoum", "Gezira", "Red Sea", "Kassala", "Gedaref", "White Nile", "Blue Nile", "Northern", "North Kordofan", "South Kordofan", "West Kordofan", "North Darfur", "South Darfur", "West Darfur", "East Darfur", "Central Darfur", "River Nile", "Sennar"];
    isValidSudanMobile: typeof isValidSudanMobile;
    formatSudanMobile: typeof formatSudanMobile;
    isValidSudanNationalId: typeof isValidSudanNationalId;
    isValidSudanPostalCode: typeof isValidSudanPostalCode;
    isValidSudanState: typeof isValidSudanState;
    validateSudanAddress: typeof validateSudanAddress;
    PHONE_VALIDATION_MESSAGES: {
        INVALID_FORMAT: string;
        INVALID_PREFIX: string;
        INVALID_LENGTH: string;
        REQUIRED: string;
    };
    NATIONAL_ID_VALIDATION_MESSAGES: {
        INVALID_FORMAT: string;
        REQUIRED: string;
        ALREADY_EXISTS: string;
    };
    ADDRESS_VALIDATION_MESSAGES: {
        INVALID_STATE: string;
        INVALID_POSTAL_CODE: string;
        REQUIRED_FIELD: string;
    };
    VALIDATION_PATTERNS: {
        SUDAN_MOBILE: RegExp;
        SUDAN_NATIONAL_ID: RegExp;
        SUDAN_POSTAL_CODE: RegExp;
    };
    SUDAN_DEFAULTS: {
        COUNTRY: string;
        TIMEZONE: string;
        LOCALE: string;
        CURRENCY: string;
        PRIMARY_LANGUAGE: string;
        SECONDARY_LANGUAGE: string;
    };
};
export default _default;
//# sourceMappingURL=sudanValidation.d.ts.map