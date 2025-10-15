/**
 * Validation Middleware
 * Express-validator based validation with standardized error responses
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation middleware - executes validation chains and returns errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors in standardized format
    const formattedErrors: ValidationError[] = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    // Return standardized error response
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  };
};

/**
 * Sanitize user input (XSS prevention)
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate date format (ISO 8601)
 */
export function isValidDate(date: string): boolean {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Validate email format (RFC 5322)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (E.164 format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

