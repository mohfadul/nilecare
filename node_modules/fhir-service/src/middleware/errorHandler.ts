import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom Error Classes for FHIR Service
 * Returns FHIR OperationOutcome on errors
 */

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class FHIRValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType}/${resourceId} not found`, 404);
  }
}

export class OperationNotSupportedError extends AppError {
  constructor(operation: string) {
    super(`Operation ${operation} is not supported`, 501);
  }
}

/**
 * Create FHIR OperationOutcome
 */
export function createOperationOutcome(
  severity: 'fatal' | 'error' | 'warning' | 'information',
  code: string,
  diagnostics: string
): any {
  return {
    resourceType: 'OperationOutcome',
    issue: [{
      severity,
      code,
      diagnostics,
    }],
  };
}

/**
 * Global Error Handler for FHIR Service
 * Returns FHIR OperationOutcome instead of standard JSON error
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else {
    message = err.message || message;
  }

  // Log error
  if (statusCode >= 500 || !isOperational) {
    logger.error('Server error', {
      error: message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      error: message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  }

  // Return FHIR OperationOutcome
  const operationOutcome = createOperationOutcome(
    statusCode >= 500 ? 'error' : statusCode >= 400 ? 'error' : 'information',
    statusCode === 404 ? 'not-found' : statusCode === 400 ? 'invalid' : 'exception',
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : message
  );

  res.status(statusCode).json(operationOutcome);
}

/**
 * Async error wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  FHIRValidationError,
  ResourceNotFoundError,
  OperationNotSupportedError,
  createOperationOutcome,
};

