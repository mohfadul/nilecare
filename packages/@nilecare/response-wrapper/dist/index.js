"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
exports.successResponse = successResponse;
exports.successResponseWithPagination = successResponseWithPagination;
exports.errorResponse = errorResponse;
exports.validationErrorResponse = validationErrorResponse;
exports.authenticationErrorResponse = authenticationErrorResponse;
exports.permissionDeniedResponse = permissionDeniedResponse;
exports.notFoundResponse = notFoundResponse;
exports.serviceUnavailableResponse = serviceUnavailableResponse;
exports.requestIdMiddleware = requestIdMiddleware;
exports.responseWrapperMiddleware = responseWrapperMiddleware;
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const uuid_1 = require("uuid");
function successResponse(data, options) {
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId || (0, uuid_1.v4)(),
            version: options?.version || 'v1',
            ...(options?.service && { service: options.service }),
        },
    };
}
function successResponseWithPagination(data, pagination, options) {
    const pages = Math.ceil(pagination.total / pagination.limit);
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId || (0, uuid_1.v4)(),
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
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
    ErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["INSUFFICIENT_BALANCE"] = "INSUFFICIENT_BALANCE";
    ErrorCode["DUPLICATE_ENTRY"] = "DUPLICATE_ENTRY";
    ErrorCode["OPERATION_NOT_ALLOWED"] = "OPERATION_NOT_ALLOWED";
    ErrorCode["EXPIRED"] = "EXPIRED";
    ErrorCode["PATIENT_NOT_FOUND"] = "PATIENT_NOT_FOUND";
    ErrorCode["APPOINTMENT_CONFLICT"] = "APPOINTMENT_CONFLICT";
    ErrorCode["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    ErrorCode["PRESCRIPTION_INVALID"] = "PRESCRIPTION_INVALID";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
function errorResponse(code, message, details, statusCode = 400, options) {
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
            requestId: options?.requestId || (0, uuid_1.v4)(),
            version: options?.version || 'v1',
            ...(options?.service && { service: options.service }),
        },
    };
}
function validationErrorResponse(errors, options) {
    return errorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', { fields: errors }, 400, options);
}
function authenticationErrorResponse(message = 'Authentication required', options) {
    return errorResponse(ErrorCode.AUTHENTICATION_REQUIRED, message, undefined, 401, options);
}
function permissionDeniedResponse(message = 'Permission denied', requiredPermission, options) {
    return errorResponse(ErrorCode.PERMISSION_DENIED, message, requiredPermission ? { requiredPermission } : undefined, 403, options);
}
function notFoundResponse(resource, id, options) {
    return errorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, id ? { id } : undefined, 404, options);
}
function serviceUnavailableResponse(serviceName, options) {
    return errorResponse(ErrorCode.SERVICE_UNAVAILABLE, `${serviceName} is currently unavailable`, { service: serviceName }, 503, options);
}
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}
function responseWrapperMiddleware(config = {}) {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (body && typeof body === 'object' && 'success' in body && 'metadata' in body) {
                return originalJson(body);
            }
            const wrappedResponse = successResponse(body, {
                requestId: req.requestId,
                service: config.service,
            });
            return originalJson(wrappedResponse);
        };
        next();
    };
}
function errorHandlerMiddleware(config = {}) {
    return (err, req, res, next) => {
        console.error('Error:', err);
        const statusCode = err.statusCode || err.status || 500;
        let errorCode = err.code || ErrorCode.INTERNAL_ERROR;
        if (statusCode === 401)
            errorCode = ErrorCode.AUTHENTICATION_REQUIRED;
        if (statusCode === 403)
            errorCode = ErrorCode.PERMISSION_DENIED;
        if (statusCode === 404)
            errorCode = ErrorCode.NOT_FOUND;
        const response = errorResponse(errorCode, err.message || 'An error occurred', process.env.NODE_ENV === 'development' ? err.stack : undefined, statusCode, {
            requestId: req.requestId,
            service: config.service,
        });
        res.status(statusCode).json(response);
    };
}
//# sourceMappingURL=index.js.map