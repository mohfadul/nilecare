/**
 * @nilecare/tracing
 *
 * Distributed tracing with Jaeger for debugging across microservices.
 *
 * Usage:
 * ```typescript
 * import { createTracer, tracingMiddleware } from '@nilecare/tracing';
 *
 * const tracer = createTracer('my-service');
 * app.use(tracingMiddleware(tracer));
 *
 * // In your code
 * const span = tracer.startSpan('database-query');
 * // ... do work ...
 * span.finish();
 * ```
 */
import opentracing, { Span, SpanContext } from 'opentracing';
export interface TracerConfig {
    serviceName: string;
    agentHost?: string;
    agentPort?: number;
    samplerType?: 'const' | 'probabilistic' | 'ratelimiting';
    samplerParam?: number;
    logSpans?: boolean;
}
/**
 * Create Jaeger tracer for a service
 */
export declare function createTracer(config: string | TracerConfig): any;
/**
 * Express middleware for automatic request tracing
 */
export declare function tracingMiddleware(tracer: any): (req: any, res: any, next: any) => void;
/**
 * Helper function to inject trace context into outgoing requests
 */
export declare function injectTraceHeaders(span: Span | SpanContext, headers?: any): any;
/**
 * Create a child span
 */
export declare function createChildSpan(tracer: any, parentSpan: Span, operationName: string, tags?: {
    [key: string]: any;
}): Span;
declare global {
    namespace Express {
        interface Request {
            span?: Span;
            spanContext?: SpanContext;
        }
    }
}
export { opentracing, Span, SpanContext };
declare const _default: {
    createTracer: typeof createTracer;
    tracingMiddleware: typeof tracingMiddleware;
    injectTraceHeaders: typeof injectTraceHeaders;
    createChildSpan: typeof createChildSpan;
};
export default _default;
