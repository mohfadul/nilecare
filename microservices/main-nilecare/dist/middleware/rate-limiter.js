"use strict";
/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 * Uses in-memory store (suitable for single-instance deployments)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
console.log('ℹ️  Using in-memory rate limiting (for clustered deployments, consider Redis)');
/**
 * General rate limiter (100 requests per minute)
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '1000' : '100')),
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip || 'anonymous';
    },
    handler: (_req, res) => {
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                retryAfter: res.getHeader('Retry-After')
            }
        });
    },
    skip: (req) => {
        // Skip rate limiting for health checks and API endpoints in development
        const isHealthCheck = req.path === '/health' || req.path.startsWith('/health/');
        const isBusinessRoute = req.path.startsWith('/api/business/');
        const isAppointmentRoute = req.path.startsWith('/api/appointment/');
        const isDevelopment = process.env.NODE_ENV === 'development';
        return isHealthCheck || (isDevelopment && (isBusinessRoute || isAppointmentRoute));
    }
});
/**
 * Bulk operations rate limiter (stricter - 10 per minute)
 */
exports.bulkRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 10,
    message: {
        success: false,
        error: {
            code: 'BULK_RATE_LIMIT_EXCEEDED',
            message: 'Too many bulk operations. Please wait before trying again.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.user?.id || req.ip || 'anonymous';
    }
});
exports.default = exports.rateLimiter;
//# sourceMappingURL=rate-limiter.js.map