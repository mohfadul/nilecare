/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 */

import rateLimit from 'express-rate-limit';

/**
 * General rate limiter (100 requests per minute)
 */
export const rateLimiter = rateLimit({
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
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'anonymous';
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
 * Strict rate limiter for billing operations (20 requests per minute)
 */
export const billingRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: {
      code: 'BILLING_RATE_LIMIT_EXCEEDED',
      message: 'Too many billing operations. Please wait before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  skip: (req) => {
    return req.path === '/health' || req.path === '/ready';
  }
});

export default rateLimiter;

