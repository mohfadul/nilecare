/**
 * Logger Utility
 * Winston-based structured logging for the Device Integration Service
 */

import winston from 'winston';
import path from 'path';
import { config } from '../config/env';

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

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...metadata } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// Add file transport in production
if (config.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_FILE_PATH, '../error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: config.LOG_FILE_PATH,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  levels: logLevels,
  format,
  transports,
});

export default logger;

