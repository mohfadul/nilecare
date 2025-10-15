/**
 * Rate Limiting Middleware
 * Protects against API abuse
 */
export declare const standardLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const registrationLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const vitalSignsLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare const _default: {
    standardLimiter: import("express-rate-limit").RateLimitRequestHandler;
    registrationLimiter: import("express-rate-limit").RateLimitRequestHandler;
    vitalSignsLimiter: import("express-rate-limit").RateLimitRequestHandler;
};
export default _default;
//# sourceMappingURL=rateLimiter.d.ts.map