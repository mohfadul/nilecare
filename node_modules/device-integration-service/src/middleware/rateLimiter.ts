/**
 * Rate Limiting Middleware
 * Protects against API abuse
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// Standard rate limiter for API endpoints
export const standardLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for service-to-service calls
  skip: (req) => {
    const serviceApiKey = req.headers['x-service-api-key'] as string;
    return serviceApiKey === config.SERVICE_API_KEY;
  },
});

// Strict limiter for device registration
export const registrationLimiter = rateLimit({
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
    const serviceApiKey = req.headers['x-service-api-key'] as string;
    return serviceApiKey === config.SERVICE_API_KEY;
  },
});

// Very permissive limiter for vital signs data (real-time streaming)
export const vitalSignsLimiter = rateLimit({
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
    const serviceApiKey = req.headers['x-service-api-key'] as string;
    return serviceApiKey === config.SERVICE_API_KEY;
  },
});

export default {
  standardLimiter,
  registrationLimiter,
  vitalSignsLimiter,
};

