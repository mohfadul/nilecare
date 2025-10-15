/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized error responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  logger.error('Request error occurred', {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500,
    code: error.code || 'INTERNAL_ERROR',
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user?.userId || 'anonymous',
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Determine status code
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: error.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create custom error
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code: string = 'ERROR'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}

/**
 * Not found error handler (404)
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
    timestamp: new Date().toISOString(),
  });
}

export default {
  errorHandler,
  createError,
  notFoundHandler,
};

