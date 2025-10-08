/**
 * Sudan-specific validation utilities for NileCare platform
 * Provides validation for Sudan National ID, mobile numbers, and addresses
 */

/**
 * Sudan States (18 states as of current administrative division)
 */
export const SUDAN_STATES = [
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
] as const;

export type SudanState = typeof SUDAN_STATES[number];

/**
 * Validates Sudan mobile phone number
 * Format: +249xxxxxxxxx (9 digits after country code)
 * Valid prefixes: 9, 1 (mobile operators)
 * 
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
export function isValidSudanMobile(phone: string): boolean {
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
export function formatSudanMobile(phone: string): string {
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
export function isValidSudanNationalId(nationalId: string): boolean {
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
export function isValidSudanPostalCode(postalCode: string): boolean {
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
export function isValidSudanState(state: string): boolean {
  return SUDAN_STATES.includes(state as SudanState);
}

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
export function validateSudanAddress(address: Partial<SudanAddress>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
    errors.push('Address line 1 must be at least 5 characters');
  }
  
  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required');
  }
  
  if (!address.state) {
    errors.push('State is required');
  } else if (!isValidSudanState(address.state)) {
    errors.push(`Invalid Sudan state. Must be one of: ${SUDAN_STATES.join(', ')}`);
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
export const PHONE_VALIDATION_MESSAGES = {
  INVALID_FORMAT: 'Phone number must be in Sudan format: +249xxxxxxxxx',
  INVALID_PREFIX: 'Phone number must start with +249 followed by 9 or 1',
  INVALID_LENGTH: 'Phone number must have 9 digits after country code (+249)',
  REQUIRED: 'Phone number is required'
};

/**
 * National ID validation error messages
 */
export const NATIONAL_ID_VALIDATION_MESSAGES = {
  INVALID_FORMAT: 'Sudan National ID must be 9-12 alphanumeric characters',
  REQUIRED: 'Sudan National ID is required',
  ALREADY_EXISTS: 'This Sudan National ID is already registered'
};

/**
 * Address validation error messages
 */
export const ADDRESS_VALIDATION_MESSAGES = {
  INVALID_STATE: 'Please select a valid Sudan state',
  INVALID_POSTAL_CODE: 'Postal code must be 5 digits',
  REQUIRED_FIELD: 'This field is required'
};

/**
 * Regex patterns for validation
 */
export const VALIDATION_PATTERNS = {
  SUDAN_MOBILE: /^\+249[91]\d{8}$/,
  SUDAN_NATIONAL_ID: /^[A-Z0-9]{9,12}$/i,
  SUDAN_POSTAL_CODE: /^\d{5}$/
};

/**
 * Default values for Sudan
 */
export const SUDAN_DEFAULTS = {
  COUNTRY: 'Sudan',
  TIMEZONE: 'Africa/Khartoum',
  LOCALE: 'ar_SD',
  CURRENCY: 'SDG',
  PRIMARY_LANGUAGE: 'Arabic',
  SECONDARY_LANGUAGE: 'English'
};

export default {
  SUDAN_STATES,
  isValidSudanMobile,
  formatSudanMobile,
  isValidSudanNationalId,
  isValidSudanPostalCode,
  isValidSudanState,
  validateSudanAddress,
  PHONE_VALIDATION_MESSAGES,
  NATIONAL_ID_VALIDATION_MESSAGES,
  ADDRESS_VALIDATION_MESSAGES,
  VALIDATION_PATTERNS,
  SUDAN_DEFAULTS
};
