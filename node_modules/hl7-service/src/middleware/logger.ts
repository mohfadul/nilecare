import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

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
      userId: (req as any).user?.userId,
    };

    if (res.statusCode >= 400) {
      logger.warn('HL7 Request', logData);
    } else {
      logger.http('HL7 Request', logData);
    }
  });

  next();
}

export default requestLogger;

