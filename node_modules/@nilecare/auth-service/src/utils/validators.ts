import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Password validation schema
export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  });

// Email validation schema
export const emailSchema = Joi.string()
  .email()
  .max(255)
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email must not exceed 255 characters'
  });

// Registration validation schema
export const registerSchema = Joi.object({
  email: emailSchema.required(),
  username: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.min': 'Username must be at least 2 characters long',
      'string.max': 'Username must not exceed 50 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, hyphens, and underscores'
    }),
  password: passwordSchema.required(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional()
});

// Login validation schema
export const loginSchema = Joi.object({
  email: emailSchema.required(),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Password reset request schema
export const passwordResetRequestSchema = Joi.object({
  email: emailSchema.required()
});

// Password reset schema
export const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  newPassword: passwordSchema.required()
});

// MFA setup schema
export const mfaSetupSchema = Joi.object({
  method: Joi.string().valid('totp', 'sms', 'email').required()
});

// MFA verify schema
export const mfaVerifySchema = Joi.object({
  token: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'MFA token must be 6 digits',
    'string.pattern.base': 'MFA token must contain only numbers'
  })
});

// Role creation schema
export const roleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(255).optional(),
  permissions: Joi.array().items(Joi.string()).required()
});

// User update schema
export const userUpdateSchema = Joi.object({
  username: Joi.string().min(2).max(50).pattern(/^[a-zA-Z0-9_-]+$/).optional(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  email: emailSchema.optional(),
  role: Joi.string().optional()
});

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

