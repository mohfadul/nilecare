/**
 * Correlation ID Middleware
 * 
 * Tracks requests across microservices with a unique correlation ID
 * Enables end-to-end request tracing and debugging
 * 
 * USAGE:
 * ```typescript
 * import { correlationIdMiddleware } from '../../shared/middleware/correlation-id';
 * 
 * app.use(correlationIdMiddleware);
 * ```
 * 
 * ✅ FIX #10: Correlation ID tracking for distributed tracing
 */

import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestId?: string;
    }
  }
}

/**
 * Correlation ID Middleware
 * Extracts or generates correlation ID for request tracking
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract correlation ID from various header formats
  const correlationId = 
    req.headers['x-correlation-id'] as string ||
    req.headers['x-request-id'] as string ||
    req.headers['request-id'] as string ||
    uuidv4();
  
  // Generate request ID (unique for this specific request)
  const requestId = uuidv4();
  
  // Attach to request object
  req.correlationId = correlationId;
  req.requestId = requestId;
  
  // Add to response headers for client tracking
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', requestId);
  
  // Log the IDs
  console.log(`[Request] correlationId=${correlationId}, requestId=${requestId}, method=${req.method}, path=${req.path}`);
  
  next();
}

/**
 * Get correlation headers for service-to-service calls
 * Propagates correlation ID across microservices
 */
export function getCorrelationHeaders(req?: Request): Record<string, string> {
  const correlationId = req?.correlationId || uuidv4();
  const requestId = uuidv4(); // New request ID for this service call
  
  return {
    'X-Correlation-ID': correlationId,
    'X-Request-ID': requestId,
  };
}

/**
 * Extract correlation ID from request
 */
export function getCorrelationId(req: Request): string {
  return req.correlationId || req.requestId || 'unknown';
}

/**
 * Create child correlation ID for sub-requests
 * Format: {parent-id}.{child-sequence}
 */
export function createChildCorrelationId(parentId: string, sequence: number = 1): string {
  return `${parentId}.${sequence}`;
}

/**
 * Log with correlation ID context
 */
export function logWithCorrelation(
  req: Request,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: any
): void {
  const logData = {
    correlationId: req.correlationId,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    message,
    ...metadata
  };
  
  const logString = JSON.stringify(logData);
  
  switch (level) {
    case 'info':
      console.log(`[INFO] ${logString}`);
      break;
    case 'warn':
      console.warn(`[WARN] ${logString}`);
      break;
    case 'error':
      console.error(`[ERROR] ${logString}`);
      break;
  }
}

/**
 * Express middleware to log all requests with correlation ID
 */
export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  
  // Log request
  logWithCorrelation(req, 'info', 'Request received', {
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.get('user-agent'),
    ip: req.ip
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logWithCorrelation(req, 'info', 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

/**
 * Update service client to propagate correlation ID
 */
export class CorrelationAwareHttpClient {
  async get(url: string, req?: Request) {
    const headers = getCorrelationHeaders(req);
    return await axios.get(url, { headers });
  }
  
  async post(url: string, data: any, req?: Request) {
    const headers = getCorrelationHeaders(req);
    return await axios.post(url, data, { headers });
  }
}

export default {
  correlationIdMiddleware,
  getCorrelationHeaders,
  getCorrelationId,
  createChildCorrelationId,
  logWithCorrelation,
  requestLoggingMiddleware,
  CorrelationAwareHttpClient
};

