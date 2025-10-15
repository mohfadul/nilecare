"use strict";
/**
 * @nilecare/metrics
 *
 * Prometheus metrics collection for production monitoring.
 *
 * Usage:
 * ```typescript
 * import { MetricsManager, metricsMiddleware } from '@nilecare/metrics';
 *
 * const metrics = new MetricsManager('my-service');
 * app.use(metricsMiddleware(metrics));
 *
 * // Expose metrics endpoint
 * app.get('/metrics', (req, res) => {
 *   res.set('Content-Type', metrics.contentType);
 *   res.send(metrics.getMetrics());
 * });
 * ```
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsManager = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.createMetricsEndpoint = createMetricsEndpoint;
const prom_client_1 = __importDefault(require("prom-client"));
class MetricsManager {
    constructor(serviceName) {
        this.register = new prom_client_1.default.Registry();
        this.contentType = prom_client_1.default.Registry.PROMETHEUS_CONTENT_TYPE;
        // ===== HTTP REQUEST METRICS =====
        this.httpRequestDuration = new prom_client_1.default.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register]
        });
        this.httpRequestTotal = new prom_client_1.default.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register]
        });
        this.httpRequestSize = new prom_client_1.default.Histogram({
            name: 'http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route'],
            buckets: [100, 1000, 10000, 100000, 1000000],
            registers: [this.register]
        });
        this.httpResponseSize = new prom_client_1.default.Histogram({
            name: 'http_response_size_bytes',
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [100, 1000, 10000, 100000, 1000000],
            registers: [this.register]
        });
        this.activeConnections = new prom_client_1.default.Gauge({
            name: 'active_connections',
            help: 'Number of active connections',
            registers: [this.register]
        });
        // ===== CACHE METRICS =====
        this.cacheHits = new prom_client_1.default.Counter({
            name: 'cache_hits_total',
            help: 'Total number of cache hits',
            labelNames: ['cache_name'],
            registers: [this.register]
        });
        this.cacheMisses = new prom_client_1.default.Counter({
            name: 'cache_misses_total',
            help: 'Total number of cache misses',
            labelNames: ['cache_name'],
            registers: [this.register]
        });
        this.cacheSize = new prom_client_1.default.Gauge({
            name: 'cache_size_items',
            help: 'Number of items in cache',
            labelNames: ['cache_name'],
            registers: [this.register]
        });
        // ===== CIRCUIT BREAKER METRICS =====
        this.circuitBreakerState = new prom_client_1.default.Gauge({
            name: 'circuit_breaker_state',
            help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
            labelNames: ['service_name'],
            registers: [this.register]
        });
        this.circuitBreakerFailures = new prom_client_1.default.Counter({
            name: 'circuit_breaker_failures_total',
            help: 'Total number of circuit breaker failures',
            labelNames: ['service_name'],
            registers: [this.register]
        });
        // ===== SERVICE HEALTH METRICS =====
        this.serviceHealth = new prom_client_1.default.Gauge({
            name: 'service_health',
            help: 'Service health status (1=healthy, 0=unhealthy)',
            labelNames: ['service_name'],
            registers: [this.register]
        });
        // ===== DEFAULT METRICS =====
        // Collect CPU, memory, event loop lag, etc.
        prom_client_1.default.collectDefaultMetrics({
            register: this.register,
            prefix: `${serviceName}_`
        });
    }
    /**
     * Get metrics in Prometheus format
     */
    async getMetrics() {
        return await this.register.metrics();
    }
    /**
     * Clear all metrics
     */
    clear() {
        this.register.clear();
    }
}
exports.MetricsManager = MetricsManager;
/**
 * Express middleware to collect HTTP metrics
 */
function metricsMiddleware(metrics) {
    return (req, res, next) => {
        const start = Date.now();
        // Increment active connections
        metrics.activeConnections.inc();
        // Calculate request size
        const requestSize = parseInt(req.headers['content-length'] || '0');
        if (requestSize > 0) {
            metrics.httpRequestSize.observe({
                method: req.method,
                route: req.route?.path || req.path
            }, requestSize);
        }
        // Track response
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const route = req.route?.path || req.path;
            // Record duration
            metrics.httpRequestDuration.observe({
                method: req.method,
                route,
                status_code: res.statusCode
            }, duration);
            // Increment counter
            metrics.httpRequestTotal.inc({
                method: req.method,
                route,
                status_code: res.statusCode
            });
            // Track response size
            const responseSize = parseInt(res.get('Content-Length') || '0');
            if (responseSize > 0) {
                metrics.httpResponseSize.observe({
                    method: req.method,
                    route,
                    status_code: res.statusCode
                }, responseSize);
            }
            // Decrement active connections
            metrics.activeConnections.dec();
        });
        next();
    };
}
/**
 * Create metrics endpoint handler
 */
function createMetricsEndpoint(metrics) {
    return async (req, res) => {
        try {
            res.set('Content-Type', metrics.contentType);
            const metricsData = await metrics.getMetrics();
            res.send(metricsData);
        }
        catch (error) {
            res.status(500).send(`Error collecting metrics: ${error.message}`);
        }
    };
}
exports.default = { MetricsManager, metricsMiddleware, createMetricsEndpoint };
