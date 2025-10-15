/**
 * @nilecare/logger
 * 
 * Centralized structured logging for NileCare microservices.
 * Built on Winston with consistent formatting and log levels.
 * 
 * Usage:
 * ```typescript
 * import { createLogger } from '@nilecare/logger';
 * 
 * const logger = createLogger('my-service');
 * 
 * logger.info('User logged in', { userId: '123', ip: '1.2.3.4' });
 * logger.error('Payment failed', { orderId: '456', error: err.message });
 * logger.warn('Rate limit approaching', { current: 95, limit: 100 });
 * ```
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

export interface LoggerOptions {
  serviceName: string;
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  logDirectory?: string;
  colorize?: boolean;
}

/**
 * Create a structured logger for a microservice
 */
export function createLogger(serviceName: string, options?: Partial<Omit<LoggerOptions, 'serviceName'>>): winston.Logger {
  const config: LoggerOptions = {
    serviceName,
    level: (options?.level || process.env.LOG_LEVEL || 'info') as LogLevel,
    enableConsole: options?.enableConsole !== false,
    enableFile: options?.enableFile !== false,
    logDirectory: options?.logDirectory || process.env.LOG_DIR || 'logs',
    colorize: options?.colorize !== false
  };

  // Ensure log directory exists
  if (config.enableFile && config.logDirectory) {
    if (!fs.existsSync(config.logDirectory)) {
      fs.mkdirSync(config.logDirectory, { recursive: true });
    }
  }

  const transports: winston.transport[] = [];

  // Console transport
  if (config.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: config.colorize
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}] ${message}${metaStr} ${JSON.stringify({ service })}`;
              })
            )
          : winston.format.combine(
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.json()
            )
      })
    );
  }

  // File transports
  if (config.enableFile && config.logDirectory) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDirectory, `${serviceName}-error.log`),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(config.logDirectory, `${serviceName}-combined.log`),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  // Create logger
  const logger = winston.createLogger({
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { 
      service: serviceName,
      environment: process.env.NODE_ENV || 'development'
    },
    transports
  });

  return logger;
}

/**
 * Create a child logger with additional default metadata
 */
export function createChildLogger(
  parentLogger: winston.Logger,
  additionalMeta: Record<string, any>
): winston.Logger {
  return parentLogger.child(additionalMeta);
}

/**
 * Express middleware for request logging
 */
export function createRequestLogger(logger: winston.Logger) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Log request
    logger.http('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'http';

      logger.log(level, 'Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    });

    next();
  };
}

/**
 * Format error for logging
 */
export function formatError(error: Error | any): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any)
    };
  }
  return { error: String(error) };
}

export default createLogger;

