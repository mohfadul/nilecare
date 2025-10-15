/**
 * Rate Limiting Middleware
 * Prevents abuse and ensures fair usage
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later',
      },
    });
  },
});

/**
 * Strict rate limiter for sending notifications
 */
export const notificationSendLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: parseInt(process.env.MAX_NOTIFICATIONS_PER_USER_PER_HOUR || '50'),
  message: {
    success: false,
    error: {
      code: 'NOTIFICATION_LIMIT_EXCEEDED',
      message: 'Hourly notification limit exceeded',
    },
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'anonymous';
  },
});

/**
 * Daily notification limit
 */
export const dailyNotificationLimiter = rateLimit({
  windowMs: 86400000, // 24 hours
  max: parseInt(process.env.MAX_NOTIFICATIONS_PER_USER_PER_DAY || '200'),
  message: {
    success: false,
    error: {
      code: 'DAILY_LIMIT_EXCEEDED',
      message: 'Daily notification limit exceeded',
    },
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'anonymous';
  },
});

export default rateLimiter;

