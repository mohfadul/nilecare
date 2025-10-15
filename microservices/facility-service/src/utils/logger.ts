import winston from 'winston';

/**
 * Winston Logger Configuration for Facility Service
 * Provides structured logging with HIPAA compliance
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
      filename: 'logs/facility-service-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/facility-service-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/facility-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/facility-service-rejections.log' }),
  ],
});

/**
 * Log facility creation (audit requirement)
 */
export function logFacilityCreation(params: {
  userId: string;
  userRole: string;
  facilityId: string;
  facilityName: string;
  facilityType: string;
  organizationId: string;
  timestamp?: Date;
}) {
  logger.info('FACILITY_CREATED', {
    event: 'facility_creation',
    userId: params.userId,
    userRole: params.userRole,
    facilityId: params.facilityId,
    facilityName: params.facilityName,
    facilityType: params.facilityType,
    organizationId: params.organizationId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log bed assignment (audit requirement)
 */
export function logBedAssignment(params: {
  userId: string;
  userRole: string;
  bedId: string;
  bedNumber: string;
  wardId: string;
  patientId?: string;
  action: 'assign' | 'release';
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('BED_ASSIGNMENT', {
    event: 'bed_assignment',
    userId: params.userId,
    userRole: params.userRole,
    bedId: params.bedId,
    bedNumber: params.bedNumber,
    wardId: params.wardId,
    patientId: params.patientId,
    action: params.action,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log capacity update (audit requirement)
 */
export function logCapacityUpdate(params: {
  userId: string;
  userRole: string;
  wardId: string;
  wardName: string;
  oldCapacity: number;
  newCapacity: number;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('CAPACITY_UPDATED', {
    event: 'capacity_update',
    userId: params.userId,
    userRole: params.userRole,
    wardId: params.wardId,
    wardName: params.wardName,
    oldCapacity: params.oldCapacity,
    newCapacity: params.newCapacity,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log facility access (security audit)
 */
export function logFacilityAccess(params: {
  userId: string;
  userRole: string;
  facilityId: string;
  action: string;
  resourceType: string;
  success: boolean;
  reason?: string;
  timestamp?: Date;
}) {
  logger.info('FACILITY_ACCESS', {
    event: 'facility_access',
    userId: params.userId,
    userRole: params.userRole,
    facilityId: params.facilityId,
    action: params.action,
    resourceType: params.resourceType,
    success: params.success,
    reason: params.reason,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log department creation
 */
export function logDepartmentCreation(params: {
  userId: string;
  facilityId: string;
  departmentId: string;
  departmentName: string;
  timestamp?: Date;
}) {
  logger.info('DEPARTMENT_CREATED', {
    event: 'department_creation',
    userId: params.userId,
    facilityId: params.facilityId,
    departmentId: params.departmentId,
    departmentName: params.departmentName,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log ward status change
 */
export function logWardStatusChange(params: {
  userId: string;
  wardId: string;
  wardName: string;
  oldStatus: string;
  newStatus: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('WARD_STATUS_CHANGED', {
    event: 'ward_status_change',
    userId: params.userId,
    wardId: params.wardId,
    wardName: params.wardName,
    oldStatus: params.oldStatus,
    newStatus: params.newStatus,
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

