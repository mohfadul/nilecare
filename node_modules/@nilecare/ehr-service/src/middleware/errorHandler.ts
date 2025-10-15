/**
 * EHR Service - Error Handler Middleware
 * 
 * HIPAA-compliant error handling for clinical documentation
 * Never expose PHI (Protected Health Information) in error messages
 * 
 * Based on Clinical Service and CDS Service patterns
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err;

  // Log error with context (but NEVER log PHI)
  logger.error({
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      // Don't log headers (may contain tokens)
      // Don't log body (may contain PHI - patient names, medical data, etc.)
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('user-agent')
    },
    user: {
      userId: (req as any).user?.userId || 'unauthenticated',
      role: (req as any).user?.role || 'none',
      facilityId: (req as any).user?.facilityId || 'none'
    }
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.name === 'MongoError' && (err as any).code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // PostgreSQL errors
  if ((err as any).code === '23505') { // Unique violation
    statusCode = 400;
    message = 'Duplicate entry';
  }

  if ((err as any).code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Referenced record does not exist';
  }

  if ((err as any).code === '23502') { // Not null violation
    statusCode = 400;
    message = 'Required field missing';
  }

  // Document-specific errors
  if ((err as any).code === 'DOCUMENT_LOCKED') {
    statusCode = 409;
    message = 'Document is locked by another user';
  }

  if ((err as any).code === 'DOCUMENT_FINALIZED') {
    statusCode = 409;
    message = 'Cannot modify finalized document. Create an amendment instead.';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    message = 'An error occurred while processing your request';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Create custom error
 */
export const createError = (
  message: string, 
  statusCode: number = 500, 
  code?: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.code = code;
  return error;
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error handler
 */
export const asyncHandler = (fn: Function) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Not found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Document finalization guard
 * Prevents modifications to finalized documents
 */
export const requireUnfinalized = (documentType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = req.params.id || req.params.documentId;
      
      // This would check if document is finalized in the database
      // For now, we'll add a placeholder
      // In actual implementation, query the database to check finalized status
      
      // const isFinalized = await checkDocumentFinalized(documentId, documentType);
      // if (isFinalized) {
      //   throw createError('Cannot modify finalized document', 409, 'DOCUMENT_FINALIZED');
      // }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default errorHandler;

