/**
 * Express middleware for Sudan-specific validation
 */

import { Request, Response, NextFunction } from 'express';
import {
  isValidSudanMobile,
  isValidSudanNationalId,
  validateSudanAddress,
  PHONE_VALIDATION_MESSAGES,
  NATIONAL_ID_VALIDATION_MESSAGES,
  ADDRESS_VALIDATION_MESSAGES,
  SudanAddress
} from '../utils/sudanValidation';

/**
 * Middleware to validate Sudan mobile phone number
 */
export const validateSudanPhone = (field: string = 'phone') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const phone = req.body[field];
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: PHONE_VALIDATION_MESSAGES.REQUIRED,
        field
      });
    }
    
    if (!isValidSudanMobile(phone)) {
      return res.status(400).json({
        success: false,
        error: PHONE_VALIDATION_MESSAGES.INVALID_FORMAT,
        field,
        example: '+249912345678'
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate Sudan National ID
 */
export const validateSudanNationalId = (field: string = 'sudan_national_id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const nationalId = req.body[field] || req.body.sudanNationalId;
    
    if (!nationalId) {
      return res.status(400).json({
        success: false,
        error: NATIONAL_ID_VALIDATION_MESSAGES.REQUIRED,
        field
      });
    }
    
    if (!isValidSudanNationalId(nationalId)) {
      return res.status(400).json({
        success: false,
        error: NATIONAL_ID_VALIDATION_MESSAGES.INVALID_FORMAT,
        field
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate Sudan address
 */
export const validateSudanAddressMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const address: Partial<SudanAddress> = {
    addressLine1: req.body.address_line1 || req.body.addressLine1,
    addressLine2: req.body.address_line2 || req.body.addressLine2,
    city: req.body.city,
    state: req.body.state,
    postalCode: req.body.postal_code || req.body.postalCode,
    country: req.body.country || 'Sudan'
  };
  
  const validation = validateSudanAddress(address);
  
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

/**
 * Middleware to validate patient data for Sudan
 */
export const validateSudanPatientData = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];
  
  // Validate Sudan National ID
  if (req.body.sudan_national_id || req.body.sudanNationalId) {
    const nationalId = req.body.sudan_national_id || req.body.sudanNationalId;
    if (!isValidSudanNationalId(nationalId)) {
      errors.push(NATIONAL_ID_VALIDATION_MESSAGES.INVALID_FORMAT);
    }
  }
  
  // Validate phone number
  if (req.body.phone) {
    if (!isValidSudanMobile(req.body.phone)) {
      errors.push(PHONE_VALIDATION_MESSAGES.INVALID_FORMAT);
    }
  }
  
  // Validate emergency contact phone
  if (req.body.emergency_contact_phone || req.body.emergencyContactPhone) {
    const emergencyPhone = req.body.emergency_contact_phone || req.body.emergencyContactPhone;
    if (!isValidSudanMobile(emergencyPhone)) {
      errors.push(`Emergency contact ${PHONE_VALIDATION_MESSAGES.INVALID_FORMAT}`);
    }
  }
  
  // Validate address if provided
  if (req.body.state || req.body.city || req.body.address_line1) {
    const address: Partial<SudanAddress> = {
      addressLine1: req.body.address_line1 || req.body.addressLine1,
      addressLine2: req.body.address_line2 || req.body.addressLine2,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postal_code || req.body.postalCode,
      country: req.body.country || 'Sudan'
    };
    
    const addressValidation = validateSudanAddress(address);
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

/**
 * Middleware to validate facility data for Sudan
 */
export const validateSudanFacilityData = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];
  
  // Validate phone number
  if (req.body.phone) {
    if (!isValidSudanMobile(req.body.phone)) {
      errors.push(PHONE_VALIDATION_MESSAGES.INVALID_FORMAT);
    }
  }
  
  // Validate fax if provided
  if (req.body.fax && !isValidSudanMobile(req.body.fax)) {
    errors.push(`Fax ${PHONE_VALIDATION_MESSAGES.INVALID_FORMAT}`);
  }
  
  // Validate address
  const address: Partial<SudanAddress> = {
    addressLine1: req.body.address_line1 || req.body.addressLine1,
    addressLine2: req.body.address_line2 || req.body.addressLine2,
    city: req.body.city,
    state: req.body.state,
    postalCode: req.body.postal_code || req.body.postalCode,
    country: req.body.country || 'Sudan'
  };
  
  const addressValidation = validateSudanAddress(address);
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

export default {
  validateSudanPhone,
  validateSudanNationalId,
  validateSudanAddressMiddleware,
  validateSudanPatientData,
  validateSudanFacilityData
};
