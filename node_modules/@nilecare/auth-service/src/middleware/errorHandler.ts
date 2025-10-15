import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.id
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details || err.message
    });
    return;
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
    return;
  }

  if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
    res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
    return;
  }

  if (err.name === 'NotFoundError' || err.message === 'Not Found') {
    res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
    return;
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    res.status(409).json({
      success: false,
      error: 'Resource already exists'
    });
    return;
  }

  if (err.code === '23503') { // Foreign key violation
    res.status(400).json({
      success: false,
      error: 'Invalid reference'
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired'
    });
    return;
  }

  // Rate limit error
  if (err.message === 'Too Many Requests') {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
    return;
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details
    })
  });
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
}

export default errorHandler;

