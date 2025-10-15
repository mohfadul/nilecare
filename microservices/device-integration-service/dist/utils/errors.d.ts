/**
 * Custom Error Classes
 * Standard error handling for the Device Integration Service
 */
export declare class ServiceError extends Error {
    statusCode: number;
    code: string;
    details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
}
export declare class ValidationError extends ServiceError {
    constructor(message: string, details?: any);
}
export declare class NotFoundError extends ServiceError {
    constructor(resource: string, identifier?: string);
}
export declare class AuthenticationError extends ServiceError {
    constructor(message?: string);
}
export declare class AuthorizationError extends ServiceError {
    constructor(message?: string);
}
export declare class DeviceConnectionError extends ServiceError {
    constructor(deviceId: string, details?: any);
}
export declare class DeviceTimeoutError extends ServiceError {
    constructor(deviceId: string);
}
export declare class ProtocolError extends ServiceError {
    constructor(protocol: string, message: string, details?: any);
}
export declare class DataValidationError extends ServiceError {
    constructor(field: string, message: string);
}
export declare class DatabaseError extends ServiceError {
    constructor(message: string, details?: any);
}
export declare class ExternalServiceError extends ServiceError {
    constructor(service: string, message: string, details?: any);
}
export declare class RateLimitError extends ServiceError {
    constructor();
}
export declare const handleError: (error: any) => ServiceError;
declare const _default: {
    ServiceError: typeof ServiceError;
    ValidationError: typeof ValidationError;
    NotFoundError: typeof NotFoundError;
    AuthenticationError: typeof AuthenticationError;
    AuthorizationError: typeof AuthorizationError;
    DeviceConnectionError: typeof DeviceConnectionError;
    DeviceTimeoutError: typeof DeviceTimeoutError;
    ProtocolError: typeof ProtocolError;
    DataValidationError: typeof DataValidationError;
    DatabaseError: typeof DatabaseError;
    ExternalServiceError: typeof ExternalServiceError;
    RateLimitError: typeof RateLimitError;
    handleError: (error: any) => ServiceError;
};
export default _default;
//# sourceMappingURL=errors.d.ts.map