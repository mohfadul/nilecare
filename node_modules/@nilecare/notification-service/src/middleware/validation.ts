/**
 * Validation Middleware
 * Request validation using express-validator
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Validate request and return errors if any
 */
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => {
      if ('param' in err && typeof err.param === 'string') {
        return {
          field: err.param,
          message: err.msg,
          value: req.body[err.param] || req.query[err.param] || req.params[err.param],
        };
      }
      return {
        field: 'unknown',
        message: err.msg,
        value: undefined,
      };
    });

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      user: req.user?.userId,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errorDetails,
      },
    });
    return;
  }

  next();
}

/**
 * Helper to run validation chains
 */
export async function validate(
  validations: ValidationChain[],
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Run all validations
  await Promise.all(validations.map(validation => validation.run(req)));

  // Check for errors
  validateRequest(req, res, next);
}

export default {
  validateRequest,
  validate,
};

