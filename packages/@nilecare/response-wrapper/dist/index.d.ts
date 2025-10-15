export interface NileCareResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        statusCode?: number;
    };
    metadata: {
        timestamp: string;
        requestId: string;
        version: string;
        service?: string;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
interface ResponseOptions {
    requestId?: string;
    version?: string;
    service?: string;
}
export declare function successResponse<T>(data: T, options?: ResponseOptions): NileCareResponse<T>;
export declare function successResponseWithPagination<T>(data: T, pagination: {
    page: number;
    limit: number;
    total: number;
}, options?: ResponseOptions): NileCareResponse<T>;
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    INVALID_REQUEST = "INVALID_REQUEST",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
    DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
    EXPIRED = "EXPIRED",
    PATIENT_NOT_FOUND = "PATIENT_NOT_FOUND",
    APPOINTMENT_CONFLICT = "APPOINTMENT_CONFLICT",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PRESCRIPTION_INVALID = "PRESCRIPTION_INVALID"
}
export declare function errorResponse(code: ErrorCode | string, message: string, details?: any, statusCode?: number, options?: ResponseOptions): NileCareResponse<never>;
export declare function validationErrorResponse(errors: Record<string, string[]>, options?: ResponseOptions): NileCareResponse<never>;
export declare function authenticationErrorResponse(message?: string, options?: ResponseOptions): NileCareResponse<never>;
export declare function permissionDeniedResponse(message?: string, requiredPermission?: string, options?: ResponseOptions): NileCareResponse<never>;
export declare function notFoundResponse(resource: string, id?: string | number, options?: ResponseOptions): NileCareResponse<never>;
export declare function serviceUnavailableResponse(serviceName: string, options?: ResponseOptions): NileCareResponse<never>;
export declare function requestIdMiddleware(req: any, res: any, next: any): void;
export declare function responseWrapperMiddleware(config?: {
    service?: string;
}): (req: any, res: any, next: any) => void;
export declare function errorHandlerMiddleware(config?: {
    service?: string;
}): (err: any, req: any, res: any, next: any) => void;
export type { ResponseOptions };
//# sourceMappingURL=index.d.ts.map