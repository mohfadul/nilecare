/**
 * @nilecare/error-handler
 * 
 * Standardized error handling for NileCare microservices.
 * Provides consistent error responses across all services.
 * 
 * Usage:
 * ```typescript
 * import { ApiError, createErrorHandler } from '@nilecare/error-handler';
 * import { createLogger } from '@nilecare/logger';
 * 
 * const logger = createLogger('my-service');
 * 
 * // In your routes
 * if (!user) {
 *   throw new ApiError('NOT_FOUND', 'User not found', 404);
 * }
 * 
 * // In Express app
 * app.use(createErrorHandler(logger));
 * ```
 */

/**
 * Standard error codes used across NileCare platform
 */
export enum ErrorCode {
  // Authentication & Authorization (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  
  // External Services (502, 503, 504)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  
  // Database (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Generic (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * API Error class - throw this in your route handlers
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: string | ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Pre-defined error creators for common scenarios
 */
export const Errors = {
  notFound: (resource: string, id?: string) =>
    new ApiError(
      ErrorCode.NOT_FOUND,
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`,
      404
    ),

  unauthorized: (message: string = 'Authentication required') =>
    new ApiError(ErrorCode.UNAUTHORIZED, message, 401),

  forbidden: (message: string = 'Access denied') =>
    new ApiError(ErrorCode.FORBIDDEN, message, 403),

  invalidToken: (message: string = 'Invalid or expired token') =>
    new ApiError(ErrorCode.INVALID_TOKEN, message, 401),

  validation: (message: string, details?: any) =>
    new ApiError(ErrorCode.VALIDATION_ERROR, message, 400, details),

  conflict: (message: string) =>
    new ApiError(ErrorCode.CONFLICT, message, 409),

  serviceUnavailable: (serviceName: string) =>
    new ApiError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${serviceName} is currently unavailable`,
      503
    ),

  rateLimitExceeded: (message: string = 'Too many requests') =>
    new ApiError(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429),

  internal: (message: string = 'An internal error occurred', details?: any) =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message, 500, details, false)
};

/**
 * Express error handling middleware
 */
export function createErrorHandler(logger?: any) {
  return (err: any, req: any, res: any, next: any) => {
    // Handle ApiError instances
    if (err instanceof ApiError) {
      if (logger) {
        logger.error(`API Error: ${err.message}`, {
          code: err.code,
          statusCode: err.statusCode,
          details: err.details,
          path: req.path,
          method: req.method,
          ip: req.ip,
          userId: req.user?.userId
        });
      }

      return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle validation errors from libraries (e.g., Joi, express-validator)
    if (err.name === 'ValidationError') {
      if (logger) {
        logger.warn('Validation error', { error: err.message, path: req.path });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: err.message,
          details: err.details || err.errors
        },
        timestamp: new Date().toISOString()
      });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      if (logger) {
        logger.warn('JWT error', { error: err.message, path: req.path });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.INVALID_TOKEN,
          message: 'Invalid or expired token'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Handle unknown/unhandled errors
    if (logger) {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    } else {
      console.error('Unhandled error:', err);
    }

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err.message;

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message
      },
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler (404)
 */
export function notFoundHandler() {
  return (req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `Route ${req.method} ${req.path} not found`
      },
      timestamp: new Date().toISOString()
    });
  };
}

export default { ApiError, Errors, createErrorHandler, asyncHandler, notFoundHandler };

