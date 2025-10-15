/**
 * Custom Error Classes
 * Standard error handling for the Device Integration Service
 */

export class ServiceError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ServiceError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class DeviceConnectionError extends ServiceError {
  constructor(deviceId: string, details?: any) {
    super(`Failed to connect to device ${deviceId}`, 503, 'DEVICE_CONNECTION_ERROR', details);
    this.name = 'DeviceConnectionError';
  }
}

export class DeviceTimeoutError extends ServiceError {
  constructor(deviceId: string) {
    super(`Device ${deviceId} timeout`, 504, 'DEVICE_TIMEOUT_ERROR');
    this.name = 'DeviceTimeoutError';
  }
}

export class ProtocolError extends ServiceError {
  constructor(protocol: string, message: string, details?: any) {
    super(`${protocol} protocol error: ${message}`, 500, 'PROTOCOL_ERROR', details);
    this.name = 'ProtocolError';
  }
}

export class DataValidationError extends ServiceError {
  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`, 400, 'DATA_VALIDATION_ERROR');
    this.name = 'DataValidationError';
  }
}

export class DatabaseError extends ServiceError {
  constructor(message: string, details?: any) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ServiceError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends ServiceError {
  constructor() {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export const handleError = (error: any): ServiceError => {
  if (error instanceof ServiceError) {
    return error;
  }

  if (error.code === '23505') {
    // PostgreSQL unique violation
    return new ValidationError('Duplicate entry', { constraint: error.constraint });
  }

  if (error.code === '23503') {
    // PostgreSQL foreign key violation
    return new ValidationError('Referenced resource not found', {
      constraint: error.constraint,
    });
  }

  // Default to internal server error
  return new ServiceError(error.message || 'Internal server error', 500, 'INTERNAL_ERROR', {
    originalError: error.message,
  });
};

export default {
  ServiceError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  DeviceConnectionError,
  DeviceTimeoutError,
  ProtocolError,
  DataValidationError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  handleError,
};

