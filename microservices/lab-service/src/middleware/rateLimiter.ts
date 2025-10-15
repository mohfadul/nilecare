import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.userId,
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

// Stricter rate limiter for result processing
export const strictRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per 5 minutes
  message: {
    success: false,
    error: {
      message: 'Too many lab operations, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded for lab operation', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.userId,
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many lab operations, please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

// Authentication rate limiter
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed auth attempts per windowMs
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  rateLimiter,
  strictRateLimiter,
  authRateLimiter,
};

