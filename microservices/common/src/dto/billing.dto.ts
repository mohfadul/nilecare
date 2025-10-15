import Joi from 'joi';
import { z } from 'zod';

/**
 * Billing DTOs with validation schemas
 */

// Joi schemas
export const CreateInvoiceDtoSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  organizationId: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().optional(),
  items: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    quantity: Joi.number().positive().required(),
    unitPrice: Joi.number().positive().required(),
    total: Joi.number().positive().required(),
    category: Joi.string().required(),
  })).min(1).required(),
  tax: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  currency: Joi.string().length(3).uppercase().default('SDG'),
  dueDate: Joi.date().min('now').required(),
  notes: Joi.string().max(500).optional(),
});

export const UpdateInvoiceDtoSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    quantity: Joi.number().positive().required(),
    unitPrice: Joi.number().positive().required(),
    total: Joi.number().positive().required(),
    category: Joi.string().required(),
  })).min(1).optional(),
  tax: Joi.number().min(0).optional(),
  discount: Joi.number().min(0).optional(),
  status: Joi.string().valid(
    'draft', 'pending', 'paid', 'partially_paid',
    'overdue', 'cancelled', 'refunded'
  ).optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().max(500).optional(),
});

// Zod schemas
export const CreateInvoiceZodSchema = z.object({
  patientId: z.string().uuid(),
  organizationId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    total: z.number().positive(),
    category: z.string(),
  })).min(1),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  currency: z.string().length(3).toUpperCase().default('SDG'),
  dueDate: z.date().min(new Date()),
  notes: z.string().max(500).optional(),
});

