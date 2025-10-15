/**
 * Payment Validation Schemas
 */

import { body, param } from 'express-validator';

export const initiatePaymentValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
    .custom((value) => {
      // Ensure amount has max 2 decimal places
      if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
        throw new Error('Amount must have at most 2 decimal places');
      }
      return true;
    }),
  
  body('currency')
    .notEmpty().withMessage('Currency is required')
    .isIn(['SDG', 'USD', 'EUR']).withMessage('Currency must be SDG, USD, or EUR'),
  
  body('provider')
    .notEmpty().withMessage('Payment provider is required')
    .isIn(['bank_transfer', 'mobile_money', 'e_wallet'])
    .withMessage('Invalid payment provider'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isLength({ min: 2, max: 50 }).withMessage('Payment method must be 2-50 characters'),
  
  body('invoiceId')
    .optional()
    .isUUID().withMessage('Invoice ID must be a valid UUID'),
  
  body('appointmentId')
    .optional()
    .isUUID().withMessage('Appointment ID must be a valid UUID'),
  
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
];

export const verifyPaymentValidation = [
  body('paymentId')
    .notEmpty().withMessage('Payment ID is required')
    .isUUID().withMessage('Payment ID must be a valid UUID'),
  
  body('verificationCode')
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 4, max: 10 }).withMessage('Verification code must be 4-10 characters'),
];

export const cancelPaymentValidation = [
  param('id')
    .notEmpty().withMessage('Payment ID is required')
    .isUUID().withMessage('Payment ID must be a valid UUID'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason too long (max 500 characters)'),
];

export const refundPaymentValidation = [
  body('paymentId')
    .notEmpty().withMessage('Payment ID is required')
    .isUUID().withMessage('Payment ID must be a valid UUID'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
  
  body('reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Reason too long (max 500 characters)'),
];

