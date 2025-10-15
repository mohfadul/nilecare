import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate Limiter Middleware for Inventory Service
 * Protects against abuse while allowing high-frequency stock operations
 */

/**
 * Standard rate limiter for most endpoints
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for inventory operations (frequent queries)
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return req.path === '/health' || 
           req.path === '/health/ready' || 
           req.path === '/health/startup';
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.userId) {
      return `user:${user.userId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Strict limiter for reservation operations (critical)
 */
export const reservationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Higher limit for critical operations
  message: {
    success: false,
    error: {
      message: 'Reservation rate limit exceeded. Contact support if you need higher limits.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    if (user && user.facilityId) {
      return `facility:${user.facilityId}`;
    }
    return req.ip || 'unknown';
  }
});

/**
 * Strict limiter for administrative operations
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: {
      message: 'Too many administrative requests. Please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default rateLimiter;

