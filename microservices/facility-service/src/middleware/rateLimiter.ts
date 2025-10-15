import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// Standard rate limiter for most endpoints
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin endpoint limiter (stricter)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many admin requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Bed status update limiter (for real-time updates)
export const bedStatusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 requests per window
  message: 'Too many bed status updates, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  standardLimiter,
  adminLimiter,
  bedStatusLimiter,
};

