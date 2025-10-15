import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError, createOperationOutcome } from './errorHandler';

/**
 * Validation Middleware for FHIR Service
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
    
    // Return FHIR OperationOutcome for validation errors
    const operationOutcome = createOperationOutcome(
      'error',
      'invalid',
      `Validation failed: ${errorMessages.join(', ')}`
    );
    
    return res.status(400).json(operationOutcome);
  }
  
  next();
}

export default validateRequest;

