import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

/**
 * Request Validation Middleware
 * Validates request body, query, and params using Joi schemas
 */

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Body: ${detail.message}`)
        );
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Query: ${detail.message}`)
        );
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        validationErrors.push(
          ...error.details.map((detail) => `Params: ${detail.message}`)
        );
      }
    }

    // If there are validation errors, throw ValidationError
    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors.join('; '));
    }

    next();
  };
}

/**
 * Common Joi validation schemas for reuse
 */

export const commonSchemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  optionalUuid: Joi.string().uuid({ version: 'uuidv4' }).optional(),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),

  // Facility ID (required for multi-facility isolation)
  facilityId: Joi.string().uuid({ version: 'uuidv4' }).required(),
};

/**
 * Lab-specific validation schemas
 */

export const labSchemas = {
  // Create lab order
  createLabOrder: {
    body: Joi.object({
      patientId: commonSchemas.uuid,
      providerId: commonSchemas.uuid,
      tests: Joi.array()
        .items(
          Joi.object({
            testId: commonSchemas.uuid,
            priority: Joi.string().valid('routine', 'urgent', 'stat').required(),
            notes: Joi.string().max(1000).optional(),
          })
        )
        .min(1)
        .required(),
      appointmentId: commonSchemas.optionalUuid,
      encounterId: commonSchemas.optionalUuid,
      clinicalNotes: Joi.string().max(2000).optional(),
      diagnosisCode: Joi.string().max(20).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Collect sample
  collectSample: {
    body: Joi.object({
      labOrderId: commonSchemas.uuid,
      sampleType: Joi.string().max(100).required(),
      collectionMethod: Joi.string().max(100).required(),
      collectionSite: Joi.string().max(100).optional(),
      collectedBy: commonSchemas.uuid,
      collectionTime: Joi.date().iso().optional(),
      volume: Joi.number().positive().optional(),
      volumeUnit: Joi.string().max(20).optional(),
      containerType: Joi.string().max(100).optional(),
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Submit result
  submitResult: {
    body: Joi.object({
      labOrderId: commonSchemas.uuid,
      testId: commonSchemas.uuid,
      resultValue: Joi.string().max(500).required(),
      resultUnit: Joi.string().max(50).optional(),
      referenceRange: Joi.string().max(200).optional(),
      flag: Joi.string().valid('normal', 'abnormal', 'critical', 'high', 'low').optional(),
      technician: commonSchemas.uuid,
      performedAt: Joi.date().iso().optional(),
      instrumentId: commonSchemas.optionalUuid,
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Review and release result
  releaseResult: {
    body: Joi.object({
      resultId: commonSchemas.uuid,
      reviewedBy: commonSchemas.uuid,
      reviewNotes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },
};

export default {
  validateRequest,
  commonSchemas,
  labSchemas,
};

