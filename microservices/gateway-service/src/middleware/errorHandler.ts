/**
 * Error Handling Middleware
 * Centralized error handling for the gateway service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log the error
  logger.error('Request error', {
    error: message,
    code: errorCode,
    statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    stack: err.stack,
    details: err.details,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(isDevelopment && { stack: err.stack }),
      ...(err.details && { details: err.details }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

// Create custom error classes
export class BadRequestError extends Error implements ApiError {
  statusCode = 400;
  code = 'BAD_REQUEST';
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error implements ApiError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements ApiError {
  statusCode = 403;
  code = 'FORBIDDEN';
  
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends Error implements ApiError {
  statusCode = 503;
  code = 'SERVICE_UNAVAILABLE';
  
  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

