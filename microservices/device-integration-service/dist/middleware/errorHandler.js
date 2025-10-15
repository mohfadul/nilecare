"use strict";
/**
 * Error Handler Middleware
 * Centralized error handling for the Device Integration Service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (error, req, res, next) => {
    // Log the error
    logger_1.default.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        user: req.user?.userId,
    });
    // Handle ServiceError instances
    if (error instanceof errors_1.ServiceError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
        });
        return;
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'VALIDATION_ERROR',
        });
        return;
    }
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: 'INVALID_TOKEN',
        });
        return;
    }
    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: 'Token expired',
            code: 'TOKEN_EXPIRED',
        });
        return;
    }
    // Default internal server error
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=errorHandler.js.map