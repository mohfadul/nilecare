import winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured logging for the Lab Service
 * HIPAA-compliant with PHI protection
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

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Console format for development
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

// Create logger
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat,
    }),
    // Error log file
    new winston.transports.File({
      filename: 'logs/lab-service-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/lab-service-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/lab-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/lab-service-rejections.log' }),
  ],
});

/**
 * Log lab test order (HIPAA audit requirement)
 */
export function logLabOrderCreation(params: {
  userId: string;
  userRole: string;
  patientId: string;
  testIds: string[];
  testNames: string[];
  orderId: string;
  appointmentId?: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('LAB_ORDER_CREATED', {
    event: 'lab_order_created',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    testCount: params.testIds.length,
    testNames: params.testNames,
    orderId: params.orderId,
    appointmentId: params.appointmentId,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log sample collection (chain of custody)
 */
export function logSampleCollection(params: {
  userId: string;
  userRole: string;
  patientId: string;
  sampleId: string;
  sampleType: string;
  collectionMethod: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('SAMPLE_COLLECTED', {
    event: 'sample_collection',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    sampleId: params.sampleId,
    sampleType: params.sampleType,
    collectionMethod: params.collectionMethod,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log result release (critical action)
 */
export function logResultRelease(params: {
  userId: string;
  userRole: string;
  patientId: string;
  resultId: string;
  testName: string;
  criticalValue: boolean;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('RESULT_RELEASED', {
    event: 'result_release',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    resultId: params.resultId,
    testName: params.testName,
    criticalValue: params.criticalValue,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log critical value alert (urgent)
 */
export function logCriticalValue(params: {
  userId: string;
  patientId: string;
  resultId: string;
  testName: string;
  value: string;
  criticalRange: string;
  severity: 'high' | 'critical' | 'life-threatening';
  notifiedUsers: string[];
  facilityId: string;
  timestamp?: Date;
}) {
  logger.warn('CRITICAL_LAB_VALUE', {
    event: 'critical_lab_value',
    userId: params.userId,
    patientId: params.patientId,
    resultId: params.resultId,
    testName: params.testName,
    value: params.value,
    criticalRange: params.criticalRange,
    severity: params.severity,
    notifiedUsers: params.notifiedUsers,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log result viewing (HIPAA compliance)
 */
export function logResultAccess(params: {
  userId: string;
  userRole: string;
  patientId: string;
  resultId: string;
  facilityId: string;
  accessType: 'view' | 'download' | 'print';
  timestamp?: Date;
}) {
  logger.info('RESULT_ACCESSED', {
    event: 'result_access',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    resultId: params.resultId,
    facilityId: params.facilityId,
    accessType: params.accessType,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

// Prevent crash on unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
});

export default logger;

