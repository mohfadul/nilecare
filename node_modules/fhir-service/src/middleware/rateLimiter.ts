import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting for FHIR Service
 * FHIR APIs typically have higher limits due to bulk operations
 */

// Standard rate limiter for FHIR API
export const fhirLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Higher for FHIR operations
  message: 'Too many FHIR requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Bulk data export limiter (stricter)
export const bulkDataLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Very limited for bulk exports
  message: 'Too many bulk export requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// SMART authorization limiter
export const smartAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Too many authorization requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  fhirLimiter,
  bulkDataLimiter,
  smartAuthLimiter,
};

