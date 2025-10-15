/**
 * Shared Validation Package for NileCare
 * Provides validation middleware and schemas for all microservices
 * 
 * Issue #6 Fix: Missing Input Validation
 */

export * from './middleware/validationMiddleware';
export * from './schemas/patientSchema';
export * from './schemas/appointmentSchema';
export * from './schemas/userSchema';
export * from './schemas/deviceSchema';
export * from './schemas/paymentSchema';
export * from './utils/validationHelpers';

