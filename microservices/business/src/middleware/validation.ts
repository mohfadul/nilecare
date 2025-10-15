import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: any[] = [];

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'body'
        })));
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'query'
        })));
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        validationErrors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'params'
        })));
      } else {
        req.params = value;
      }
    }

    if (validationErrors.length > 0) {
      return next(new ValidationError('Validation failed', validationErrors));
    }

    next();
  };
};

// Common validation schemas
export const schemas = {
  id: Joi.object({
    id: Joi.string().uuid().required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),

  appointment: Joi.object({
    patientId: Joi.string().uuid().required(),
    providerId: Joi.string().uuid().required(),
    appointmentDate: Joi.date().iso().required(),
    appointmentType: Joi.string()
      .valid('consultation', 'follow-up', 'procedure', 'emergency', 'telemedicine')
      .required(),
    duration: Joi.number().integer().min(15).max(480).required(),
    reason: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    location: Joi.string().max(255).optional(),
    priority: Joi.string().valid('routine', 'urgent', 'emergency').default('routine')
  }),

  appointmentUpdate: Joi.object({
    appointmentDate: Joi.date().iso().optional(),
    appointmentType: Joi.string()
      .valid('consultation', 'follow-up', 'procedure', 'emergency', 'telemedicine')
      .optional(),
    duration: Joi.number().integer().min(15).max(480).optional(),
    status: Joi.string()
      .valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')
      .optional(),
    reason: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional(),
    location: Joi.string().max(255).optional(),
    priority: Joi.string().valid('routine', 'urgent', 'emergency').optional()
  }),

  billing: Joi.object({
    patientId: Joi.string().uuid().required(),
    appointmentId: Joi.string().uuid().optional(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    description: Joi.string().max(500).required(),
    items: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        quantity: Joi.number().integer().positive().required(),
        unitPrice: Joi.number().positive().required(),
        amount: Joi.number().positive().required()
      })
    ).min(1).required()
  }),

  schedule: Joi.object({
    staffId: Joi.string().uuid().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
    scheduleType: Joi.string().valid('shift', 'appointment', 'time-off', 'break').required(),
    location: Joi.string().max(255).optional(),
    notes: Joi.string().max(500).optional()
  }),

  staff: Joi.object({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    role: Joi.string().valid('doctor', 'nurse', 'receptionist', 'admin', 'technician').required(),
    department: Joi.string().max(100).optional(),
    specialization: Joi.string().max(100).optional(),
    licenseNumber: Joi.string().max(100).optional(),
    hireDate: Joi.date().iso().optional()
  })
};

