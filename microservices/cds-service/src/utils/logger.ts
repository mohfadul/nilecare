/**
 * Clinical Decision Support Service - Logger Utility
 * 
 * HIPAA-compliant logging with PHI protection
 * Based on Clinical Service logger pattern
 * 
 * @see Clinical Service utils/logger.ts for reference
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom format for PHI-safe logging
 * NEVER log patient identifiers, names, or medical data in production
 */
const phiSafeFormat = winston.format((info) => {
  // Redact common PHI fields in production
  if (process.env.NODE_ENV === 'production') {
    const phiFields = ['patientId', 'patientName', 'ssn', 'mrn', 'dob', 'phone', 'email'];
    phiFields.forEach(field => {
      if (info[field]) {
        info[field] = '[REDACTED]';
      }
    });
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  phiSafeFormat(),
  winston.format.json(),
  winston.format.prettyPrint()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'cds-service',
    version: '1.0.0'
  },
  transports: [
    // Error log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Safety checks log file (for audit)
    new winston.transports.File({
      filename: path.join(logsDir, 'safety-checks.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ],
  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
      })
    )
  }));
}

/**
 * Log safety check performed
 * Special logging for clinical decision support actions
 */
export function logSafetyCheck(data: {
  checkType: string;
  patientId: string;
  medications?: string[];
  riskLevel?: string;
  findings?: any;
  performedBy?: string;
}) {
  logger.info('Safety check performed', {
    checkType: data.checkType,
    patientId: process.env.NODE_ENV === 'production' ? '[REDACTED]' : data.patientId,
    medicationCount: data.medications?.length || 0,
    riskLevel: data.riskLevel,
    hasFindings: !!data.findings,
    performedBy: data.performedBy,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log high-risk alert
 * Critical alerts are logged separately for monitoring
 */
export function logHighRiskAlert(data: {
  alertType: string;
  patientId: string;
  severity: string;
  details: any;
}) {
  logger.warn('HIGH RISK ALERT', {
    alertType: data.alertType,
    patientId: process.env.NODE_ENV === 'production' ? '[REDACTED]' : data.patientId,
    severity: data.severity,
    details: data.details,
    timestamp: new Date().toISOString()
  });
}

export default logger;

