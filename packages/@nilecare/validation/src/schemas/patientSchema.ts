/**
 * Patient Validation Schemas
 * Validates patient-related requests
 */

import { body, param, query } from 'express-validator';

/**
 * Validation for creating a patient
 */
export const createPatientValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .matches(/^[a-zA-Z\s-']+$/).withMessage('First name contains invalid characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .matches(/^[a-zA-Z\s-']+$/).withMessage('Last name contains invalid characters'),
  
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date (ISO 8601)')
    .custom((value) => {
      const age = (new Date().getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 0 || age > 150) {
        throw new Error('Date of birth is invalid (age must be 0-150 years)');
      }
      return true;
    }),
  
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['male', 'female', 'other', 'unknown']).withMessage('Gender must be male, female, other, or unknown'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Phone number must be in E.164 format'),
  
  body('address.street')
    .optional()
    .isLength({ max: 200 }).withMessage('Street address too long'),
  
  body('address.city')
    .optional()
    .isLength({ max: 100 }).withMessage('City name too long'),
  
  body('address.postalCode')
    .optional()
    .isLength({ max: 20 }).withMessage('Postal code too long'),
];

/**
 * Validation for updating a patient
 */
export const updatePatientValidation = [
  param('id')
    .notEmpty().withMessage('Patient ID is required')
    .isUUID().withMessage('Patient ID must be a valid UUID'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Phone number must be in E.164 format'),
];

/**
 * Validation for getting a patient by ID
 */
export const getPatientValidation = [
  param('id')
    .notEmpty().withMessage('Patient ID is required')
    .isUUID().withMessage('Patient ID must be a valid UUID'),
];

/**
 * Validation for listing patients (query params)
 */
export const listPatientsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 }).withMessage('Search query too long'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'deceased']).withMessage('Invalid status'),
];

