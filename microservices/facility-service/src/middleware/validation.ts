import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './errorHandler';

/**
 * Validation Middleware
 * Validates request data using express-validator
 */

/**
 * Validate request
 * Checks for validation errors from express-validator chains
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      if (err.type === 'field') {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });
    
    throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
  }
  
  next();
}

export default validateRequest;

