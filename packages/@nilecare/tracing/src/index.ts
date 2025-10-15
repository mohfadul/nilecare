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

// @ts-ignore - jaeger-client doesn't have official types
import { initTracer } from 'jaeger-client';
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
export function createTracer(config: string | TracerConfig): any {
  const serviceName = typeof config === 'string' ? config : config.serviceName;
  const opts: TracerConfig = typeof config === 'object' ? config : { serviceName };

  const tracingConfig: any = {
    serviceName,
    sampler: {
      type: opts.samplerType || 'const',
      param: opts.samplerParam || 1 // Sample 100% of traces
    },
    reporter: {
      logSpans: opts.logSpans !== false,
      agentHost: opts.agentHost || process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: opts.agentPort || parseInt(process.env.JAEGER_AGENT_PORT || '6831')
    }
  };

  const tracingOptions: any = {
    logger: {
      info: (msg: string) => {
        if (process.env.LOG_LEVEL === 'debug') {
          console.log(`[Jaeger] ${msg}`);
        }
      },
      error: (msg: string) => console.error(`[Jaeger Error] ${msg}`)
    }
  };

  const tracer = initTracer(tracingConfig, tracingOptions);
  
  console.log(`✅ Tracing enabled: ${serviceName} → Jaeger at ${tracingConfig.reporter.agentHost}:${tracingConfig.reporter.agentPort}`);
  
  return tracer;
}

/**
 * Express middleware for automatic request tracing
 */
export function tracingMiddleware(tracer: any) {
  return (req: any, res: any, next: any) => {
    // Extract parent span context from headers
    const parentSpanContext = tracer.extract(
      opentracing.FORMAT_HTTP_HEADERS,
      req.headers
    );

    // Start new span
    const span = tracer.startSpan(`${req.method} ${req.path}`, {
      childOf: parentSpanContext || undefined,
      tags: {
        [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_RPC_SERVER,
        [opentracing.Tags.HTTP_METHOD]: req.method,
        [opentracing.Tags.HTTP_URL]: req.url,
        [opentracing.Tags.HTTP_STATUS_CODE]: res.statusCode
      }
    });

    // Attach span to request
    req.span = span;
    req.spanContext = span.context();

    // Finish span when response completes
    res.on('finish', () => {
      span.setTag(opentracing.Tags.HTTP_STATUS_CODE, res.statusCode);
      
      if (res.statusCode >= 400) {
        span.setTag(opentracing.Tags.ERROR, true);
      }
      
      span.finish();
    });

    next();
  };
}

/**
 * Helper function to inject trace context into outgoing requests
 */
export function injectTraceHeaders(span: Span | SpanContext, headers: any = {}): any {
  const tracer = (span as any)._tracer || opentracing.globalTracer();
  const context = (span as Span).context ? (span as Span).context() : (span as SpanContext);
  
  tracer.inject(context, opentracing.FORMAT_HTTP_HEADERS, headers);
  
  return headers;
}

/**
 * Create a child span
 */
export function createChildSpan(
  tracer: any,
  parentSpan: Span,
  operationName: string,
  tags?: { [key: string]: any }
): Span {
  const span = tracer.startSpan(operationName, {
    childOf: parentSpan.context(),
    tags
  });
  
  return span;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      span?: Span;
      spanContext?: SpanContext;
    }
  }
}

export { opentracing, Span, SpanContext };
export default { createTracer, tracingMiddleware, injectTraceHeaders, createChildSpan };

