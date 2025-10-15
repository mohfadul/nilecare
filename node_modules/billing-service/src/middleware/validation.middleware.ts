/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';
import { logger } from '../config/logger.config';

/**
 * Validate request body using Joi schema
 */
export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      logger.warn('Request validation failed', {
        path: req.path,
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          }))
        }
      });
      return;
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      logger.warn('Query validation failed', {
        path: req.path,
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * Validate request parameters
 */
export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      logger.warn('Params validation failed', {
        path: req.path,
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'URL parameter validation failed',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
      return;
    }

    req.params = value;
    next();
  };
};

export default { validateBody, validateQuery, validateParams };

