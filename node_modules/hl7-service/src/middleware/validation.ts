import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      if (err.type === 'field') {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });
    
    return res.status(400).json({
      success: false,
      error: {
        message: `Validation failed: ${errorMessages.join(', ')}`,
        code: 400,
      },
    });
  }
  
  next();
}

export default validateRequest;

