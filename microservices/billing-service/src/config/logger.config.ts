/**
 * Logger Configuration
 * Winston logger setup for billing service
 */

import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0 && meta.timestamp === undefined) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger
export const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { 
    service: 'billing-service',
    environment: nodeEnv
  },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: nodeEnv === 'production' ? customFormat : consoleFormat
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Billing-specific log
    new winston.transports.File({
      filename: path.join(logsDir, 'billing.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  
  // Handle exceptions and rejections
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

// Create specialized loggers
export const auditLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  defaultMeta: { service: 'billing-service', type: 'audit' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760,
      maxFiles: 20
    })
  ]
});

export const securityLogger = winston.createLogger({
  level: 'warn',
  format: customFormat,
  defaultMeta: { service: 'billing-service', type: 'security' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10485760,
      maxFiles: 10
    }),
    new winston.transports.Console()
  ]
});

export default logger;

