import { Request, Response, NextFunction } from 'express';
import { validateFHIRResource, validateBundle } from '../utils/fhirValidator';
import { createOperationOutcome } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * FHIR Validation Middleware
 * Validates FHIR resources before processing
 */

export function fhirValidator(req: Request, res: Response, next: NextFunction): void {
  // Skip validation for GET requests
  if (req.method === 'GET' || req.method === 'DELETE') {
    return next();
  }

  // Skip if no body
  if (!req.body) {
    return next();
  }

  const resource = req.body;

  // Handle Bundle resources
  if (resource.resourceType === 'Bundle') {
    const validation = validateBundle(resource);
    
    if (!validation.valid) {
      const errorMessages = validation.errors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');

      logger.warn('FHIR Bundle validation failed', {
        errors: validation.errors,
        url: req.originalUrl,
      });

      const operationOutcome = createOperationOutcome(
        'error',
        'invalid',
        `Bundle validation failed: ${errorMessages}`
      );

      return res.status(400).json(operationOutcome);
    }

    return next();
  }

  // Extract resource type from URL (e.g., /fhir/Patient)
  const urlParts = req.path.split('/');
  const resourceTypeFromUrl = urlParts[urlParts.indexOf('fhir') + 1];

  if (resourceTypeFromUrl) {
    const validation = validateFHIRResource(resource, resourceTypeFromUrl);
    
    if (!validation.valid) {
      const errorMessages = validation.errors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');

      logger.warn('FHIR resource validation failed', {
        resourceType: resourceTypeFromUrl,
        errors: validation.errors,
        url: req.originalUrl,
      });

      const operationOutcome = createOperationOutcome(
        'error',
        'invalid',
        `Resource validation failed: ${errorMessages}`
      );

      return res.status(400).json(operationOutcome);
    }
  }

  next();
}

export default fhirValidator;

