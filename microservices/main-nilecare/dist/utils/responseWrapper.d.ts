/**
 * Response Wrapper Utility
 * Standardizes API responses across all endpoints
 *
 * ✅ Part of orchestration consolidation
 */
import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: {
        timestamp: string;
        version?: string;
        requestId?: string;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
/**
 * Send standardized success response
 */
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, metadata?: Record<string, any>): void;
/**
 * Send standardized error response
 */
export declare function sendError(res: Response, code: string, message: string, statusCode?: number, details?: any): void;
/**
 * Send paginated response
 */
export declare function sendPaginated<T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
}): void;
/**
 * Wrap existing response data into standardized format
 */
export declare function wrapResponse<T>(data: T, alreadyWrapped?: boolean): ApiResponse<T>;
/**
 * Common error codes
 */
export declare const ErrorCodes: {
    VALIDATION_ERROR: string;
    UNAUTHORIZED: string;
    FORBIDDEN: string;
    NOT_FOUND: string;
    CONFLICT: string;
    INTERNAL_ERROR: string;
    SERVICE_UNAVAILABLE: string;
    RATE_LIMIT_EXCEEDED: string;
    BAD_REQUEST: string;
    PROXY_ERROR: string;
};
//# sourceMappingURL=responseWrapper.d.ts.map