/**
 * Proxy Service
 * Handles HTTP and WebSocket proxying to backend services
 */

import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import { logger } from '../utils/logger';
import { Request, Response } from 'express';
import type { ClientRequest, IncomingMessage } from 'http';

export class ProxyService {
  /**
   * Create HTTP proxy middleware
   */
  createProxy(pathPrefix: string, options: ProxyOptions): any {
    return createProxyMiddleware({
      ...options,
      onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
        // Log proxy request
        logger.info('Proxying request', {
          method: req.method,
          originalUrl: req.originalUrl,
          target: options.target,
          path: proxyReq.path,
        });

        // Add custom headers
        proxyReq.setHeader('X-Gateway-Forwarded', 'true');
        proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
        proxyReq.setHeader('X-Forwarded-For', req.ip || '');
        proxyReq.setHeader('X-Forwarded-Host', req.hostname);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);

        // Forward user information if available
        if (req.user) {
          proxyReq.setHeader('X-User-Id', (req.user as any).userId || '');
          proxyReq.setHeader('X-User-Role', (req.user as any).role || '');
          proxyReq.setHeader('X-User-Email', (req.user as any).email || '');
        }

        // Call original onProxyReq if provided
        if (options.onProxyReq) {
          options.onProxyReq(proxyReq, req as any, res as any);
        }
      },
      onProxyRes: (proxyRes: IncomingMessage, req: Request, res: Response) => {
        // Log proxy response
        logger.info('Proxy response received', {
          method: req.method,
          originalUrl: req.originalUrl,
          statusCode: proxyRes.statusCode,
          target: options.target,
        });

        // Add CORS headers if needed
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';

        // Call original onProxyRes if provided
        if (options.onProxyRes) {
          options.onProxyRes(proxyRes, req as any, res as any);
        }
      },
      onError: (err: Error, req: Request, res: Response) => {
        logger.error('Proxy error', {
          error: err.message,
          method: req.method,
          originalUrl: req.originalUrl,
          target: options.target,
          stack: err.stack,
        });

        // Check if response headers are already sent
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: {
              code: 'PROXY_ERROR',
              message: 'Failed to proxy request to backend service',
              details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Call original onError if provided
        if (options.onError) {
          options.onError(err, req as any, res as any, options.target);
        }
      },
      logLevel: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'warn',
    });
  }

  /**
   * Create WebSocket proxy middleware
   */
  createWebSocketProxy(options: ProxyOptions): any {
    return createProxyMiddleware({
      ...options,
      ws: true,
      onProxyReqWs: (proxyReq: ClientRequest, req: IncomingMessage, socket: any, options: any, head: any) => {
        logger.info('Proxying WebSocket connection', {
          url: req.url,
          target: options.target,
        });

        // Add custom headers for WebSocket
        proxyReq.setHeader('X-Gateway-Forwarded', 'true');
        proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '');

        // Call original onProxyReqWs if provided
        if (options.onProxyReqWs) {
          options.onProxyReqWs(proxyReq, req, socket, options as any, head);
        }
      },
      onError: (err: Error, req: IncomingMessage, res: any) => {
        logger.error('WebSocket proxy error', {
          error: err.message,
          url: req.url,
          target: options.target,
        });

        if (options.onError) {
          options.onError(err, req as any, res as any, options.target);
        }
      },
      logLevel: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'warn',
    });
  }

  /**
   * Create circuit breaker proxy (for resilience)
   */
  createResilientProxy(pathPrefix: string, options: ProxyOptions & { circuitBreaker?: boolean }): any {
    const { circuitBreaker = false, ...proxyOptions } = options;

    if (!circuitBreaker) {
      return this.createProxy(pathPrefix, proxyOptions);
    }

    // Circuit breaker state
    let failureCount = 0;
    let lastFailureTime = 0;
    const failureThreshold = 5;
    const resetTimeout = 60000; // 1 minute

    const originalOnError = proxyOptions.onError;
    proxyOptions.onError = (err: Error, req: Request, res: Response, target?: any) => {
      failureCount++;
      lastFailureTime = Date.now();

      logger.warn('Circuit breaker: failure recorded', {
        failureCount,
        threshold: failureThreshold,
        target: options.target,
      });

      if (originalOnError) {
        originalOnError(err, req as any, res as any, target);
      }
    };

    // Wrap proxy with circuit breaker check
    const proxy = this.createProxy(pathPrefix, proxyOptions);

    return (req: Request, res: Response, next: any) => {
      // Check if circuit is open
      if (failureCount >= failureThreshold) {
        const timeSinceLastFailure = Date.now() - lastFailureTime;

        if (timeSinceLastFailure < resetTimeout) {
          logger.warn('Circuit breaker: circuit is open', {
            target: options.target,
            failureCount,
          });

          return res.status(503).json({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable (circuit breaker open)',
            },
            timestamp: new Date().toISOString(),
          });
        } else {
          // Reset circuit breaker
          logger.info('Circuit breaker: resetting', { target: options.target });
          failureCount = 0;
        }
      }

      // Proxy the request
      proxy(req, res, next);
    };
  }
}

