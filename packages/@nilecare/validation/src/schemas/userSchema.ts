/**
 * User Validation Schemas
 * For authentication and user management
 */

import { body, param } from 'express-validator';

export const registerUserValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
  
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .trim(),
  
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'nurse', 'receptionist', 'patient', 'lab_technician', 'pharmacist'])
    .withMessage('Invalid role'),
];

export const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
];

export const updateUserValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isUUID().withMessage('User ID must be a valid UUID'),
  
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .trim(),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters')
    .trim(),
  
  body('email')
    .optional()
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
];

