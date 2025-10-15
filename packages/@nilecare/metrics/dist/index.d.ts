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
export declare class MetricsManager {
    private register;
    contentType: string;
    httpRequestDuration: promClient.Histogram;
    httpRequestTotal: promClient.Counter;
    httpRequestSize: promClient.Histogram;
    httpResponseSize: promClient.Histogram;
    activeConnections: promClient.Gauge;
    cacheHits: promClient.Counter;
    cacheMisses: promClient.Counter;
    cacheSize: promClient.Gauge;
    circuitBreakerState: promClient.Gauge;
    circuitBreakerFailures: promClient.Counter;
    serviceHealth: promClient.Gauge;
    constructor(serviceName: string);
    /**
     * Get metrics in Prometheus format
     */
    getMetrics(): Promise<string>;
    /**
     * Clear all metrics
     */
    clear(): void;
}
/**
 * Express middleware to collect HTTP metrics
 */
export declare function metricsMiddleware(metrics: MetricsManager): (req: any, res: any, next: any) => void;
/**
 * Create metrics endpoint handler
 */
export declare function createMetricsEndpoint(metrics: MetricsManager): (req: any, res: any) => Promise<void>;
declare const _default: {
    MetricsManager: typeof MetricsManager;
    metricsMiddleware: typeof metricsMiddleware;
    createMetricsEndpoint: typeof createMetricsEndpoint;
};
export default _default;
