/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Create Redis client for rate limiting (optional - falls back to in-memory)
let redis: Redis | null = null;
let redisStore: any = null;

// Only initialize Redis if REDIS_ENABLED is true (defaults to false for development)
if (process.env.REDIS_ENABLED === 'true') {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '2'),
      maxRetriesPerRequest: 3,
      retryStrategy: () => null, // Don't retry
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error (rate limiting will use in-memory store):', err.message);
      redis = null;
      redisStore = null;
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
      if (redis) {
        redisStore = new RedisStore({
          // @ts-ignore - Type compatibility with rate-limit-redis
          sendCommand: (...args: any[]) => redis!.call(...args)
        } as any);
      }
    });

    // Try to connect
    redis.connect().catch(() => {
      console.warn('⚠️  Redis not available - using in-memory rate limiting');
      redis = null;
      redisStore = null;
    });
  } catch (error) {
    console.warn('⚠️  Redis initialization failed - using in-memory rate limiting');
    redis = null;
    redisStore = null;
  }
} else {
  console.log('ℹ️  Redis disabled - using in-memory rate limiting');
}

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
  ...(redisStore && { store: redisStore }),
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
 * Strict rate limiter for payment operations (10 requests per minute)
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // Only 10 payment initiations per minute per user
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment attempts. Please wait before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisStore && { store: redisStore }),
  keyGenerator: (req) => {
    // Rate limit by user ID for authenticated requests
    return (req as any).user?.id || req.ip || 'anonymous';
  },
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/ready';
  }
});

/**
 * Webhook rate limiter (1000 requests per minute)
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisStore && { store: redisStore }),
  keyGenerator: (req) => {
    // Rate limit by provider
    return `webhook_${req.params.provider}`;
  }
});

export default rateLimiter;

