import Joi from 'joi';
import { z } from 'zod';

/**
 * Validation utility functions
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: any[] = []
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate data using Joi schema
 */
export function validateWithJoi<T>(
  schema: Joi.Schema,
  data: any,
  options: Joi.ValidationOptions = {}
): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options,
  });

  if (error) {
    throw new ValidationError(
      'Validation failed',
      error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))
    );
  }

  return value as T;
}

/**
 * Validate data using Zod schema
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: any
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(
      'Validation failed',
      result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
      }))
    );
  }

  return result.data;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  URL: /^https?:\/\/.+/,
};

/**
 * Validate UUID
 */
export function isValidUUID(value: string): boolean {
  return ValidationPatterns.UUID.test(value);
}

/**
 * Validate email
 */
export function isValidEmail(value: string): boolean {
  return ValidationPatterns.EMAIL.test(value);
}

/**
 * Validate phone number
 */
export function isValidPhone(value: string): boolean {
  return ValidationPatterns.PHONE.test(value);
}

/**
 * Sanitize string input
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

/**
 * Validate and parse pagination params
 */
export function validatePaginationParams(params: any): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

