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

import promClient from 'prom-client';

export class MetricsManager {
  private register: promClient.Registry;
  public contentType: string;
  
  // HTTP metrics
  public httpRequestDuration: promClient.Histogram;
  public httpRequestTotal: promClient.Counter;
  public httpRequestSize: promClient.Histogram;
  public httpResponseSize: promClient.Histogram;
  public activeConnections: promClient.Gauge;
  
  // Cache metrics
  public cacheHits: promClient.Counter;
  public cacheMisses: promClient.Counter;
  public cacheSize: promClient.Gauge;
  
  // Circuit breaker metrics
  public circuitBreakerState: promClient.Gauge;
  public circuitBreakerFailures: promClient.Counter;
  
  // Service health metrics
  public serviceHealth: promClient.Gauge;
  
  constructor(serviceName: string) {
    this.register = new promClient.Registry();
    this.contentType = promClient.Registry.PROMETHEUS_CONTENT_TYPE;
    
    // ===== HTTP REQUEST METRICS =====
    
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });
    
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });
    
    this.httpRequestSize = new promClient.Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register]
    });
    
    this.httpResponseSize = new promClient.Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [this.register]
    });
    
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.register]
    });
    
    // ===== CACHE METRICS =====
    
    this.cacheHits = new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_name'],
      registers: [this.register]
    });
    
    this.cacheMisses = new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_name'],
      registers: [this.register]
    });
    
    this.cacheSize = new promClient.Gauge({
      name: 'cache_size_items',
      help: 'Number of items in cache',
      labelNames: ['cache_name'],
      registers: [this.register]
    });
    
    // ===== CIRCUIT BREAKER METRICS =====
    
    this.circuitBreakerState = new promClient.Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
      labelNames: ['service_name'],
      registers: [this.register]
    });
    
    this.circuitBreakerFailures = new promClient.Counter({
      name: 'circuit_breaker_failures_total',
      help: 'Total number of circuit breaker failures',
      labelNames: ['service_name'],
      registers: [this.register]
    });
    
    // ===== SERVICE HEALTH METRICS =====
    
    this.serviceHealth = new promClient.Gauge({
      name: 'service_health',
      help: 'Service health status (1=healthy, 0=unhealthy)',
      labelNames: ['service_name'],
      registers: [this.register]
    });
    
    // ===== DEFAULT METRICS =====
    // Collect CPU, memory, event loop lag, etc.
    promClient.collectDefaultMetrics({ 
      register: this.register,
      prefix: `${serviceName}_`
    });
  }
  
  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.register.clear();
  }
}

/**
 * Express middleware to collect HTTP metrics
 */
export function metricsMiddleware(metrics: MetricsManager) {
  return (req: any, res: any, next: any) => {
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
export function createMetricsEndpoint(metrics: MetricsManager) {
  return async (req: any, res: any) => {
    try {
      res.set('Content-Type', metrics.contentType);
      const metricsData = await metrics.getMetrics();
      res.send(metricsData);
    } catch (error: any) {
      res.status(500).send(`Error collecting metrics: ${error.message}`);
    }
  };
}

export default { MetricsManager, metricsMiddleware, createMetricsEndpoint };

