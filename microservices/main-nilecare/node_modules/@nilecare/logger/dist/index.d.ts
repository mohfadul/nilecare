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
export declare function createLogger(serviceName: string, options?: Partial<Omit<LoggerOptions, 'serviceName'>>): winston.Logger;
/**
 * Create a child logger with additional default metadata
 */
export declare function createChildLogger(parentLogger: winston.Logger, additionalMeta: Record<string, any>): winston.Logger;
/**
 * Express middleware for request logging
 */
export declare function createRequestLogger(logger: winston.Logger): (req: any, res: any, next: any) => void;
/**
 * Format error for logging
 */
export declare function formatError(error: Error | any): Record<string, any>;
export default createLogger;
