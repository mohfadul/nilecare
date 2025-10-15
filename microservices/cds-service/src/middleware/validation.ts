/**
 * Clinical Decision Support Service - Validation Middleware
 * 
 * Request validation using Joi for clinical data
 * Based on Clinical Service validation patterns
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

/**
 * Validate request against Joi schema
 */
export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      const validationError = createError('Validation Error', 400, 'VALIDATION_ERROR');
      validationError.message = errors.join('; ');
      return next(validationError);
    }

    next();
  };
};

/**
 * Common validation schemas for CDS Service
 */
export const schemas = {
  // UUID parameter validation
  id: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'severity', 'riskScore').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Medication object schema
  medication: Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().required(),
    dose: Joi.string().required(),
    frequency: Joi.string().required(),
    route: Joi.string().valid('oral', 'IV', 'IM', 'SC', 'topical', 'inhalation').optional(),
    rxNormCode: Joi.string().optional()
  }),

  // Allergy object schema
  allergy: Joi.object({
    allergen: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe', 'life-threatening').required(),
    reaction: Joi.string().optional(),
    onsetDate: Joi.date().optional()
  }),

  // Condition object schema
  condition: Joi.object({
    code: Joi.string().required(), // ICD-10 code
    name: Joi.string().required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
    diagnosedDate: Joi.date().optional()
  }),

  // Medication safety check request
  medicationSafetyCheck: Joi.object({
    patientId: Joi.string().uuid().required(),
    medications: Joi.array().items(Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().required(),
      dose: Joi.string().required(),
      frequency: Joi.string().required(),
      route: Joi.string().optional(),
      rxNormCode: Joi.string().optional()
    })).min(1).required(),
    allergies: Joi.array().items(Joi.string()).default([]),
    conditions: Joi.array().items(Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required()
    })).default([]),
    patientAge: Joi.number().integer().min(0).max(150).optional(),
    patientWeight: Joi.number().positive().optional(), // in kg
    renalFunction: Joi.number().positive().optional(), // GFR
    hepaticFunction: Joi.string().valid('normal', 'mild', 'moderate', 'severe').optional()
  }),

  // Drug interaction check request
  drugInteractionCheck: Joi.object({
    medications: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      rxNormCode: Joi.string().optional()
    })).min(2).max(20).required()
  }),

  // Allergy check request
  allergyCheck: Joi.object({
    patientId: Joi.string().uuid().required(),
    medication: Joi.object({
      name: Joi.string().required(),
      rxNormCode: Joi.string().optional()
    }).required(),
    allergies: Joi.array().items(Joi.string()).min(1).required()
  }),

  // Dose validation request
  doseValidation: Joi.object({
    patientId: Joi.string().uuid().required(),
    medication: Joi.object({
      name: Joi.string().required(),
      dose: Joi.string().required(),
      frequency: Joi.string().required(),
      route: Joi.string().optional()
    }).required(),
    patientAge: Joi.number().integer().min(0).max(150).optional(),
    patientWeight: Joi.number().positive().optional(),
    renalFunction: Joi.number().positive().optional(),
    hepaticFunction: Joi.string().valid('normal', 'mild', 'moderate', 'severe').optional()
  }),

  // Contraindication check request
  contraindicationCheck: Joi.object({
    medication: Joi.object({
      name: Joi.string().required(),
      rxNormCode: Joi.string().optional()
    }).required(),
    conditions: Joi.array().items(Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required()
    })).min(1).required()
  })
};

/**
 * Validate medication data
 */
export function validateMedication(medication: any): boolean {
  const { error } = schemas.medication.validate(medication);
  return !error;
}

/**
 * Sanitize error message (remove any potential PHI)
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove common PHI patterns
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{10}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\bMRN[-:]\s*\d+/gi, // Medical record numbers
  ];

  let sanitized = message;
  phiPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

export default validateRequest;

