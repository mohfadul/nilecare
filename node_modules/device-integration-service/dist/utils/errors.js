"use strict";
/**
 * Custom Error Classes
 * Standard error handling for the Device Integration Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.DataValidationError = exports.ProtocolError = exports.DeviceTimeoutError = exports.DeviceConnectionError = exports.AuthorizationError = exports.AuthenticationError = exports.NotFoundError = exports.ValidationError = exports.ServiceError = void 0;
class ServiceError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ServiceError = ServiceError;
class ValidationError extends ServiceError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ServiceError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class AuthenticationError extends ServiceError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends ServiceError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class DeviceConnectionError extends ServiceError {
    constructor(deviceId, details) {
        super(`Failed to connect to device ${deviceId}`, 503, 'DEVICE_CONNECTION_ERROR', details);
        this.name = 'DeviceConnectionError';
    }
}
exports.DeviceConnectionError = DeviceConnectionError;
class DeviceTimeoutError extends ServiceError {
    constructor(deviceId) {
        super(`Device ${deviceId} timeout`, 504, 'DEVICE_TIMEOUT_ERROR');
        this.name = 'DeviceTimeoutError';
    }
}
exports.DeviceTimeoutError = DeviceTimeoutError;
class ProtocolError extends ServiceError {
    constructor(protocol, message, details) {
        super(`${protocol} protocol error: ${message}`, 500, 'PROTOCOL_ERROR', details);
        this.name = 'ProtocolError';
    }
}
exports.ProtocolError = ProtocolError;
class DataValidationError extends ServiceError {
    constructor(field, message) {
        super(`Invalid ${field}: ${message}`, 400, 'DATA_VALIDATION_ERROR');
        this.name = 'DataValidationError';
    }
}
exports.DataValidationError = DataValidationError;
class DatabaseError extends ServiceError {
    constructor(message, details) {
        super(`Database error: ${message}`, 500, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends ServiceError {
    constructor(service, message, details) {
        super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
        this.name = 'ExternalServiceError';
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends ServiceError {
    constructor() {
        super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
const handleError = (error) => {
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
exports.handleError = handleError;
exports.default = {
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
    handleError: exports.handleError,
};
//# sourceMappingURL=errors.js.map