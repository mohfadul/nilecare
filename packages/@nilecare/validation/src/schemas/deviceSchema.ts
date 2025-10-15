/**
 * Device Validation Schemas
 * For medical device management
 */

import { body, param } from 'express-validator';

export const registerDeviceValidation = [
  body('deviceId')
    .notEmpty().withMessage('Device ID is required')
    .isLength({ min: 3, max: 50 }).withMessage('Device ID must be 3-50 characters')
    .matches(/^[A-Z0-9-]+$/).withMessage('Device ID must be uppercase alphanumeric with hyphens'),
  
  body('name')
    .notEmpty().withMessage('Device name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Device name must be 3-100 characters'),
  
  body('type')
    .notEmpty().withMessage('Device type is required')
    .isIn(['vital_signs', 'imaging', 'diagnostic', 'monitoring', 'therapeutic'])
    .withMessage('Invalid device type'),
  
  body('manufacturer')
    .notEmpty().withMessage('Manufacturer is required')
    .isLength({ max: 100 }).withMessage('Manufacturer name too long'),
  
  body('model')
    .notEmpty().withMessage('Model is required')
    .isLength({ max: 100 }).withMessage('Model name too long'),
  
  body('serialNumber')
    .optional()
    .isLength({ max: 100 }).withMessage('Serial number too long'),
  
  body('facilityId')
    .notEmpty().withMessage('Facility ID is required')
    .isUUID().withMessage('Facility ID must be a valid UUID'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'retired'])
    .withMessage('Invalid device status'),
];

export const submitVitalSignsValidation = [
  body('deviceId')
    .notEmpty().withMessage('Device ID is required')
    .isLength({ min: 3, max: 50 }).withMessage('Device ID must be 3-50 characters'),
  
  body('patientId')
    .optional()
    .isUUID().withMessage('Patient ID must be a valid UUID'),
  
  body('timestamp')
    .optional()
    .isISO8601().withMessage('Timestamp must be valid ISO 8601 date'),
  
  body('measurements')
    .notEmpty().withMessage('Measurements are required')
    .isObject().withMessage('Measurements must be an object'),
  
  body('measurements.heartRate')
    .optional()
    .isInt({ min: 20, max: 250 }).withMessage('Heart rate must be 20-250 bpm'),
  
  body('measurements.bloodPressure.systolic')
    .optional()
    .isInt({ min: 50, max: 250 }).withMessage('Systolic BP must be 50-250 mmHg'),
  
  body('measurements.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 30, max: 150 }).withMessage('Diastolic BP must be 30-150 mmHg'),
  
  body('measurements.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 }).withMessage('Temperature must be 30-45°C'),
  
  body('measurements.oxygenSaturation')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Oxygen saturation must be 0-100%'),
];

export const updateDeviceStatusValidation = [
  param('deviceId')
    .notEmpty().withMessage('Device ID is required'),
  
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['active', 'inactive', 'maintenance', 'retired'])
    .withMessage('Invalid status'),
];

