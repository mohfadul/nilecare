"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpanContext = exports.Span = exports.opentracing = void 0;
exports.createTracer = createTracer;
exports.tracingMiddleware = tracingMiddleware;
exports.injectTraceHeaders = injectTraceHeaders;
exports.createChildSpan = createChildSpan;
// @ts-ignore - jaeger-client doesn't have official types
const jaeger_client_1 = require("jaeger-client");
const opentracing_1 = __importStar(require("opentracing"));
exports.opentracing = opentracing_1.default;
Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return opentracing_1.Span; } });
Object.defineProperty(exports, "SpanContext", { enumerable: true, get: function () { return opentracing_1.SpanContext; } });
/**
 * Create Jaeger tracer for a service
 */
function createTracer(config) {
    const serviceName = typeof config === 'string' ? config : config.serviceName;
    const opts = typeof config === 'object' ? config : { serviceName };
    const tracingConfig = {
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
    const tracingOptions = {
        logger: {
            info: (msg) => {
                if (process.env.LOG_LEVEL === 'debug') {
                    console.log(`[Jaeger] ${msg}`);
                }
            },
            error: (msg) => console.error(`[Jaeger Error] ${msg}`)
        }
    };
    const tracer = (0, jaeger_client_1.initTracer)(tracingConfig, tracingOptions);
    console.log(`✅ Tracing enabled: ${serviceName} → Jaeger at ${tracingConfig.reporter.agentHost}:${tracingConfig.reporter.agentPort}`);
    return tracer;
}
/**
 * Express middleware for automatic request tracing
 */
function tracingMiddleware(tracer) {
    return (req, res, next) => {
        // Extract parent span context from headers
        const parentSpanContext = tracer.extract(opentracing_1.default.FORMAT_HTTP_HEADERS, req.headers);
        // Start new span
        const span = tracer.startSpan(`${req.method} ${req.path}`, {
            childOf: parentSpanContext || undefined,
            tags: {
                [opentracing_1.default.Tags.SPAN_KIND]: opentracing_1.default.Tags.SPAN_KIND_RPC_SERVER,
                [opentracing_1.default.Tags.HTTP_METHOD]: req.method,
                [opentracing_1.default.Tags.HTTP_URL]: req.url,
                [opentracing_1.default.Tags.HTTP_STATUS_CODE]: res.statusCode
            }
        });
        // Attach span to request
        req.span = span;
        req.spanContext = span.context();
        // Finish span when response completes
        res.on('finish', () => {
            span.setTag(opentracing_1.default.Tags.HTTP_STATUS_CODE, res.statusCode);
            if (res.statusCode >= 400) {
                span.setTag(opentracing_1.default.Tags.ERROR, true);
            }
            span.finish();
        });
        next();
    };
}
/**
 * Helper function to inject trace context into outgoing requests
 */
function injectTraceHeaders(span, headers = {}) {
    const tracer = span._tracer || opentracing_1.default.globalTracer();
    const context = span.context ? span.context() : span;
    tracer.inject(context, opentracing_1.default.FORMAT_HTTP_HEADERS, headers);
    return headers;
}
/**
 * Create a child span
 */
function createChildSpan(tracer, parentSpan, operationName, tags) {
    const span = tracer.startSpan(operationName, {
        childOf: parentSpan.context(),
        tags
    });
    return span;
}
exports.default = { createTracer, tracingMiddleware, injectTraceHeaders, createChildSpan };
