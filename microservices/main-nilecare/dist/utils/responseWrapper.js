"use strict";
/**
 * Response Wrapper Utility
 * Standardizes API responses across all endpoints
 *
 * ✅ Part of orchestration consolidation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = void 0;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
exports.sendPaginated = sendPaginated;
exports.wrapResponse = wrapResponse;
/**
 * Send standardized success response
 */
function sendSuccess(res, data, statusCode = 200, metadata) {
    const response = {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            ...metadata,
        },
    };
    res.status(statusCode).json(response);
}
/**
 * Send standardized error response
 */
function sendError(res, code, message, statusCode = 400, details) {
    const response = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details }),
        },
        metadata: {
            timestamp: new Date().toISOString(),
        },
    };
    res.status(statusCode).json(response);
}
/**
 * Send paginated response
 */
function sendPaginated(res, data, pagination) {
    const response = {
        success: true,
        data,
        pagination: {
            ...pagination,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
    };
    res.status(200).json(response);
}
/**
 * Wrap existing response data into standardized format
 */
function wrapResponse(data, alreadyWrapped = false) {
    // Check if already in standard format
    if (alreadyWrapped && typeof data === 'object' && data !== null && 'success' in data) {
        return data;
    }
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
    };
}
/**
 * Common error codes
 */
exports.ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    BAD_REQUEST: 'BAD_REQUEST',
    PROXY_ERROR: 'PROXY_ERROR',
};
//# sourceMappingURL=responseWrapper.js.map