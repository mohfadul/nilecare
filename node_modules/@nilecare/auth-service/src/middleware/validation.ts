import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Express-validator middleware
 * Validates request and returns errors if any
 */
export function validateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: (err as any).param,
        message: err.msg,
        value: (err as any).value
      }))
    });
    return;
  }

  next();
}

/**
 * Run validation chains
 */
export function runValidation(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    validateRequest(req, res, next);
  };
}

export default {
  validateRequest,
  runValidation
};

