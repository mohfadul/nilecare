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
 * Medication-specific validation schemas
 */

export const medicationSchemas = {
  // Create medication
  createMedication: {
    body: Joi.object({
      name: Joi.string().min(2).max(255).required(),
      genericName: Joi.string().min(2).max(255).optional(),
      brandName: Joi.string().min(2).max(255).optional(),
      dosageForm: Joi.string()
        .valid('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'inhaler', 'drops', 'patch', 'other')
        .required(),
      strength: Joi.string().max(100).required(),
      unit: Joi.string().max(50).required(),
      manufacturer: Joi.string().max(255).optional(),
      description: Joi.string().max(1000).optional(),
      category: Joi.string().max(100).optional(),
      isHighAlert: Joi.boolean().default(false),
      requiresRefrigeration: Joi.boolean().default(false),
      isControlledSubstance: Joi.boolean().default(false),
      controlledSubstanceSchedule: Joi.string().max(10).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Dispense medication
  dispenseMedication: {
    body: Joi.object({
      prescriptionId: commonSchemas.uuid,
      medicationId: commonSchemas.uuid,
      patientId: commonSchemas.uuid,
      quantity: Joi.number().positive().required(),
      batchNumber: Joi.string().max(100).optional(),
      expiryDate: Joi.date().iso().greater('now').optional(),
      instructions: Joi.string().max(1000).optional(),
      dispensedBy: commonSchemas.uuid,
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Administer medication (MAR)
  administerMedication: {
    body: Joi.object({
      patientId: commonSchemas.uuid,
      medicationId: commonSchemas.uuid,
      dosage: Joi.string().max(100).required(),
      route: Joi.string()
        .valid('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal', 'sublingual', 'other')
        .required(),
      administeredBy: commonSchemas.uuid,
      barcodeData: Joi.string().max(500).optional(),
      timestamp: Joi.date().iso().optional(),
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Barcode verification
  verifyBarcode: {
    body: Joi.object({
      barcodeData: Joi.string().max(500).required(),
      medicationId: commonSchemas.uuid,
      patientId: commonSchemas.optionalUuid,
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Medication reconciliation
  reconcileMedications: {
    body: Joi.object({
      patientId: commonSchemas.uuid,
      homeMedications: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            dosage: Joi.string().required(),
            frequency: Joi.string().required(),
            route: Joi.string().required(),
          })
        )
        .required(),
      facilityMedications: Joi.array()
        .items(
          Joi.object({
            medicationId: commonSchemas.uuid,
            dosage: Joi.string().required(),
            frequency: Joi.string().required(),
            route: Joi.string().required(),
          })
        )
        .optional(),
      reconciliationType: Joi.string()
        .valid('admission', 'transfer', 'discharge')
        .required(),
      reconciledBy: commonSchemas.uuid,
      facilityId: commonSchemas.facilityId,
    }),
  },
};

export default {
  validateRequest,
  commonSchemas,
  medicationSchemas,
};

