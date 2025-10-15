/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 */
/**
 * General rate limiter (100 requests per minute)
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for payment operations (10 requests per minute)
 */
export declare const paymentRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Webhook rate limiter (1000 requests per minute)
 */
export declare const webhookRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export default rateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map