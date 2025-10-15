/**
 * EHR Service - Validation Middleware
 * 
 * Request validation using Joi for clinical documentation data
 * Based on Clinical Service and CDS Service validation patterns
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

/**
 * Validate request against Joi schema
 */
export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      const validationError = createError('Validation Error', 400, 'VALIDATION_ERROR');
      validationError.message = errors.join('; ');
      return next(validationError);
    }

    next();
  };
};

/**
 * Common validation schemas for EHR Service
 */
export const schemas = {
  // UUID parameter validation
  uuid: Joi.string().uuid().required(),
  
  id: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'documentDate', 'finalizedAt').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // SOAP Note schemas
  soapNote: {
    create: Joi.object({
      encounterId: Joi.string().uuid().required(),
      patientId: Joi.string().uuid().required(),
      facilityId: Joi.string().uuid().optional(),
      
      // SOAP sections
      subjective: Joi.string().required().min(10).max(5000),
      objective: Joi.string().required().min(10).max(5000),
      assessment: Joi.string().required().min(10).max(5000),
      plan: Joi.string().required().min(10).max(5000),
      
      // Additional fields
      chiefComplaint: Joi.string().optional().max(500),
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
        height: Joi.number().min(30).max(300).optional(),
        bmi: Joi.number().min(10).max(100).optional()
      }).optional(),
      
      diagnoses: Joi.array().items(Joi.object({
        code: Joi.string().required(), // ICD-10 code
        description: Joi.string().required(),
        type: Joi.string().valid('primary', 'secondary', 'differential').optional()
      })).optional(),
      
      medications: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        frequency: Joi.string().required(),
        route: Joi.string().optional(),
        action: Joi.string().valid('continue', 'start', 'stop', 'modify').optional()
      })).optional(),
      
      orders: Joi.array().items(Joi.object({
        type: Joi.string().valid('lab', 'imaging', 'procedure', 'referral').required(),
        description: Joi.string().required(),
        urgency: Joi.string().valid('routine', 'urgent', 'stat').optional()
      })).optional(),
      
      followUp: Joi.object({
        interval: Joi.string().optional(),
        instructions: Joi.string().optional(),
        provider: Joi.string().optional()
      }).optional(),
      
      // Metadata
      templateId: Joi.string().uuid().optional(),
      tags: Joi.array().items(Joi.string()).optional()
    }),
    
    update: Joi.object({
      subjective: Joi.string().min(10).max(5000).optional(),
      objective: Joi.string().min(10).max(5000).optional(),
      assessment: Joi.string().min(10).max(5000).optional(),
      plan: Joi.string().min(10).max(5000).optional(),
      chiefComplaint: Joi.string().max(500).optional(),
      vitalSigns: Joi.object().optional(),
      diagnoses: Joi.array().optional(),
      medications: Joi.array().optional(),
      orders: Joi.array().optional(),
      followUp: Joi.object().optional(),
      tags: Joi.array().items(Joi.string()).optional()
    }).min(1), // At least one field must be provided
    
    finalize: Joi.object({
      signature: Joi.string().optional(),
      attestation: Joi.string().required().min(10).max(500),
      finalDiagnoses: Joi.array().items(Joi.object({
        code: Joi.string().required(),
        description: Joi.string().required(),
        type: Joi.string().valid('primary', 'secondary').required()
      })).min(1).optional()
    }),
    
    amend: Joi.object({
      reason: Joi.string().required().min(10).max(500),
      changes: Joi.string().required().min(10).max(2000),
      section: Joi.string().valid('subjective', 'objective', 'assessment', 'plan', 'all').required()
    })
  },

  // Problem List schemas
  problemList: {
    create: Joi.object({
      patientId: Joi.string().uuid().required(),
      facilityId: Joi.string().uuid().optional(),
      
      // Problem details
      problemName: Joi.string().required().min(3).max(200),
      icdCode: Joi.string().required(),
      snomedCode: Joi.string().optional(),
      
      // Clinical details
      onset: Joi.date().optional(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
      status: Joi.string().valid('active', 'chronic', 'intermittent', 'recurrent', 'inactive', 'resolved').required(),
      
      // Context
      diagnosedBy: Joi.string().uuid().optional(),
      diagnosedDate: Joi.date().optional(),
      resolvedDate: Joi.date().optional(),
      notes: Joi.string().max(1000).optional(),
      
      // Categorization
      category: Joi.string().valid('diagnosis', 'symptom', 'finding', 'complaint').optional(),
      priority: Joi.string().valid('low', 'medium', 'high').optional(),
      
      // Relationships
      relatedProblems: Joi.array().items(Joi.string().uuid()).optional(),
      
      // Metadata
      tags: Joi.array().items(Joi.string()).optional()
    }),
    
    update: Joi.object({
      problemName: Joi.string().min(3).max(200).optional(),
      icdCode: Joi.string().optional(),
      snomedCode: Joi.string().optional(),
      onset: Joi.date().optional(),
      severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
      status: Joi.string().valid('active', 'chronic', 'intermittent', 'recurrent', 'inactive', 'resolved').optional(),
      resolvedDate: Joi.date().optional(),
      notes: Joi.string().max(1000).optional(),
      category: Joi.string().optional(),
      priority: Joi.string().valid('low', 'medium', 'high').optional(),
      relatedProblems: Joi.array().items(Joi.string().uuid()).optional(),
      tags: Joi.array().items(Joi.string()).optional()
    }).min(1)
  },

  // Progress Note schemas
  progressNote: {
    create: Joi.object({
      patientId: Joi.string().uuid().required(),
      encounterId: Joi.string().uuid().optional(),
      facilityId: Joi.string().uuid().optional(),
      
      // Note content
      noteType: Joi.string().valid('daily', 'shift', 'discharge', 'procedure', 'consultation', 'transfer').required(),
      content: Joi.string().required().min(10).max(10000),
      
      // Clinical context
      vitalSigns: Joi.object().optional(),
      medications: Joi.array().optional(),
      interventions: Joi.array().items(Joi.string()).optional(),
      
      // Status tracking
      condition: Joi.string().valid('improving', 'stable', 'declining', 'critical').optional(),
      
      // Follow-up
      followUpNeeded: Joi.boolean().optional(),
      followUpDate: Joi.date().optional(),
      
      // Metadata
      tags: Joi.array().items(Joi.string()).optional()
    }),
    
    update: Joi.object({
      content: Joi.string().min(10).max(10000).optional(),
      vitalSigns: Joi.object().optional(),
      medications: Joi.array().optional(),
      interventions: Joi.array().optional(),
      condition: Joi.string().valid('improving', 'stable', 'declining', 'critical').optional(),
      followUpNeeded: Joi.boolean().optional(),
      followUpDate: Joi.date().optional(),
      tags: Joi.array().items(Joi.string()).optional()
    }).min(1)
  },

  // Document export schemas
  export: {
    request: Joi.object({
      documentId: Joi.string().uuid().required(),
      documentType: Joi.string().valid('soap-note', 'problem-list', 'progress-note', 'summary').required(),
      format: Joi.string().valid('pdf', 'html', 'xml', 'fhir-json').required(),
      includeSignatures: Joi.boolean().optional().default(true),
      watermark: Joi.string().optional(),
      letterhead: Joi.boolean().optional().default(false)
    })
  },

  // Search and filter schemas
  search: {
    documents: Joi.object({
      patientId: Joi.string().uuid().optional(),
      encounterId: Joi.string().uuid().optional(),
      facilityId: Joi.string().uuid().optional(),
      documentType: Joi.string().valid('soap-note', 'problem-list', 'progress-note').optional(),
      status: Joi.string().valid('draft', 'finalized', 'amended').optional(),
      fromDate: Joi.date().optional(),
      toDate: Joi.date().optional(),
      authorId: Joi.string().uuid().optional(),
      tags: Joi.array().items(Joi.string()).optional()
    })
  }
};

/**
 * Sanitize error message (remove any potential PHI)
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove common PHI patterns
  const phiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{10}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\bMRN[-:]\s*\d+/gi, // Medical record numbers
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names (basic pattern)
  ];

  let sanitized = message;
  phiPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
}

/**
 * Validate ICD-10 code format
 */
export function validateICD10Code(code: string): boolean {
  // ICD-10 format: Letter + 2 digits + optional decimal + optional 1-4 additional characters
  // Examples: A01, A01.1, A01.12, A01.123
  const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,4})?$/;
  return icd10Pattern.test(code);
}

/**
 * Validate SNOMED code format
 */
export function validateSNOMEDCode(code: string): boolean {
  // SNOMED codes are numeric, typically 6-18 digits
  const snomedPattern = /^\d{6,18}$/;
  return snomedPattern.test(code);
}

export default validateRequest;

