/**
 * Rate Limiter Middleware
 * Prevents DDoS and brute force attacks
 * Uses in-memory store (suitable for single-instance deployments)
 */
/**
 * General rate limiter (100 requests per minute)
 */
export declare const rateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Bulk operations rate limiter (stricter - 10 per minute)
 */
export declare const bulkRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export default rateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map