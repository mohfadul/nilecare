/**
 * Error Handler Middleware
 * Global error handling for payment gateway service
 */

import { Request, Response, NextFunction } from 'express';

export class PaymentError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | PaymentError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  console.error('[Error]', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Payment error (custom)
  if (error instanceof PaymentError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
    return;
  }

  // Validation error (Joi)
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: (error as any).details
      }
    });
    return;
  }

  // Database error
  if (error.name === 'QueryFailedError' || (error as any).code?.startsWith('ER_')) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
};

export default errorHandler;

