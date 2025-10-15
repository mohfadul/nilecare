# 🌐 NileCare API Gateway Service

Central API Gateway for the NileCare Healthcare Platform. Provides intelligent routing, request composition, response transformation, security, and unified API documentation.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Monitoring](#monitoring)

---

## ✨ Features

### Core Capabilities
- ✅ **API Routing** - Intelligent routing to backend microservices
- ✅ **Request Composition** - Aggregate data from multiple services in a single request
- ✅ **Response Transformation** - Normalize and transform responses
- ✅ **CORS Handling** - Configured CORS for web applications
- ✅ **Security Headers** - Helmet.js security headers
- ✅ **Rate Limiting** - Prevent abuse and ensure fair usage
- ✅ **WebSocket Proxy** - Real-time notifications support

### Documentation & Monitoring
- ✅ **Swagger Documentation** - Unified API documentation from all services
- ✅ **Health Checks** - Kubernetes-compatible health endpoints
- ✅ **Metrics** - Prometheus-compatible metrics endpoint
- ✅ **Request Logging** - Detailed request/response logging with timing

### Advanced Features
- ✅ **Circuit Breaker** - Resilient proxying with automatic failover
- ✅ **Service Discovery** - Dynamic service registration and health checking
- ✅ **Authentication** - Integrated with central auth service
- ✅ **Authorization** - Role-based and permission-based access control

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Middleware Stack                                          │  │
│  │  • Helmet (Security Headers)                               │  │
│  │  • CORS                                                     │  │
│  │  • Compression                                              │  │
│  │  • Request ID                                               │  │
│  │  • Authentication (via Auth Service)                        │  │
│  │  • Rate Limiting                                            │  │
│  │  • Request Logging                                          │  │
│  │  • Response Transformation                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Routing & Proxying                                        │  │
│  │  • /api/v1/auth          → Auth Service                    │  │
│  │  • /api/v1/patients      → Clinical Service                │  │
│  │  • /api/v1/appointments  → Business Service                │  │
│  │  • /api/v1/analytics     → Data Service                    │  │
│  │  • /api/v1/notifications → Notification Service            │  │
│  │  • /ws/notifications     → WebSocket Proxy                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                │                │                │
           ▼                ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │   Auth   │    │ Clinical │    │ Business │    │   Data   │
    │ Service  │    │ Service  │    │ Service  │    │ Service  │
    │  :7020   │    │  :7001   │    │  :7010   │    │  :7003   │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Access to backend microservices
- Auth service API key

### Installation

```bash
# 1. Navigate to gateway service directory
cd microservices/gateway-service

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Update .env with your configuration
nano .env  # or your preferred editor
```

### Required Environment Variables

```env
# Service
SERVICE_NAME=gateway-service
PORT=3000

# Auth Service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-64-char-api-key

# Backend Services
CLINICAL_SERVICE_URL=http://localhost:7001
BUSINESS_SERVICE_URL=http://localhost:7010
DATA_SERVICE_URL=http://localhost:7003
NOTIFICATION_SERVICE_URL=http://localhost:7002

# Database (if needed)
DB_HOST=localhost
DB_USER=gateway_user
DB_PASSWORD=your_password
DB_NAME=nilecare_gateway
```

### Generate Service API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Running the Service

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start

# With Docker
docker build -t nilecare-gateway .
docker run -p 3000:3000 --env-file .env nilecare-gateway
```

---

## ⚙️ Configuration

### CORS Configuration

Configure allowed origins in `.env`:

```env
# Allow specific origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:4200

# Allow all origins (not recommended for production)
CORS_ORIGIN=*
```

### Rate Limiting

```env
# 100 requests per 15 minutes (per IP)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Logging

```env
LOG_LEVEL=info          # error, warn, info, http, debug
LOG_DIR=logs            # Log directory
LOG_AUTH=false          # Log auth attempts
```

---

## 📚 API Documentation

### Swagger UI

Access interactive API documentation:

```
http://localhost:3000/api-docs
```

The gateway automatically aggregates Swagger documentation from all backend services.

### Health Endpoints

```bash
# Health check
GET /health

# Readiness probe (Kubernetes)
GET /health/ready

# Startup probe (Kubernetes)
GET /health/startup

# Prometheus metrics
GET /metrics
```

### API Routes

All routes are prefixed with `/api/v1` and require authentication (except auth endpoints):

| Route | Target Service | Description |
|-------|----------------|-------------|
| `/api/v1/auth/*` | Auth Service | Authentication & authorization |
| `/api/v1/patients/*` | Clinical Service | Patient records |
| `/api/v1/encounters/*` | Clinical Service | Medical encounters |
| `/api/v1/medications/*` | Clinical Service | Medication management |
| `/api/v1/diagnostics/*` | Clinical Service | Diagnostic reports |
| `/api/v1/fhir/*` | Clinical Service | FHIR resources |
| `/api/v1/appointments/*` | Business Service | Appointment scheduling |
| `/api/v1/billing/*` | Business Service | Billing & invoicing |
| `/api/v1/scheduling/*` | Business Service | Staff scheduling |
| `/api/v1/staff/*` | Business Service | Staff management |
| `/api/v1/analytics/*` | Data Service | Analytics & insights |
| `/api/v1/reports/*` | Data Service | Report generation |
| `/api/v1/dashboard/*` | Data Service | Dashboard data |
| `/api/v1/insights/*` | Data Service | Clinical insights |
| `/api/v1/notifications/*` | Notification Service | Notifications |
| `/ws/notifications` | Notification Service | WebSocket (real-time) |

---

## 🛠️ Development

### Project Structure

```
gateway-service/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── middleware/              # Middleware modules
│   │   ├── auth.ts              # Authentication (delegated)
│   │   ├── cors.ts              # CORS configuration
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── rateLimiter.ts      # Rate limiting
│   │   ├── requestLogger.ts    # Request logging
│   │   └── responseTransformer.ts # Response transformation
│   ├── services/                # Service modules
│   │   ├── GatewayService.ts   # Core gateway logic
│   │   ├── ProxyService.ts     # HTTP/WS proxying
│   │   └── SwaggerService.ts   # API documentation
│   └── utils/                   # Utility modules
│       └── logger.ts            # Winston logger
├── dist/                        # Compiled output
├── logs/                        # Log files
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Test with coverage
npm run test:coverage
```

### Linting

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Adding a New Route

1. **Add service URL to `.env`**:
   ```env
   NEW_SERVICE_URL=http://localhost:7004
   ```

2. **Register in index.ts**:
   ```typescript
   app.use('/api/v1/new-resource', 
     authMiddleware, 
     responseTransformer, 
     proxyService.createProxy('/api/v1/new-resource', {
       target: process.env.NEW_SERVICE_URL,
       changeOrigin: true,
       pathRewrite: { '^/api/v1/new-resource': '/api/v1/new-resource' }
     })
   );
   ```

3. **Add to Swagger service** (optional):
   ```typescript
   // In src/services/SwaggerService.ts
   private initializeServiceUrls(): void {
     // Add your new service
     'new-service': process.env.NEW_SERVICE_URL || 'http://localhost:7004'
   }
   ```

---

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t nilecare-gateway:latest .

# Run container
docker run -d \
  --name nilecare-gateway \
  -p 3000:3000 \
  --env-file .env \
  nilecare-gateway:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway-service
  template:
    metadata:
      labels:
        app: gateway-service
    spec:
      containers:
      - name: gateway-service
        image: nilecare-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: AUTH_SERVICE_URL
          value: "http://auth-service:7020"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3000
          failureThreshold: 30
          periodSeconds: 10
```

### Environment-Specific Configuration

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check gateway health
curl http://localhost:3000/health

# Check backend services health
curl http://localhost:3000/api/v1/health/services
```

### Metrics

The gateway exposes Prometheus-compatible metrics at `/metrics`:

- `service_uptime_seconds` - Service uptime
- Request counts, durations, error rates (added by middleware)

```bash
# View metrics
curl http://localhost:3000/metrics
```

### Logging

Logs are written to:
- Console (formatted, colored)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

Log format:
```json
{
  "timestamp": "2025-10-15 14:30:45",
  "level": "info",
  "message": "Request completed",
  "service": "gateway-service",
  "requestId": "abc123",
  "method": "GET",
  "path": "/api/v1/patients",
  "statusCode": 200,
  "duration": "45ms"
}
```

---

## 🔒 Security

### Authentication

All API endpoints (except `/health` and `/api-docs`) require authentication.

**How it works:**
1. Client obtains JWT from Auth Service (`POST /api/v1/auth/login`)
2. Client includes JWT in Authorization header: `Bearer <token>`
3. Gateway validates token with Auth Service
4. Gateway forwards authenticated requests to backend services

### Security Headers

Helmet.js adds security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- etc.

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 attempts per 15 minutes per IP
- **Strict endpoints**: 10 requests per minute per IP

---

## 🐛 Troubleshooting

### Common Issues

**1. "Service unavailable" errors**
```bash
# Check if backend services are running
curl http://localhost:7020/health  # Auth
curl http://localhost:7001/health  # Clinical
curl http://localhost:7010/health  # Business
```

**2. "Authentication failed" errors**
```bash
# Verify AUTH_SERVICE_URL is correct
echo $AUTH_SERVICE_URL

# Check if auth service is reachable
curl http://localhost:7020/health
```

**3. CORS errors**
```bash
# Add your frontend origin to .env
CORS_ORIGIN=http://localhost:3000,http://your-frontend-url
```

**4. Rate limit exceeded**
```bash
# Increase limits in .env
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=900000
```

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
DEBUG_MODE=true
```

---

## 📝 License

MIT License - NileCare Healthcare Platform

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Commit: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

---

## 📞 Support

For issues and questions:
- **Email**: support@nilecare.com
- **Docs**: https://docs.nilecare.com
- **Slack**: #gateway-service channel

---

**Built with ❤️ by the NileCare Team**

