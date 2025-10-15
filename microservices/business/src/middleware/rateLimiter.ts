import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Moderate rate limiter for write operations
export const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 write requests per windowMs
  message: {
    error: 'Too many write requests',
    message: 'Too many write operations, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    logger.warn(`Write rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many write requests',
      message: 'Too many write operations, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Generous rate limiter for read operations
export const readRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 read requests per windowMs
  message: {
    error: 'Too many read requests',
    message: 'Too many read operations, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req, res) => {
    logger.warn(`Read rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many read requests',
      message: 'Too many read operations, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

