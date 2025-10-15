/**
 * Request Logger Middleware
 * Logs all HTTP requests and responses
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Skip health checks to reduce noise
  if (req.path === '/health' || req.path === '/health/ready') {
    return next();
  }

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data): Response {
    const duration = Date.now() - startTime;

    // Log response
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });

    return originalSend.call(this, data);
  };

  next();
};

export default requestLogger;

