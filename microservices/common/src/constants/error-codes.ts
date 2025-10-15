/**
 * Standardized error codes across all microservices
 */

export const ERROR_CODES = {
  // Authentication & Authorization (1xxx)
  UNAUTHORIZED: 'AUTH_1001',
  INVALID_TOKEN: 'AUTH_1002',
  TOKEN_EXPIRED: 'AUTH_1003',
  INSUFFICIENT_PERMISSIONS: 'AUTH_1004',
  INVALID_CREDENTIALS: 'AUTH_1005',
  
  // Validation (2xxx)
  VALIDATION_ERROR: 'VAL_2001',
  INVALID_INPUT: 'VAL_2002',
  MISSING_REQUIRED_FIELD: 'VAL_2003',
  INVALID_FORMAT: 'VAL_2004',
  
  // Resource (3xxx)
  RESOURCE_NOT_FOUND: 'RES_3001',
  RESOURCE_ALREADY_EXISTS: 'RES_3002',
  RESOURCE_CONFLICT: 'RES_3003',
  
  // Database (4xxx)
  DATABASE_ERROR: 'DB_4001',
  DATABASE_CONNECTION_FAILED: 'DB_4002',
  QUERY_FAILED: 'DB_4003',
  TRANSACTION_FAILED: 'DB_4004',
  
  // External Service (5xxx)
  SERVICE_UNAVAILABLE: 'SVC_5001',
  SERVICE_TIMEOUT: 'SVC_5002',
  SERVICE_ERROR: 'SVC_5003',
  GATEWAY_ERROR: 'SVC_5004',
  
  // Business Logic (6xxx)
  BUSINESS_RULE_VIOLATION: 'BIZ_6001',
  APPOINTMENT_CONFLICT: 'BIZ_6002',
  INSUFFICIENT_BALANCE: 'BIZ_6003',
  INVALID_OPERATION: 'BIZ_6004',
  
  // Payment (7xxx)
  PAYMENT_FAILED: 'PAY_7001',
  PAYMENT_GATEWAY_ERROR: 'PAY_7002',
  INSUFFICIENT_FUNDS: 'PAY_7003',
  REFUND_FAILED: 'PAY_7004',
  
  // System (9xxx)
  INTERNAL_ERROR: 'SYS_9001',
  NOT_IMPLEMENTED: 'SYS_9002',
  MAINTENANCE_MODE: 'SYS_9003',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ERROR_CODES.UNAUTHORIZED]: 'Unauthorized access',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions to perform this action',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid username or password',
  
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid data format',
  
  // Resource
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'Resource conflict detected',
  
  // Database
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred',
  [ERROR_CODES.DATABASE_CONNECTION_FAILED]: 'Failed to connect to database',
  [ERROR_CODES.QUERY_FAILED]: 'Database query failed',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Database transaction failed',
  
  // External Service
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is currently unavailable',
  [ERROR_CODES.SERVICE_TIMEOUT]: 'Service request timed out',
  [ERROR_CODES.SERVICE_ERROR]: 'External service error',
  [ERROR_CODES.GATEWAY_ERROR]: 'API Gateway error',
  
  // Business Logic
  [ERROR_CODES.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ERROR_CODES.APPOINTMENT_CONFLICT]: 'Appointment time slot conflict',
  [ERROR_CODES.INSUFFICIENT_BALANCE]: 'Insufficient account balance',
  [ERROR_CODES.INVALID_OPERATION]: 'Invalid operation',
  
  // Payment
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment processing failed',
  [ERROR_CODES.PAYMENT_GATEWAY_ERROR]: 'Payment gateway error',
  [ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds',
  [ERROR_CODES.REFUND_FAILED]: 'Refund processing failed',
  
  // System
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.NOT_IMPLEMENTED]: 'Feature not yet implemented',
  [ERROR_CODES.MAINTENANCE_MODE]: 'System is under maintenance',
};

