import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { logger } from '../utils/logger';

/**
 * Get client identifier (IP + User ID if authenticated)
 */
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return userId ? `${userId}:${ip}` : ip;
};

/**
 * Rate limit handler
 */
const handler = (req: Request, res: any) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    userId: (req as any).user?.id
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler
});

/**
 * Strict rate limiter for authentication endpoints
 * 100 requests per 5 minutes per IP (DEVELOPMENT MODE - relaxed for testing)
 * TODO: Change to 5 requests in production
 */
export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Increased for testing (was 5)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skipSuccessfulRequests: true // Only count failed attempts
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler
});

/**
 * Token refresh rate limiter
 * 20 requests per 15 minutes per user
 */
export const refreshTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler
});

/**
 * MFA verification rate limiter
 * 5 attempts per 5 minutes per IP
 */
export const mfaRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler
});

export default rateLimiter;

