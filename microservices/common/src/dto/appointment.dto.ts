import Joi from 'joi';
import { z } from 'zod';

/**
 * Appointment DTOs with validation schemas
 */

// Joi schemas
export const CreateAppointmentDtoSchema = Joi.object({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  organizationId: Joi.string().uuid().required(),
  appointmentDate: Joi.date().min('now').required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  duration: Joi.number().integer().min(5).max(480).required(),
  type: Joi.string().valid(
    'consultation', 'follow_up', 'emergency', 'surgery',
    'lab_test', 'vaccination', 'screening'
  ).required(),
  reason: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional(),
});

export const UpdateAppointmentDtoSchema = Joi.object({
  appointmentDate: Joi.date().min('now').optional(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  duration: Joi.number().integer().min(5).max(480).optional(),
  status: Joi.string().valid(
    'scheduled', 'confirmed', 'checked_in', 'in_progress',
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ).optional(),
  reason: Joi.string().max(500).optional(),
  notes: Joi.string().max(1000).optional(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  diagnosis: Joi.string().max(2000).optional(),
  prescription: Joi.string().max(2000).optional(),
  followUpDate: Joi.date().optional(),
});

// Zod schemas
export const CreateAppointmentZodSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  organizationId: z.string().uuid(),
  appointmentDate: z.date().min(new Date()),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  duration: z.number().int().min(5).max(480),
  type: z.enum([
    'consultation', 'follow_up', 'emergency', 'surgery',
    'lab_test', 'vaccination', 'screening'
  ]),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

