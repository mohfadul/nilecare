"use strict";
/**
 * Error Handler Middleware
 * Global error handling for payment gateway service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.PaymentError = void 0;
class PaymentError extends Error {
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'PaymentError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.PaymentError = PaymentError;
const errorHandler = (error, req, res, _next) => {
    // Log error
    console.error('[Error]', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    // Payment error (custom)
    if (error instanceof PaymentError) {
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