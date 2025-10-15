import winston from 'winston';

/**
 * Winston Logger Configuration for FHIR Service
 * HIPAA-compliant logging for FHIR R4 operations
 */

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    if (stack) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat,
    }),
    new winston.transports.File({
      filename: 'logs/fhir-service-error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/fhir-service-combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/fhir-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/fhir-service-rejections.log' }),
  ],
});

/**
 * Log FHIR resource creation (HIPAA audit)
 */
export function logFHIRResourceCreated(params: {
  userId: string;
  resourceType: string;
  resourceId: string;
  patientId?: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('FHIR_RESOURCE_CREATED', {
    event: 'fhir_resource_created',
    userId: params.userId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    patientId: params.patientId,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log FHIR resource access (HIPAA audit)
 */
export function logFHIRResourceAccess(params: {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: 'read' | 'search' | 'update' | 'delete';
  patientId?: string;
  success: boolean;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('FHIR_RESOURCE_ACCESS', {
    event: 'fhir_resource_access',
    userId: params.userId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    patientId: params.patientId,
    success: params.success,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log bulk data export (HIPAA audit - critical)
 */
export function logBulkDataExport(params: {
  userId: string;
  exportType: string;
  resourceTypes: string[];
  patientCount?: number;
  requestId: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('BULK_DATA_EXPORT', {
    event: 'bulk_data_export',
    userId: params.userId,
    exportType: params.exportType,
    resourceTypes: params.resourceTypes,
    patientCount: params.patientCount,
    requestId: params.requestId,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log SMART authorization (OAuth2 audit)
 */
export function logSMARTAuthorization(params: {
  userId?: string;
  clientId: string;
  scopes: string[];
  grantType: string;
  success: boolean;
  reason?: string;
  timestamp?: Date;
}) {
  logger.info('SMART_AUTHORIZATION', {
    event: 'smart_authorization',
    userId: params.userId,
    clientId: params.clientId,
    scopes: params.scopes,
    grantType: params.grantType,
    success: params.success,
    reason: params.reason,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
});

export default logger;

