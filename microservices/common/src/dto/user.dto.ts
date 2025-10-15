import Joi from 'joi';
import { z } from 'zod';

/**
 * User DTOs with validation schemas
 */

// Joi schemas
export const CreateUserDtoSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid(
    'super_admin', 'admin', 'doctor', 'nurse', 'receptionist',
    'lab_technician', 'pharmacist', 'billing_clerk', 'patient'
  ).required(),
  organizationId: Joi.string().uuid().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
});

export const UpdateUserDtoSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
});

export const LoginDtoSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Zod schemas (alternative)
export const CreateUserZodSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: z.enum([
    'super_admin', 'admin', 'doctor', 'nurse', 'receptionist',
    'lab_technician', 'pharmacist', 'billing_clerk', 'patient'
  ]),
  organizationId: z.string().uuid().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export const UpdateUserZodSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const LoginZodSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

