/**
 * EHR Service - Logger Utility
 * 
 * HIPAA-compliant logging for clinical documentation
 * Special handling for PHI in clinical notes
 * 
 * Based on Clinical Service and CDS Service patterns
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
 * PHI-safe logging format
 * Clinical documentation contains the most sensitive PHI
 * NEVER log clinical note content, patient names, or identifiers in production
 */
const phiSafeFormat = winston.format((info) => {
  if (process.env.NODE_ENV === 'production') {
    const phiFields = [
      'patientId', 'patientName', 'ssn', 'mrn', 'dob', 'phone', 'email',
      'subjective', 'objective', 'assessment', 'plan', // SOAP note content
      'problemName', 'diagnosis', 'clinicalNote'
    ];
    
    phiFields.forEach(field => {
      if (info[field]) {
        info[field] = '[REDACTED-PHI]';
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
    service: 'ehr-service',
    version: '1.0.0'
  },
  transports: [
    // Error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Clinical documentation log (for audit)
    new winston.transports.File({
      filename: path.join(logsDir, 'clinical-docs.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 20 // Keep more for legal/audit reasons
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
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
 * Log clinical document action
 * Special audit logging for SOAP notes, problem lists, etc.
 */
export function logClinicalDocumentAction(data: {
  action: 'created' | 'updated' | 'finalized' | 'amended' | 'viewed' | 'exported';
  documentType: 'soap-note' | 'problem-list' | 'progress-note' | 'clinical-document';
  documentId: string;
  patientId: string;
  userId: string;
  facilityId?: string;
}) {
  logger.info('Clinical document action', {
    action: data.action,
    documentType: data.documentType,
    documentId: data.documentId,
    patientId: process.env.NODE_ENV === 'production' ? '[REDACTED]' : data.patientId,
    userId: data.userId,
    facilityId: data.facilityId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log document finalization (immutable action)
 */
export function logDocumentFinalization(data: {
  documentId: string;
  documentType: string;
  patientId: string;
  finalizedBy: string;
}) {
  logger.warn('DOCUMENT FINALIZED (IMMUTABLE)', {
    documentId: data.documentId,
    documentType: data.documentType,
    patientId: process.env.NODE_ENV === 'production' ? '[REDACTED]' : data.patientId,
    finalizedBy: data.finalizedBy,
    timestamp: new Date().toISOString(),
    warning: 'This document can no longer be edited - only amended'
  });
}

export default logger;

