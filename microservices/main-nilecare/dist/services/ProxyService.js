"use strict";
/**
 * Proxy Service
 * Handles HTTP and WebSocket proxying to backend services
 *
 * ✅ Integrated from gateway-service into main-nilecare
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const logger_1 = require("@nilecare/logger");
const logger = (0, logger_1.createLogger)('proxy-service');
class ProxyService {
    /**
     * Create HTTP proxy middleware
     */
    createProxy(_pathPrefix, options) {
        return (0, http_proxy_middleware_1.createProxyMiddleware)({
            ...options,
            onProxyReq: (proxyReq, req, res) => {
                // Log proxy request
                logger.debug('Proxying request', {
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
                proxyReq.setHeader('X-Service-Name', 'main-nilecare');
                // Forward user information if available
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId || '');
                    proxyReq.setHeader('X-User-Role', req.user.role || '');
                    proxyReq.setHeader('X-User-Email', req.user.email || '');
                }
                // Call original onProxyReq if provided
                if (options.onProxyReq) {
                    options.onProxyReq(proxyReq, req, res, options.target);
                }
            },
            onProxyRes: (proxyRes, req, res) => {
                // Log proxy response
                logger.debug('Proxy response received', {
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
                    options.onProxyRes(proxyRes, req, res);
                }
            },
            onError: (err, req, res) => {
                logger.error('Proxy error', {
                    error: err.message,
                    method: req.method,
                    originalUrl: req.originalUrl,
                    target: options.target,
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
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
                        metadata: {
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                // Call original onError if provided
                if (options.onError) {
                    options.onError(err, req, res, options.target);
                }
            },
            logLevel: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'warn',
        });
    }
    /**
     * Create WebSocket proxy middleware
     */
    createWebSocketProxy(options) {
        return (0, http_proxy_middleware_1.createProxyMiddleware)({
            ...options,
            ws: true,
            onProxyReqWs: (proxyReq, req, socket, options, head) => {
                logger.info('Proxying WebSocket connection', {
                    url: req.url,
                    target: options.target,
                });
                // Add custom headers for WebSocket
                proxyReq.setHeader('X-Gateway-Forwarded', 'true');
                proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress || '');
                proxyReq.setHeader('X-Service-Name', 'main-nilecare');
                // Call original onProxyReqWs if provided
                if (options.onProxyReqWs) {
                    options.onProxyReqWs(proxyReq, req, socket, options, head);
                }
            },
            onError: (err, req, res) => {
                logger.error('WebSocket proxy error', {
                    error: err.message,
                    url: req.url,
                    target: options.target,
                });
                if (options.onError) {
                    options.onError(err, req, res, options.target);
                }
            },
            logLevel: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'warn',
        });
    }
}
exports.ProxyService = ProxyService;
//# sourceMappingURL=ProxyService.js.map