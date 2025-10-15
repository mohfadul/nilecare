/**
 * Error Handler Middleware
 * Global error handling for billing service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';

export class BillingError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'BillingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | BillingError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle aborted requests gracefully
  if (error.name === 'BadRequestError' && error.message === 'request aborted') {
    logger.info('Request aborted by client', {
      path: req.path,
      method: req.method
    });
    
    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REQUEST_ABORTED',
          message: 'Request was aborted'
        }
      });
    }
    return;
  }

  // Log error
  logger.error('Request error', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    logger.warn('Cannot send error response - headers already sent');
    return;
  }

  // Billing error (custom)
  if (error instanceof BillingError) {
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
        message: 'Request validation failed',
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

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;

