import { logger } from './logger';

/**
 * FHIR R4 Validator
 * Validates FHIR resources against FHIR R4 specification
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate FHIR resource structure
 */
export function validateFHIRResource(resource: any, resourceType: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check resourceType
  if (!resource.resourceType) {
    errors.push({
      field: 'resourceType',
      message: 'resourceType is required',
      severity: 'error',
    });
  } else if (resource.resourceType !== resourceType) {
    errors.push({
      field: 'resourceType',
      message: `Expected resourceType ${resourceType}, got ${resource.resourceType}`,
      severity: 'error',
    });
  }

  // Validate based on resource type
  switch (resourceType) {
    case 'Patient':
      validatePatient(resource, errors);
      break;
    case 'Observation':
      validateObservation(resource, errors);
      break;
    case 'Condition':
      validateCondition(resource, errors);
      break;
    case 'MedicationRequest':
      validateMedicationRequest(resource, errors);
      break;
    case 'Encounter':
      validateEncounter(resource, errors);
      break;
    default:
      // Generic validation
      validateGenericResource(resource, errors);
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

function validatePatient(resource: any, errors: ValidationError[]): void {
  if (!resource.name || resource.name.length === 0) {
    errors.push({
      field: 'name',
      message: 'Patient must have at least one name',
      severity: 'error',
    });
  }

  if (resource.gender && !['male', 'female', 'other', 'unknown'].includes(resource.gender)) {
    errors.push({
      field: 'gender',
      message: 'Invalid gender value',
      severity: 'error',
    });
  }

  if (resource.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(resource.birthDate)) {
    errors.push({
      field: 'birthDate',
      message: 'birthDate must be in YYYY-MM-DD format',
      severity: 'error',
    });
  }
}

function validateObservation(resource: any, errors: ValidationError[]): void {
  if (!resource.status) {
    errors.push({
      field: 'status',
      message: 'Observation status is required',
      severity: 'error',
    });
  }

  if (!resource.code) {
    errors.push({
      field: 'code',
      message: 'Observation code is required',
      severity: 'error',
    });
  }

  if (!resource.subject) {
    errors.push({
      field: 'subject',
      message: 'Observation subject (patient reference) is required',
      severity: 'error',
    });
  }
}

function validateCondition(resource: any, errors: ValidationError[]): void {
  if (!resource.code) {
    errors.push({
      field: 'code',
      message: 'Condition code is required',
      severity: 'error',
    });
  }

  if (!resource.subject) {
    errors.push({
      field: 'subject',
      message: 'Condition subject (patient reference) is required',
      severity: 'error',
    });
  }
}

function validateMedicationRequest(resource: any, errors: ValidationError[]): void {
  if (!resource.status) {
    errors.push({
      field: 'status',
      message: 'MedicationRequest status is required',
      severity: 'error',
    });
  }

  if (!resource.intent) {
    errors.push({
      field: 'intent',
      message: 'MedicationRequest intent is required',
      severity: 'error',
    });
  }

  if (!resource.medicationCodeableConcept && !resource.medicationReference) {
    errors.push({
      field: 'medication',
      message: 'MedicationRequest must have medication',
      severity: 'error',
    });
  }

  if (!resource.subject) {
    errors.push({
      field: 'subject',
      message: 'MedicationRequest subject (patient reference) is required',
      severity: 'error',
    });
  }
}

function validateEncounter(resource: any, errors: ValidationError[]): void {
  if (!resource.status) {
    errors.push({
      field: 'status',
      message: 'Encounter status is required',
      severity: 'error',
    });
  }

  if (!resource.class) {
    errors.push({
      field: 'class',
      message: 'Encounter class is required',
      severity: 'error',
    });
  }

  if (!resource.subject) {
    errors.push({
      field: 'subject',
      message: 'Encounter subject (patient reference) is required',
      severity: 'error',
    });
  }
}

function validateGenericResource(resource: any, errors: ValidationError[]): void {
  // Basic validation for any FHIR resource
  if (resource.id && typeof resource.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Resource id must be a string',
      severity: 'error',
    });
  }

  if (resource.meta && typeof resource.meta !== 'object') {
    errors.push({
      field: 'meta',
      message: 'Resource meta must be an object',
      severity: 'error',
    });
  }
}

/**
 * Validate FHIR Bundle
 */
export function validateBundle(bundle: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (bundle.resourceType !== 'Bundle') {
    errors.push({
      field: 'resourceType',
      message: 'Resource must be a Bundle',
      severity: 'error',
    });
  }

  if (!bundle.type) {
    errors.push({
      field: 'type',
      message: 'Bundle type is required',
      severity: 'error',
    });
  }

  const validTypes = ['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'];
  if (bundle.type && !validTypes.includes(bundle.type)) {
    errors.push({
      field: 'type',
      message: `Invalid bundle type: ${bundle.type}`,
      severity: 'error',
    });
  }

  if (bundle.entry && !Array.isArray(bundle.entry)) {
    errors.push({
      field: 'entry',
      message: 'Bundle entry must be an array',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

export default {
  validateFHIRResource,
  validateBundle,
};

