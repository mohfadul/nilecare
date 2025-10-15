import Joi from 'joi';
import { z } from 'zod';

/**
 * Payment DTOs with validation schemas
 */

// Joi schemas
export const CreatePaymentDtoSchema = Joi.object({
  invoiceId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().required(),
  organizationId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default('SDG'),
  method: Joi.string().valid(
    'cash', 'credit_card', 'debit_card', 'mobile_money',
    'bank_transfer', 'insurance', 'check'
  ).required(),
  gateway: Joi.string().valid(
    'stripe', 'paypal', 'flutterwave', 'paystack', 'internal'
  ).optional(),
  metadata: Joi.object().optional(),
});

export const ProcessPaymentDtoSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  transactionId: Joi.string().required(),
  status: Joi.string().valid(
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  ).required(),
  metadata: Joi.object().optional(),
});

// Zod schemas
export const CreatePaymentZodSchema = z.object({
  invoiceId: z.string().uuid(),
  patientId: z.string().uuid(),
  organizationId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).toUpperCase().default('SDG'),
  method: z.enum([
    'cash', 'credit_card', 'debit_card', 'mobile_money',
    'bank_transfer', 'insurance', 'check'
  ]),
  gateway: z.enum([
    'stripe', 'paypal', 'flutterwave', 'paystack', 'internal'
  ]).optional(),
  metadata: z.record(z.any()).optional(),
});

export const ProcessPaymentZodSchema = z.object({
  paymentId: z.string().uuid(),
  transactionId: z.string(),
  status: z.enum([
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  ]),
  metadata: z.record(z.any()).optional(),
});

