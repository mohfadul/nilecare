/**
 * EHR Service - Rate Limiter Middleware
 * 
 * Protects EHR service from abuse while allowing clinical documentation
 * Different limits for different types of operations
 * 
 * Reference: CDS Service rate limiter pattern
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
    // Skip rate limiting for health checks and metrics
    return req.path === '/health' || 
           req.path === '/health/ready' || 
           req.path === '/health/startup' ||
           req.path === '/metrics';
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
 * Higher limit for clinical documentation endpoints
 * Healthcare providers need to document frequently
 */
export const documentationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for clinical documentation (critical function)
  message: {
    success: false,
    error: {
      message: 'Documentation rate limit exceeded. Please contact support if you need higher limits.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.facilityId) {
      // Facility-based limiting (shared limit across facility)
      return `facility:${user.facilityId}`;
    }
    if (user && user.userId) {
      return `user:${user.userId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Read-only operations limiter (higher limit)
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Higher limit for read operations
  message: {
    success: false,
    error: {
      message: 'Too many read requests. Please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.organizationId) {
      return `org:${user.organizationId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Strict limiter for administrative/sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Very strict limit
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
 * Export limiter - more restrictive for resource-intensive operations
 */
export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limited exports
  message: {
    success: false,
    error: {
      message: 'Export rate limit exceeded. Document generation is resource-intensive.',
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

