/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

/**
 * Validate request body against schema
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace body with validated value
    req.body = value;
    next();
  };
};

/**
 * Validate required fields
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return next(
        new ValidationError('Missing required fields', {
          fields: missing,
        })
      );
    }

    next();
  };
};

/**
 * Validate UUID format
 */
export const validateUUID = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[field] || req.body[field];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (value && !uuidRegex.test(value)) {
      return next(new ValidationError(`Invalid UUID format for field: ${field}`));
    }

    next();
  };
};

/**
 * Validate date format
 */
export const validateDate = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[field];
    if (value && isNaN(Date.parse(value))) {
      return next(new ValidationError(`Invalid date format for field: ${field}`));
    }
    next();
  };
};

