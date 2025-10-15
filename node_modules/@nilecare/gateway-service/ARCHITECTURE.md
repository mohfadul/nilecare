# Gateway Service Architecture

## Overview

The Gateway Service is the central entry point for all client requests to the NileCare Healthcare Platform. It provides intelligent routing, request composition, security, and API documentation aggregation.

## Architecture Pattern

The gateway follows the **API Gateway Pattern** with **Backend for Frontend (BFF)** capabilities.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  (Web Apps, Mobile Apps, Third-party Integrations)              │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3000)                     │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Middleware Pipeline (Order Matters!)                      │ │
│  │                                                             │ │
│  │  1. Helmet            → Security headers                   │ │
│  │  2. Request ID        → Unique request tracking            │ │
│  │  3. CORS              → Cross-origin handling              │ │
│  │  4. Compression       → Response compression               │ │
│  │  5. Morgan            → HTTP request logging               │ │
│  │  6. Body Parsers      → JSON/URL parsing                   │ │
│  │  7. Request Logger    → Custom detailed logging            │ │
│  │  8. Authentication    → JWT validation (via Auth Service)  │ │
│  │  9. Rate Limiter      → Abuse prevention                   │ │
│  │  10. Response Transform → Response normalization           │ │
│  │  11. Proxy            → Forward to backend services        │ │
│  │  12. Error Handler    → Centralized error handling         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Core Services                                             │ │
│  │                                                             │ │
│  │  • GatewayService    → Request composition, orchestration  │ │
│  │  • ProxyService      → HTTP/WebSocket proxying             │ │
│  │  • SwaggerService    → API docs aggregation                │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────┬──────────┬──────────┬──────────┬───────────┘
                     │          │          │          │
         ┌───────────┘          │          │          └───────────┐
         ▼                      ▼          ▼                      ▼
┌─────────────────┐   ┌─────────────┐   ┌──────────┐   ┌─────────────┐
│  Auth Service   │   │  Clinical   │   │ Business │   │    Data     │
│    :7020        │   │  Service    │   │ Service  │   │   Service   │
│                 │   │   :7001     │   │  :7010   │   │    :7003    │
│ • Authentication│   │ • Patients  │   │ • Appts  │   │ • Analytics │
│ • Authorization │   │ • Encounters│   │ • Billing│   │ • Reports   │
│ • User Mgmt     │   │ • Meds      │   │ • Staff  │   │ • Dashboards│
└─────────────────┘   └─────────────┘   └──────────┘   └─────────────┘
```

## Core Components

### 1. Middleware Stack

#### Security Layer
- **Helmet**: Adds 11+ security headers (XSS, MIME sniffing, clickjacking protection)
- **CORS**: Configurable cross-origin resource sharing
- **Authentication**: Delegates to Auth Service for JWT validation
- **Rate Limiting**: Prevents abuse (100 req/15min per IP)

#### Observability Layer
- **Request ID**: Unique ID for request tracing
- **Morgan**: HTTP request logging
- **Custom Request Logger**: Detailed request/response logging with timing

#### Processing Layer
- **Compression**: Gzip/deflate response compression
- **Body Parsers**: JSON and URL-encoded parsing (10MB limit)
- **Response Transformer**: Normalize and transform responses

#### Routing Layer
- **Proxy Middleware**: HTTP and WebSocket proxying
- **Error Handler**: Centralized error handling

### 2. Service Layer

#### GatewayService
**Purpose**: Core gateway business logic

**Responsibilities**:
- Service registry management
- Request composition (parallel aggregation)
- Service health checking
- Request/response transformation

**Key Methods**:
```typescript
makeServiceRequest(serviceName, path, config) 
  → Makes HTTP request to backend service

composeRequests(composedRequest)
  → Aggregates data from multiple services in parallel

healthCheck()
  → Checks health of all registered services
```

#### ProxyService
**Purpose**: HTTP and WebSocket proxying

**Responsibilities**:
- Create HTTP proxy middleware
- Create WebSocket proxy middleware
- Add gateway headers (X-Gateway-*, X-Forwarded-*)
- Circuit breaker implementation (optional)

**Features**:
- Request/response logging
- Error handling
- Header forwarding (user context, auth)
- CORS header injection

#### SwaggerService
**Purpose**: API documentation aggregation

**Responsibilities**:
- Fetch Swagger specs from all services
- Merge multiple OpenAPI specs
- Provide unified API documentation

**Endpoints**:
- `GET /api-docs` → Swagger UI
- `GET /api-docs/swagger.json` → Merged OpenAPI spec

### 3. Routing Strategy

#### Route Structure
```
/health                    → Gateway health check
/health/ready              → Kubernetes readiness probe
/health/startup            → Kubernetes startup probe
/metrics                   → Prometheus metrics

/api-docs                  → Swagger UI
/api-docs/swagger.json     → OpenAPI spec

/api/v1/auth/*             → Auth Service (no rate limit on some endpoints)
/api/v1/patients/*         → Clinical Service
/api/v1/encounters/*       → Clinical Service
/api/v1/medications/*      → Clinical Service
/api/v1/diagnostics/*      → Clinical Service
/api/v1/fhir/*             → Clinical Service (FHIR resources)

/api/v1/appointments/*     → Business Service
/api/v1/billing/*          → Business Service
/api/v1/scheduling/*       → Business Service
/api/v1/staff/*            → Business Service

/api/v1/analytics/*        → Data Service
/api/v1/reports/*          → Data Service
/api/v1/dashboard/*        → Data Service
/api/v1/insights/*         → Data Service

/api/v1/notifications/*    → Notification Service
/ws/notifications          → Notification Service (WebSocket)
```

#### Authentication Strategy

**All API routes require authentication EXCEPT**:
- `/health*` (health checks)
- `/metrics` (metrics)
- `/api-docs*` (documentation)
- `/api/v1/auth/login` (login endpoint)
- `/api/v1/auth/register` (registration endpoint)

**Authentication Flow**:
```
1. Client includes JWT in Authorization header
   ↓
2. Gateway auth middleware extracts token
   ↓
3. Gateway calls Auth Service /api/v1/integration/validate-token
   ↓
4. Auth Service validates token and returns user data
   ↓
5. Gateway attaches user to req.user
   ↓
6. Gateway forwards request with user context headers
   ↓
7. Backend service receives authenticated request
```

## Request Flow

### Standard Request
```
1. Client → Gateway (with JWT)
2. Gateway → Auth Service (validate token)
3. Auth Service → Gateway (user data)
4. Gateway → Backend Service (with user headers)
5. Backend Service → Gateway (response)
6. Gateway → Client (transformed response)
```

### Composed Request (Multi-Service Aggregation)
```
1. Client → Gateway (single request)
2. Gateway → GatewayService.composeRequests()
3. Gateway → Auth Service (validate once)
4. GatewayService → [Clinical, Business, Data] (parallel)
5. Services → GatewayService (responses)
6. GatewayService → merge results
7. Gateway → Client (aggregated response)
```

## Error Handling

### Error Types
1. **Client Errors (4xx)**
   - 400 Bad Request (validation errors)
   - 401 Unauthorized (invalid/missing token)
   - 403 Forbidden (insufficient permissions)
   - 404 Not Found (route not found)
   - 429 Too Many Requests (rate limit exceeded)

2. **Server Errors (5xx)**
   - 500 Internal Server Error (unexpected errors)
   - 502 Bad Gateway (backend service error)
   - 503 Service Unavailable (service down, circuit breaker open)
   - 504 Gateway Timeout (backend timeout)

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional error details */ }
  },
  "timestamp": "2025-10-15T14:30:45.123Z",
  "path": "/api/v1/patients"
}
```

## Resilience Patterns

### 1. Circuit Breaker
```typescript
ProxyService.createResilientProxy({
  circuitBreaker: true,
  failureThreshold: 5,      // Open after 5 failures
  resetTimeout: 60000       // Try again after 1 minute
})
```

**States**:
- **Closed**: Normal operation
- **Open**: Service unavailable (returns 503)
- **Half-Open**: Testing if service recovered

### 2. Timeout Handling
- Default proxy timeout: 30 seconds
- Auth service timeout: 5 seconds
- Health check timeout: 3 seconds

### 3. Graceful Degradation
- Failed health checks don't crash gateway
- Composed requests continue if some services fail
- Circuit breaker prevents cascading failures

## Performance Optimizations

### 1. Compression
- Gzip/deflate compression for responses
- Reduces bandwidth by 70-90% for JSON

### 2. Keep-Alive Connections
- HTTP keep-alive enabled for backend connections
- Reduces connection overhead

### 3. Parallel Requests
- Request composition executes in parallel
- Uses Promise.all for concurrent service calls

### 4. Caching (Future)
- Redis integration for caching frequent requests
- Cache-Control headers respected

## Security Considerations

### 1. Authentication Delegation
**Why?**
- Single source of truth (Auth Service)
- No JWT secrets in gateway
- Real-time token validation
- Centralized audit logging

**Trade-offs**:
- Extra network call (5-10ms overhead)
- Auth Service is critical dependency

### 2. Security Headers (Helmet)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 3. Rate Limiting
- Per-IP rate limiting
- Different limits for different endpoint types
- Redis-based distributed rate limiting (future)

### 4. Input Validation
- Body size limits (10MB)
- Request validation middleware available
- Backend services perform detailed validation

## Monitoring & Observability

### 1. Logging
```typescript
logger.info('Request completed', {
  requestId: 'abc123',
  method: 'GET',
  path: '/api/v1/patients',
  statusCode: 200,
  duration: '45ms',
  userId: 'user123'
})
```

### 2. Health Checks
- **Liveness**: Is gateway process alive?
- **Readiness**: Can gateway handle requests?
- **Startup**: Has gateway fully initialized?

### 3. Metrics (Prometheus)
```
service_uptime_seconds
http_requests_total
http_request_duration_seconds
```

## Configuration Management

### Environment Variables
See `.env.example` for full list.

**Critical Variables**:
- `AUTH_SERVICE_URL` - Auth service endpoint
- `AUTH_SERVICE_API_KEY` - Service authentication key
- `CLINICAL_SERVICE_URL` - Clinical service endpoint
- `BUSINESS_SERVICE_URL` - Business service endpoint
- `DATA_SERVICE_URL` - Data service endpoint

### Service Registry
Services are registered at startup from environment variables.
Future: Dynamic service discovery with Consul/etcd.

## Deployment Architecture

### Kubernetes
```yaml
Deployment:
  replicas: 3
  resources:
    limits:
      cpu: 1000m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  
Service:
  type: LoadBalancer
  port: 80 → 3000

Ingress:
  host: api.nilecare.com
  tls: enabled
```

### Scaling Strategy
- **Horizontal**: Add more gateway replicas
- **Vertical**: Increase CPU/memory per instance
- **Optimal**: 3-5 replicas for high availability

## Future Enhancements

### 1. GraphQL Gateway
- Aggregate REST APIs into GraphQL
- Client-defined data fetching

### 2. API Versioning
- `/api/v1/*` → Current version
- `/api/v2/*` → Next version
- Version negotiation via headers

### 3. Request Transformation
- Transform client requests to backend format
- Protocol translation (REST → gRPC)

### 4. Advanced Caching
- Redis integration
- Cache invalidation strategies
- Distributed caching

### 5. API Analytics
- Request tracking
- Usage analytics
- Performance monitoring

### 6. WebAssembly Plugins
- Custom request/response transformations
- Business logic at gateway layer

## Troubleshooting

### Gateway Returns 503
1. Check backend service health
2. Review gateway logs
3. Check circuit breaker state
4. Verify network connectivity

### Authentication Fails
1. Verify AUTH_SERVICE_URL is correct
2. Check AUTH_SERVICE_API_KEY
3. Ensure Auth Service is running
4. Review auth middleware logs

### Performance Issues
1. Check backend service latency
2. Review gateway logs for slow requests
3. Monitor CPU/memory usage
4. Consider scaling horizontally

---

**Last Updated**: October 15, 2025  
**Version**: 1.0.0  
**Maintainer**: NileCare Platform Team

