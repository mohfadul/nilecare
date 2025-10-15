"use strict";
/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRateLimiter = exports.paymentRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const ioredis_1 = __importDefault(require("ioredis"));
// Create Redis client for rate limiting
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '2')
});
/**
 * General rate limiter (100 requests per minute)
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...(redis && { store: new rate_limit_redis_1.default({
            // @ts-ignore - Type compatibility with rate-limit-redis
            sendCommand: (...args) => redis.call(...args)
        }) }),
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
    }
});
/**
 * Strict rate limiter for payment operations (10 requests per minute)
 */
exports.paymentRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000, // 1 minute
    max: 10, // Only 10 payment initiations per minute per user
    message: {
        success: false,
        error: {
            code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
            message: 'Too many payment attempts. Please wait before trying again.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...(redis && { store: new rate_limit_redis_1.default({
            // @ts-ignore - Type compatibility with rate-limit-redis
            sendCommand: (...args) => redis.call(...args)
        }) }),
    keyGenerator: (req) => {
        // Rate limit by user ID for authenticated requests
        return req.user?.id || req.ip || 'anonymous';
    },
    skip: (req) => {
        // Skip rate limiting for health check endpoints
        return req.path === '/health' || req.path === '/ready';
    }
});
/**
 * Webhook rate limiter (1000 requests per minute)
 */
exports.webhookRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    ...(redis && { store: new rate_limit_redis_1.default({
            // @ts-ignore - Type compatibility with rate-limit-redis
            sendCommand: (...args) => redis.call(...args)
        }) }),
    keyGenerator: (req) => {
        // Rate limit by provider
        return `webhook_${req.params.provider}`;
    }
});
exports.default = exports.rateLimiter;
//# sourceMappingURL=rate-limiter.js.map