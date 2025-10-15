import { v4 as uuidv4 } from 'uuid';

/**
 * Standard NileCare API Response Format
 * ALL microservices MUST use this format for consistency
 * 
 * @template T - The data type being returned
 */
export interface NileCareResponse<T = any> {
  /** Indicates if the request was successful */
  success: boolean;
  
  /** The response data (only present on success) */
  data?: T;
  
  /** Error information (only present on failure) */
  error?: {
    /** Machine-readable error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Additional error details (field-level errors, stack trace in dev, etc.) */
    details?: any;
    
    /** HTTP status code */
    statusCode?: number;
  };
  
  /** Metadata about the response */
  metadata: {
    /** ISO 8601 timestamp of response generation */
    timestamp: string;
    
    /** Unique request ID for tracing across services */
    requestId: string;
    
    /** API version */
    version: string;
    
    /** Service that generated the response */
    service?: string;
  };
  
  /** Pagination information (for list endpoints) */
  pagination?: {
    /** Current page number (1-indexed) */
    page: number;
    
    /** Items per page */
    limit: number;
    
    /** Total number of items */
    total: number;
    
    /** Total number of pages */
    pages: number;
    
    /** Has next page */
    hasNext: boolean;
    
    /** Has previous page */
    hasPrevious: boolean;
  };
}

/**
 * Options for creating a response
 */
interface ResponseOptions {
  /** Request ID (if not provided, generates new UUID) */
  requestId?: string;
  
  /** API version (defaults to 'v1') */
  version?: string;
  
  /** Service name */
  service?: string;
}

/**
 * Create a successful API response
 * 
 * @example
 * ```typescript
 * return successResponse({ user: { id: 1, name: 'Ahmed' } });
 * ```
 */
export function successResponse<T>(
  data: T,
  options?: ResponseOptions
): NileCareResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId || uuidv4(),
      version: options?.version || 'v1',
      ...(options?.service && { service: options.service }),
    },
  };
}

/**
 * Create a successful API response with pagination
 * 
 * @example
 * ```typescript
 * return successResponseWithPagination(
 *   { patients: [...] },
 *   { page: 1, limit: 20, total: 150 }
 * );
 * ```
 */
export function successResponseWithPagination<T>(
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  options?: ResponseOptions
): NileCareResponse<T> {
  const pages = Math.ceil(pagination.total / pagination.limit);
  
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId || uuidv4(),
      version: options?.version || 'v1',
      ...(options?.service && { service: options.service }),
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages,
      hasNext: pagination.page < pages,
      hasPrevious: pagination.page > 1,
    },
  };
}

/**
 * Standard error codes used across NileCare services
 */
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business logic errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  EXPIRED = 'EXPIRED',
  
  // Resource-specific errors
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  APPOINTMENT_CONFLICT = 'APPOINTMENT_CONFLICT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PRESCRIPTION_INVALID = 'PRESCRIPTION_INVALID',
}

/**
 * Create an error API response
 * 
 * @example
 * ```typescript
 * return errorResponse(
 *   ErrorCode.NOT_FOUND,
 *   'Patient not found',
 *   { patientId: 123 },
 *   404
 * );
 * ```
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  details?: any,
  statusCode: number = 400,
  options?: ResponseOptions
): NileCareResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      statusCode,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: options?.requestId || uuidv4(),
      version: options?.version || 'v1',
      ...(options?.service && { service: options.service }),
    },
  };
}

/**
 * Create a validation error response
 * 
 * @example
 * ```typescript
 * return validationErrorResponse({
 *   email: ['Invalid email format'],
 *   phone: ['Phone number is required']
 * });
 * ```
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  options?: ResponseOptions
): NileCareResponse<never> {
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    { fields: errors },
    400,
    options
  );
}

/**
 * Create an authentication error response
 */
export function authenticationErrorResponse(
  message: string = 'Authentication required',
  options?: ResponseOptions
): NileCareResponse<never> {
  return errorResponse(
    ErrorCode.AUTHENTICATION_REQUIRED,
    message,
    undefined,
    401,
    options
  );
}

/**
 * Create a permission denied error response
 */
export function permissionDeniedResponse(
  message: string = 'Permission denied',
  requiredPermission?: string,
  options?: ResponseOptions
): NileCareResponse<never> {
  return errorResponse(
    ErrorCode.PERMISSION_DENIED,
    message,
    requiredPermission ? { requiredPermission } : undefined,
    403,
    options
  );
}

/**
 * Create a not found error response
 */
export function notFoundResponse(
  resource: string,
  id?: string | number,
  options?: ResponseOptions
): NileCareResponse<never> {
  return errorResponse(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    id ? { id } : undefined,
    404,
    options
  );
}

/**
 * Create a service unavailable error response
 */
export function serviceUnavailableResponse(
  serviceName: string,
  options?: ResponseOptions
): NileCareResponse<never> {
  return errorResponse(
    ErrorCode.SERVICE_UNAVAILABLE,
    `${serviceName} is currently unavailable`,
    { service: serviceName },
    503,
    options
  );
}

/**
 * Express middleware to add request ID to all responses
 * 
 * @example
 * ```typescript
 * app.use(requestIdMiddleware);
 * ```
 */
export function requestIdMiddleware(req: any, res: any, next: any) {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-Id', requestId);
  
  next();
}

/**
 * Express middleware to wrap all responses in standard format
 * 
 * @example
 * ```typescript
 * app.use(responseWrapperMiddleware({ service: 'auth-service' }));
 * ```
 */
export function responseWrapperMiddleware(config: { service?: string } = {}) {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    
    res.json = (body: any) => {
      // If body is already a NileCareResponse, use it as-is
      if (body && typeof body === 'object' && 'success' in body && 'metadata' in body) {
        return originalJson(body);
      }
      
      // Otherwise, wrap it in success response
      const wrappedResponse = successResponse(body, {
        requestId: req.requestId,
        service: config.service,
      });
      
      return originalJson(wrappedResponse);
    };
    
    next();
  };
}

/**
 * Express error handler middleware
 * Converts errors to standard error responses
 * 
 * @example
 * ```typescript
 * app.use(errorHandlerMiddleware({ service: 'auth-service' }));
 * ```
 */
export function errorHandlerMiddleware(config: { service?: string } = {}) {
  return (err: any, req: any, res: any, next: any) => {
    // Log error
    console.error('Error:', err);
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Determine error code
    let errorCode = err.code || ErrorCode.INTERNAL_ERROR;
    if (statusCode === 401) errorCode = ErrorCode.AUTHENTICATION_REQUIRED;
    if (statusCode === 403) errorCode = ErrorCode.PERMISSION_DENIED;
    if (statusCode === 404) errorCode = ErrorCode.NOT_FOUND;
    
    // Create error response
    const response = errorResponse(
      errorCode,
      err.message || 'An error occurred',
      process.env.NODE_ENV === 'development' ? err.stack : undefined,
      statusCode,
      {
        requestId: req.requestId,
        service: config.service,
      }
    );
    
    res.status(statusCode).json(response);
  };
}

// Export types
export type { ResponseOptions };

