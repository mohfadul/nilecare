import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request Logger Middleware for FHIR Service
 */

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.userId,
      fhirResource: req.path.split('/')[2], // Extract resource type from /fhir/Patient
    };

    if (res.statusCode >= 400) {
      logger.warn('FHIR Request', logData);
    } else {
      logger.http('FHIR Request', logData);
    }
  });

  next();
}

export default requestLogger;

