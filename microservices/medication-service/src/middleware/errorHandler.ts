import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom Error Classes
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

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, false);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, statusCode: number = 503) {
    super(message, statusCode, false);
  }
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // If it's an AppError, use its values
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else {
    // Standard Error
    message = err.message || message;
  }

  // Log error
  if (statusCode >= 500 || !isOperational) {
    logger.error('Server error', {
      error: message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.userId,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      error: message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.userId,
      statusCode,
    });
  }

  // Don't leak error details in production
  const responseMessage =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : message;

  res.status(statusCode).json({
    success: false,
    error: {
      message: responseMessage,
      code: statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  throw new NotFoundError(`Route ${req.originalUrl} not found`);
}

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
};

