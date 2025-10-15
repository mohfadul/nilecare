/**
 * Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${statusColor}${res.statusCode}\x1b[0m ${duration}ms`
    );
  });

  next();
};

