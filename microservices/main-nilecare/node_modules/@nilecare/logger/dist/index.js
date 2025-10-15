"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
exports.createChildLogger = createChildLogger;
exports.createRequestLogger = createRequestLogger;
exports.formatError = formatError;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Create a structured logger for a microservice
 */
function createLogger(serviceName, options) {
    const config = {
        serviceName,
        level: (options?.level || process.env.LOG_LEVEL || 'info'),
        enableConsole: options?.enableConsole !== false,
        enableFile: options?.enableFile !== false,
        logDirectory: options?.logDirectory || process.env.LOG_DIR || 'logs',
        colorize: options?.colorize !== false
    };
    // Ensure log directory exists
    if (config.enableFile && config.logDirectory) {
        if (!fs_1.default.existsSync(config.logDirectory)) {
            fs_1.default.mkdirSync(config.logDirectory, { recursive: true });
        }
    }
    const transports = [];
    // Console transport
    if (config.enableConsole) {
        transports.push(new winston_1.default.transports.Console({
            format: config.colorize
                ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
                    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} [${level}] ${message}${metaStr} ${JSON.stringify({ service })}`;
                }))
                : winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.json())
        }));
    }
    // File transports
    if (config.enableFile && config.logDirectory) {
        // Error log file
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(config.logDirectory, `${serviceName}-error.log`),
            level: 'error',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        }));
        // Combined log file
        transports.push(new winston_1.default.transports.File({
            filename: path_1.default.join(config.logDirectory, `${serviceName}-combined.log`),
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        }));
    }
    // Create logger
    const logger = winston_1.default.createLogger({
        level: config.level,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
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
function createChildLogger(parentLogger, additionalMeta) {
    return parentLogger.child(additionalMeta);
}
/**
 * Express middleware for request logging
 */
function createRequestLogger(logger) {
    return (req, res, next) => {
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
function formatError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...error
        };
    }
    return { error: String(error) };
}
exports.default = createLogger;
