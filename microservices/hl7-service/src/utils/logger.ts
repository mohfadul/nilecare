import winston from 'winston';

/**
 * Winston Logger for HL7 Service
 * Specialized logging for HL7 v2.x messages
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
      filename: 'logs/hl7-service-error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/hl7-service-combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/hl7-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/hl7-service-rejections.log' }),
  ],
});

/**
 * Log HL7 message received (audit)
 */
export function logHL7MessageReceived(params: {
  messageId: string;
  messageType: string;
  source: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('HL7_MESSAGE_RECEIVED', {
    event: 'hl7_message_received',
    messageId: params.messageId,
    messageType: params.messageType,
    source: params.source,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log HL7 message sent (audit)
 */
export function logHL7MessageSent(params: {
  messageId: string;
  messageType: string;
  destination: string;
  success: boolean;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('HL7_MESSAGE_SENT', {
    event: 'hl7_message_sent',
    messageId: params.messageId,
    messageType: params.messageType,
    destination: params.destination,
    success: params.success,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log HL7 transformation (HL7 ↔ FHIR)
 */
export function logHL7Transformation(params: {
  userId?: string;
  sourceFormat: 'HL7' | 'FHIR';
  targetFormat: 'HL7' | 'FHIR';
  messageType: string;
  success: boolean;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('HL7_TRANSFORMATION', {
    event: 'hl7_transformation',
    userId: params.userId,
    sourceFormat: params.sourceFormat,
    targetFormat: params.targetFormat,
    messageType: params.messageType,
    success: params.success,
    facilityId: params.facilityId,
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

