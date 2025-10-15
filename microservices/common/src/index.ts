/**
 * @nilecare/common
 * Shared library for NileCare microservices
 * 
 * Export all shared types, DTOs, utilities, and constants
 */

// Types
export * from './types/user.types';
export * from './types/patient.types';
export * from './types/appointment.types';
export * from './types/billing.types';
export * from './types/payment.types';
export * from './types/common.types';

// DTOs
export * from './dto/user.dto';
export * from './dto/patient.dto';
export * from './dto/appointment.dto';
export * from './dto/billing.dto';
export * from './dto/payment.dto';

// Utilities
export * from './utils/validation';
export * from './utils/formatters';
export * from './utils/date-helpers';
export * from './utils/logger';
export * from './utils/http-client';

// Constants
export * from './constants/roles';
export * from './constants/status';
export * from './constants/error-codes';
export * from './constants/service-ports';

// Enums
export * from './enums/appointment-status.enum';
export * from './enums/payment-status.enum';
export * from './enums/user-role.enum';

