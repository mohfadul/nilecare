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

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map((detail) => `Body: ${detail.message}`));
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map((detail) => `Query: ${detail.message}`));
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map((detail) => `Params: ${detail.message}`));
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors.join('; '));
    }

    next();
  };
}

/**
 * Common schemas
 */
export const commonSchemas = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),
  optionalUuid: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  facilityId: Joi.string().uuid({ version: 'uuidv4' }).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Inventory-specific schemas
 */
export const inventorySchemas = {
  // Reserve stock
  reserveStock: {
    body: Joi.object({
      itemId: commonSchemas.uuid,
      quantity: Joi.number().integer().min(1).required(),
      reservationType: Joi.string().valid('medication_dispense', 'procedure', 'transfer', 'other').required(),
      reference: Joi.string().max(255).required(),
      expiresInMinutes: Joi.number().integer().min(1).max(1440).default(30),
      batchNumber: Joi.string().max(100).optional(),
      facilityId: commonSchemas.facilityId,
      locationId: commonSchemas.optionalUuid,
    }),
  },

  // Commit reservation
  commitReservation: {
    body: Joi.object({
      reservationId: commonSchemas.uuid,
      actualQuantity: Joi.number().integer().min(1).optional(),
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Rollback reservation
  rollbackReservation: {
    body: Joi.object({
      reservationId: commonSchemas.uuid,
      reason: Joi.string().max(500).required(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Stock receipt
  receiveStock: {
    body: Joi.object({
      itemId: commonSchemas.uuid,
      quantity: Joi.number().integer().min(1).required(),
      batchNumber: Joi.string().max(100).required(),
      expiryDate: Joi.date().greater('now').required(),
      locationId: commonSchemas.uuid,
      supplierId: commonSchemas.optionalUuid,
      purchaseOrderReference: Joi.string().max(100).optional(),
      unitCost: Joi.number().positive().optional(),
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Stock adjustment
  adjustStock: {
    body: Joi.object({
      itemId: commonSchemas.uuid,
      quantityChange: Joi.number().integer().required(), // can be negative
      reason: Joi.string().valid('damage', 'expiry', 'theft', 'loss', 'count_correction', 'return', 'other').required(),
      reasonDetails: Joi.string().max(1000).optional(),
      batchNumber: Joi.string().max(100).optional(),
      locationId: commonSchemas.uuid,
      facilityId: commonSchemas.facilityId,
    }),
  },

  // Stock transfer
  transferStock: {
    body: Joi.object({
      itemId: commonSchemas.uuid,
      quantity: Joi.number().integer().min(1).required(),
      fromLocationId: commonSchemas.uuid,
      toLocationId: commonSchemas.uuid,
      batchNumber: Joi.string().max(100).optional(),
      notes: Joi.string().max(1000).optional(),
      facilityId: commonSchemas.facilityId,
    }),
  },
};

export default {
  validateRequest,
  commonSchemas,
  inventorySchemas,
};

