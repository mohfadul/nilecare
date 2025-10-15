/**
 * Appointment Validation Schemas
 */

import { body, param, query } from 'express-validator';

export const createAppointmentValidation = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isUUID().withMessage('Patient ID must be a valid UUID'),
  
  body('providerId')
    .notEmpty().withMessage('Provider ID is required')
    .isUUID().withMessage('Provider ID must be a valid UUID'),
  
  body('facilityId')
    .optional()
    .isUUID().withMessage('Facility ID must be a valid UUID'),
  
  body('appointmentDate')
    .notEmpty().withMessage('Appointment date is required')
    .isISO8601().withMessage('Appointment date must be valid ISO 8601 date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();
      if (appointmentDate < now) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'procedure', 'telehealth'])
    .withMessage('Invalid appointment type'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Notes too long (max 1000 characters)'),
];

export const updateAppointmentValidation = [
  param('id')
    .notEmpty().withMessage('Appointment ID is required')
    .isUUID().withMessage('Appointment ID must be a valid UUID'),
  
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'])
    .withMessage('Invalid status'),
  
  body('appointmentDate')
    .optional()
    .isISO8601().withMessage('Appointment date must be valid'),
];

export const listAppointmentsValidation = [
  query('patientId')
    .optional()
    .isUUID().withMessage('Patient ID must be a valid UUID'),
  
  query('providerId')
    .optional()
    .isUUID().withMessage('Provider ID must be a valid UUID'),
  
  query('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'cancelled', 'completed'])
    .withMessage('Invalid status'),
  
  query('date')
    .optional()
    .isISO8601().withMessage('Date must be valid'),
];

