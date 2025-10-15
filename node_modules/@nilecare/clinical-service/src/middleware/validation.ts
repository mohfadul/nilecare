import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      const validationError = createError('Validation Error', 400);
      validationError.message = errors.join('; ');
      return next(validationError);
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
    sort: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  patient: {
    create: Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      dateOfBirth: Joi.date().max('now').required(),
      gender: Joi.string().valid('male', 'female', 'other', 'unknown').required(),
      phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
      email: Joi.string().email().optional(),
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required()
      }).optional(),
      emergencyContact: Joi.object({
        name: Joi.string().required(),
        relationship: Joi.string().required(),
        phoneNumber: Joi.string().required()
      }).optional(),
      medicalHistory: Joi.array().items(Joi.string()).optional(),
      allergies: Joi.array().items(Joi.string()).optional(),
      medications: Joi.array().items(Joi.string()).optional()
    }),

    update: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      dateOfBirth: Joi.date().max('now').optional(),
      gender: Joi.string().valid('male', 'female', 'other', 'unknown').optional(),
      phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      email: Joi.string().email().optional(),
      address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        country: Joi.string().optional()
      }).optional(),
      emergencyContact: Joi.object({
        name: Joi.string().optional(),
        relationship: Joi.string().optional(),
        phoneNumber: Joi.string().optional()
      }).optional(),
      medicalHistory: Joi.array().items(Joi.string()).optional(),
      allergies: Joi.array().items(Joi.string()).optional(),
      medications: Joi.array().items(Joi.string()).optional()
    })
  },

  encounter: {
    create: Joi.object({
      patientId: Joi.string().uuid().required(),
      providerId: Joi.string().uuid().required(),
      encounterType: Joi.string().valid('outpatient', 'inpatient', 'emergency', 'telehealth').required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().min(Joi.ref('startDate')).optional(),
      chiefComplaint: Joi.string().required(),
      diagnosis: Joi.array().items(Joi.string()).optional(),
      treatmentPlan: Joi.string().optional(),
      vitalSigns: Joi.object({
        bloodPressure: Joi.object({
          systolic: Joi.number().min(50).max(300),
          diastolic: Joi.number().min(30).max(200)
        }).optional(),
        heartRate: Joi.number().min(30).max(250).optional(),
        temperature: Joi.number().min(90).max(110).optional(),
        respiratoryRate: Joi.number().min(5).max(50).optional(),
        oxygenSaturation: Joi.number().min(70).max(100).optional(),
        weight: Joi.number().min(1).max(1000).optional(),
        height: Joi.number().min(30).max(300).optional()
      }).optional()
    })
  },

  medication: {
    create: Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().required(),
      frequency: Joi.string().required(),
      route: Joi.string().valid('oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation').required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().min(Joi.ref('startDate')).optional(),
      patientId: Joi.string().uuid().required(),
      prescribedBy: Joi.string().uuid().required(),
      instructions: Joi.string().optional(),
      sideEffects: Joi.array().items(Joi.string()).optional()
    })
  }
};
