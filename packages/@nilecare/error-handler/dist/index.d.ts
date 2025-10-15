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
export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    FORBIDDEN = "FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_REQUEST = "INVALID_REQUEST",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    CONFLICT = "CONFLICT",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    INVALID_STATE = "INVALID_STATE",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    GATEWAY_TIMEOUT = "GATEWAY_TIMEOUT",
    DATABASE_ERROR = "DATABASE_ERROR",
    QUERY_FAILED = "QUERY_FAILED",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * API Error class - throw this in your route handlers
 */
export declare class ApiError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: any;
    readonly isOperational: boolean;
    constructor(code: string | ErrorCode, message: string, statusCode?: number, details?: any, isOperational?: boolean);
    /**
     * Convert error to JSON response format
     */
    toJSON(): {
        success: boolean;
        error: any;
        timestamp: string;
    };
}
/**
 * Pre-defined error creators for common scenarios
 */
export declare const Errors: {
    notFound: (resource: string, id?: string) => ApiError;
    unauthorized: (message?: string) => ApiError;
    forbidden: (message?: string) => ApiError;
    invalidToken: (message?: string) => ApiError;
    validation: (message: string, details?: any) => ApiError;
    conflict: (message: string) => ApiError;
    serviceUnavailable: (serviceName: string) => ApiError;
    rateLimitExceeded: (message?: string) => ApiError;
    internal: (message?: string, details?: any) => ApiError;
};
/**
 * Express error handling middleware
 */
export declare function createErrorHandler(logger?: any): (err: any, req: any, res: any, next: any) => any;
/**
 * Async handler wrapper to catch async errors
 */
export declare function asyncHandler(fn: Function): (req: any, res: any, next: any) => void;
/**
 * Not found handler (404)
 */
export declare function notFoundHandler(): (req: any, res: any) => void;
declare const _default: {
    ApiError: typeof ApiError;
    Errors: {
        notFound: (resource: string, id?: string) => ApiError;
        unauthorized: (message?: string) => ApiError;
        forbidden: (message?: string) => ApiError;
        invalidToken: (message?: string) => ApiError;
        validation: (message: string, details?: any) => ApiError;
        conflict: (message: string) => ApiError;
        serviceUnavailable: (serviceName: string) => ApiError;
        rateLimitExceeded: (message?: string) => ApiError;
        internal: (message?: string, details?: any) => ApiError;
    };
    createErrorHandler: typeof createErrorHandler;
    asyncHandler: typeof asyncHandler;
    notFoundHandler: typeof notFoundHandler;
};
export default _default;
