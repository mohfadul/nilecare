"use strict";
/**
 * Rate Limiting Middleware
 * Protects against API abuse
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitalSignsLimiter = exports.registrationLimiter = exports.standardLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
// Standard rate limiter for API endpoints
exports.standardLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.RATE_LIMIT_WINDOW_MS,
    max: env_1.config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for service-to-service calls
    skip: (req) => {
        const serviceApiKey = req.headers['x-service-api-key'];
        return serviceApiKey === env_1.config.SERVICE_API_KEY;
    },
});
// Strict limiter for device registration
exports.registrationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: {
        success: false,
        error: 'Too many device registration attempts, please try again later.',
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const serviceApiKey = req.headers['x-service-api-key'];
        return serviceApiKey === env_1.config.SERVICE_API_KEY;
    },
});
// Very permissive limiter for vital signs data (real-time streaming)
exports.vitalSignsLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10000, // High limit for real-time data
    message: {
        success: false,
        error: 'Too many vital signs data submissions.',
        code: 'VITAL_SIGNS_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const serviceApiKey = req.headers['x-service-api-key'];
        return serviceApiKey === env_1.config.SERVICE_API_KEY;
    },
});
exports.default = {
    standardLimiter: exports.standardLimiter,
    registrationLimiter: exports.registrationLimiter,
    vitalSignsLimiter: exports.vitalSignsLimiter,
};
//# sourceMappingURL=rateLimiter.js.map