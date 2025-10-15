"use strict";
/**
 * Error Handler Middleware
 * Global error handling for main-nilecare service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, _next) => {
    // Handle aborted requests gracefully (don't log as errors)
    if (error.name === 'BadRequestError' && error.message === 'request aborted') {
        console.log('[Info] Request aborted by client:', {
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        // Don't try to send response if connection is already closed
        if (!res.headersSent) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'REQUEST_ABORTED',
                    message: 'Request was aborted'
                }
            });
        }
        return;
    }
    // Log error
    console.error('[Error]', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Don't send response if headers already sent
    if (res.headersSent) {
        console.log('[Error] Cannot send error response - headers already sent');
        return;
    }
    // Application error (custom)
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        });
        return;
    }
    // Validation error (Joi)
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: error.details
            }
        });
        return;
    }
    // Database error
    if (error.name === 'QueryFailedError' || error.code?.startsWith('ER_')) {
        res.status(500).json({
            success: false,
            error: {
                code: 'DATABASE_ERROR',
                message: 'Database operation failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        });
        return;
    }
    // Default error
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=error-handler.js.map