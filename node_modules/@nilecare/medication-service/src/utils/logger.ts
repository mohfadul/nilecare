import winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured logging for the Medication Service
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
      filename: 'logs/medication-service-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/medication-service-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/medication-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/medication-service-rejections.log' }),
  ],
});

/**
 * Log medication dispensing (HIPAA audit requirement)
 */
export function logMedicationDispensing(params: {
  userId: string;
  userRole: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  quantity: number;
  prescriptionId?: string;
  verificationMethod?: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('MEDICATION_DISPENSED', {
    event: 'medication_dispensing',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    medicationId: params.medicationId,
    medicationName: params.medicationName,
    dosage: params.dosage,
    quantity: params.quantity,
    prescriptionId: params.prescriptionId,
    verificationMethod: params.verificationMethod || 'manual',
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log medication administration (HIPAA audit requirement)
 */
export function logMedicationAdministration(params: {
  userId: string;
  userRole: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  route: string;
  marEntryId?: string;
  barcodeVerified?: boolean;
  highAlert?: boolean;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('MEDICATION_ADMINISTERED', {
    event: 'medication_administration',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    medicationId: params.medicationId,
    medicationName: params.medicationName,
    dosage: params.dosage,
    route: params.route,
    marEntryId: params.marEntryId,
    barcodeVerified: params.barcodeVerified || false,
    highAlert: params.highAlert || false,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log high-alert medication events (critical safety)
 */
export function logHighAlertEvent(params: {
  userId: string;
  userRole: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  details?: any;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.warn('HIGH_ALERT_MEDICATION', {
    event: 'high_alert_medication',
    userId: params.userId,
    userRole: params.userRole,
    patientId: params.patientId,
    medicationId: params.medicationId,
    medicationName: params.medicationName,
    alertLevel: params.alertLevel,
    action: params.action,
    details: params.details,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log barcode verification failures (security audit)
 */
export function logBarcodeVerificationFailure(params: {
  userId: string;
  patientId: string;
  medicationId: string;
  barcodeData: string;
  reason: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.warn('BARCODE_VERIFICATION_FAILED', {
    event: 'barcode_verification_failed',
    userId: params.userId,
    patientId: params.patientId,
    medicationId: params.medicationId,
    barcodeData: params.barcodeData,
    reason: params.reason,
    facilityId: params.facilityId,
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

