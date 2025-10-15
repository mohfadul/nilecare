/**
 * Clinical Decision Support Service - Rate Limiter Middleware
 * 
 * Protects CDS service from abuse while allowing critical safety checks
 * 
 * Reference: Clinical Service rate limiter pattern
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard rate limiter for most endpoints
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || 
           req.path === '/health/ready' || 
           req.path === '/health/startup';
  },
  // Custom key generator (use authenticated user if available)
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.userId) {
      return `user:${user.userId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Strict rate limiter for safety-critical endpoints
 * Higher limit for authenticated users performing clinical checks
 */
export const safetyCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for safety checks (critical function)
  message: {
    success: false,
    error: {
      message: 'Safety check rate limit exceeded. Please contact support if you need higher limits.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.organizationId) {
      // Organization-based limiting
      return `org:${user.organizationId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Strict limiter for administrative endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Very strict limit
  message: {
    success: false,
    error: {
      message: 'Too many requests for this sensitive endpoint. Please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Create custom rate limiter
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      error: {
        message: options.message || 'Rate limit exceeded',
        retryAfter: `${(options.windowMs || 900000) / 60000} minutes`
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

export default rateLimiter;

