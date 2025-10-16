# 🏥 NileCare Main Orchestration Service

**Version:** 3.0.0 (Stateless Orchestrator)  
**Port:** 7000  
**Database:** **NONE** (Pure API Gateway/Orchestrator)  
**Role:** Central Orchestrator & Service Aggregator

---

## 📋 Overview

The Main NileCare Service acts as the **stateless central orchestrator** for the NileCare Healthcare Platform. It coordinates between various microservices, aggregates data, and provides a unified API gateway for frontend applications.

### 🎯 Key Architectural Principles

- ✅ **Stateless**: NO database access - pure routing and aggregation layer
- ✅ **Service-Oriented**: Delegates all data operations to domain microservices
- ✅ **Resilient**: Circuit breakers prevent cascading failures
- ✅ **Observable**: Request ID tracking across all service calls
- ✅ **Type-Safe**: Strongly typed service clients with TypeScript

### Key Responsibilities

- ✅ **Service Orchestration**: Routes requests to appropriate microservices
- ✅ **Data Aggregation**: Combines data from multiple services (dashboard stats)
- ✅ **API Gateway**: Single entry point for frontend applications
- ✅ **Service Discovery**: Automatic service registration and health checks
- ✅ **Circuit Breaking**: Prevents cascade failures with Opossum
- ✅ **Request Proxying**: Transparently forwards requests to services
- ✅ **Real-time Updates**: WebSocket proxying for live data
- ✅ **API Documentation**: Aggregated Swagger/OpenAPI specs

---

## ✨ Architecture

### Service Communication Pattern

```
┌─────────────────────────────────────┐
│   Frontend (React)                  │
│   http://localhost:5173             │
└──────────────┬──────────────────────┘
               │
               │ All API calls via port 7000
               │
┌──────────────▼──────────────────────┐
│  Main NileCare Orchestrator         │
│  Port: 7000                         │
│  ✅ NO Database                      │
│  ✅ Service Clients                  │
│  ✅ Circuit Breakers                 │
│  ✅ Request ID Tracking              │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────────┬───────────────┬────────────────┐
       │                   │               │                │
┌──────▼──────┐    ┌──────▼──────┐  ┌────▼────┐    ┌──────▼──────┐
│ Clinical    │    │ Auth        │  │ Lab     │    │ Appointment │
│ Service     │    │ Service     │  │ Service │    │ Service     │
│ (7001)      │    │ (7020)      │  │ (7080)  │    │ (7040)      │
│             │    │             │  │         │    │             │
│ ✅ Has DB    │    │ ✅ Has DB    │  │ ✅ Has DB│    │ ✅ Has DB    │
└─────────────┘    └─────────────┘  └─────────┘    └─────────────┘
```

### Service Discovery

All microservices are automatically registered with health checks:

```typescript
const serviceRegistry = {
  'auth-service': 'http://localhost:7020',
  'clinical-service': 'http://localhost:7001',
  'appointment-service': 'http://localhost:7040',
  'lab-service': 'http://localhost:7080',
  'medication-service': 'http://localhost:7090',
  'inventory-service': 'http://localhost:7100',
  // ... more services
};
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- **NO database required!** (Stateless orchestrator)
- Microservices running (auth, clinical, etc.)

### Installation

```bash
cd microservices/main-nilecare
npm install
```

### Environment Configuration

Create `.env` file (NO database credentials needed!):

```env
NODE_ENV=development
PORT=7000

# Service URLs (auto-discovery)
AUTH_SERVICE_URL=http://localhost:7020
CLINICAL_SERVICE_URL=http://localhost:7001
APPOINTMENT_SERVICE_URL=http://localhost:7040
BILLING_SERVICE_URL=http://localhost:7050
PAYMENT_SERVICE_URL=http://localhost:7030
LAB_SERVICE_URL=http://localhost:7080
MEDICATION_SERVICE_URL=http://localhost:7090
INVENTORY_SERVICE_URL=http://localhost:7100
FACILITY_SERVICE_URL=http://localhost:7060
BUSINESS_SERVICE_URL=http://localhost:7010
DEVICE_SERVICE_URL=http://localhost:7070
NOTIFICATION_SERVICE_URL=http://localhost:7007

# Redis Cache (optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=300

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### Start Service

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### Verify Installation

```bash
# Health check (no auth required)
curl http://localhost:7000/health

# Service discovery status
curl http://localhost:7000/api/v1/service-discovery/services

# Dashboard stats (requires authentication)
curl -H "Authorization: Bearer <token>" \
  http://localhost:7000/api/v1/dashboard/stats
```

---

## 📡 API Endpoints

### Dashboard Endpoints (Aggregated Data)

#### GET /api/v1/dashboard/stats
Get aggregated statistics from all services.

**Headers:**
- `Authorization: Bearer <jwt-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "clinical": {
      "patients": { "total": 1500 },
      "encounters": { "total": 3200, "today": 45 }
    },
    "auth": {
      "users": { "total": 250, "active24h": 120 }
    },
    "lab": {
      "orders": { "pending": 23 },
      "results": { "criticalUnacknowledged": 5 }
    },
    "medication": {
      "prescriptions": { "active": 456 },
      "alerts": { "unacknowledged": 12 }
    },
    "inventory": {
      "items": { "lowStock": 34, "outOfStock": 8 }
    },
    "appointment": {
      "appointments": { "today": 45, "pending": 89 }
    }
  },
  "servicesResponded": 6,
  "totalServices": 6,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

#### GET /api/v1/dashboard/clinical-summary
Get clinical overview.

#### GET /api/v1/dashboard/alerts
Get critical alerts from lab, medication, and inventory services.

#### GET /api/v1/dashboard/today-summary
Get today's appointments and encounters.

### Service Proxying

The orchestrator transparently proxies requests to microservices:

```
# Clinical Service
GET  /api/v1/patients/*              → Clinical Service (7001)
GET  /api/v1/encounters/*            → Clinical Service (7001)
GET  /api/v1/stats                   → Clinical Service (7001)

# Appointment Service  
GET  /api/v1/appointments/*          → Appointment Service (7040)
POST /api/v1/appointments            → Appointment Service (7040)

# Lab Service
GET  /api/v1/lab-orders/*            → Lab Service (7080)
GET  /api/v1/results/*               → Lab Service (7080)

# Auth Service (authentication)
POST /api/v1/auth/login              → Auth Service (7020)
POST /api/v1/auth/refresh            → Auth Service (7020)
GET  /api/v1/auth/validate           → Auth Service (7020)

# And more...
```

### Service Discovery

#### GET /api/v1/service-discovery/services
Get all registered services and their health status.

**Response:**
```json
{
  "services": {
    "auth-service": {
      "url": "http://localhost:7020",
      "healthy": true,
      "lastCheck": "2025-10-16T10:30:00.000Z"
    },
    "clinical-service": {
      "url": "http://localhost:7001",
      "healthy": true,
      "lastCheck": "2025-10-16T10:30:00.000Z"
    }
    // ... more services
  }
}
```

### Health & Monitoring

#### GET /health
Service health check (no auth required).

#### GET /ready
Readiness probe for Kubernetes.

#### GET /metrics
Prometheus metrics endpoint.

---

## 🔌 Service Clients

Main-nilecare uses type-safe service clients from `@nilecare/service-clients`:

```typescript
import { serviceClients } from './clients/ServiceClients';

// Set auth token
serviceClients.setAuthToken(jwtToken);

// Fetch data from services
const patientsCount = await serviceClients.clinical.getPatientsCount();
const activeUsers = await serviceClients.auth.getActiveUsersCount();
const pendingOrders = await serviceClients.lab.getPendingOrdersCount();
```

### Circuit Breakers

All service calls are protected by circuit breakers:

- **Timeout**: 10 seconds
- **Error Threshold**: 50%
- **Reset Timeout**: 30 seconds
- **Volume Threshold**: 3 requests

When a circuit opens, requests fail immediately without waiting for timeout.

---

## 🗄️ Data Flow

### How Dashboard Stats Work

```typescript
// 1. Frontend requests dashboard stats
GET /api/v1/dashboard/stats

// 2. Main-nilecare orchestrates parallel calls to services
const [clinical, auth, lab, med, inv, appt] = await Promise.allSettled([
  serviceClients.clinical.getAllStats(),
  serviceClients.auth.getAllStats(),
  serviceClients.lab.getAllStats(),
  serviceClients.medication.getAllStats(),
  serviceClients.inventory.getAllStats(),
  serviceClients.appointment.getAllStats(),
]);

// 3. Aggregates results (graceful degradation if services fail)
return {
  clinical: clinical.status === 'fulfilled' ? clinical.value : null,
  auth: auth.status === 'fulfilled' ? auth.value : null,
  // ... more services
};

// 4. Returns combined response to frontend
```

**Benefits:**
- ✅ **Parallel fetching**: All services called simultaneously
- ✅ **Graceful degradation**: Partial failures don't break entire response
- ✅ **Type safety**: Strongly typed responses
- ✅ **Resilience**: Circuit breakers prevent cascading failures

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Manual Testing

```bash
# 1. Get auth token
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"password"}' \
  | jq -r '.token')

# 2. Test dashboard stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7000/api/v1/dashboard/stats | jq

# 3. Test service discovery
curl http://localhost:7000/api/v1/service-discovery/services | jq
```

---

## 🚀 Deployment

### Docker Build

```bash
# Build image
docker build -t nilecare/main-orchestrator:3.0.0 .

# Run container
docker run -d \
  -p 7000:7000 \
  --env-file .env.production \
  nilecare/main-orchestrator:3.0.0
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: main-orchestrator
spec:
  replicas: 3  # Stateless - scale horizontally!
  selector:
    matchLabels:
      app: main-orchestrator
  template:
    metadata:
      labels:
        app: main-orchestrator
    spec:
      containers:
      - name: main-orchestrator
        image: nilecare/main-orchestrator:3.0.0
        ports:
        - containerPort: 7000
        env:
        - name: NODE_ENV
          value: "production"
        - name: AUTH_SERVICE_URL
          value: "http://auth-service:7020"
        # ... more service URLs
        livenessProbe:
          httpGet:
            path: /health
            port: 7000
        readinessProbe:
          httpGet:
            path: /ready
            port: 7000
```

---

## 📊 Monitoring

### Metrics

```bash
GET /metrics

# Key metrics:
http_requests_total{service="main-nilecare"}
http_request_duration_seconds{service="main-nilecare"}
circuit_breaker_state{service="clinical-service"}
service_health{service="auth-service"}
```

### Logging

Structured logging with request ID tracking:

```json
{
  "level": "info",
  "message": "Dashboard stats retrieved",
  "requestId": "f773b07b-578f-4ac3-9c15-56a21b1b32b8",
  "servicesResponded": 6,
  "totalServices": 6,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

---

## 🐛 Troubleshooting

### "Service is unavailable"

**Symptoms:** Requests fail with 503 errors

**Solution:**
```bash
# 1. Check service health
curl http://localhost:7000/api/v1/service-discovery/services

# 2. Verify service is running
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7001/health  # Clinical Service

# 3. Check service URL in .env
echo $AUTH_SERVICE_URL
```

### "Circuit breaker is open"

**Symptoms:** Errors mentioning circuit breaker

**Solution:**
- Circuit breaker opens after 50% error rate
- Wait 30 seconds for automatic reset
- Check target service health
- Review service logs for errors

### "All services returning null data"

**Symptoms:** Dashboard shows empty data

**Solution:**
```bash
# Check authentication token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7001/api/v1/stats  # Direct service call

# Verify services are authenticated properly
# Each service needs valid JWT token
```

---

## 📚 Related Documentation

- [Service Clients Package](../../packages/@nilecare/service-clients/README.md)
- [Response Wrapper Package](../../packages/@nilecare/response-wrapper/README.md)
- [Authentication Guide](../../AUTHENTICATION.md)
- [Architecture Overview](../../ARCHITECTURE_OVERVIEW.md)
- [Phase 1 & 2 Summary](../../🎉_PHASE1_AND_PHASE2_COMPLETE_SUMMARY.md)

---

## 🎯 Benefits of Stateless Architecture

### For Development
- ✅ **Easier Testing**: No database setup required
- ✅ **Faster Development**: No schema migrations
- ✅ **Clear Boundaries**: Services own their data

### For Operations
- ✅ **Horizontal Scaling**: Add more instances without database concerns
- ✅ **No Database Bottleneck**: Each service has independent database
- ✅ **Resilient**: Service failures are isolated

### For Business
- ✅ **Faster Deployments**: No database migration coordination
- ✅ **Independent Service Updates**: Deploy services independently
- ✅ **Better Performance**: Parallel data fetching

---

## 🤝 Contributing

1. Create feature branch
2. Make changes (no database migrations!)
3. Add tests
4. Run `npm test` and `npm run lint`
5. Submit pull request

---

## 📞 Support

- 📧 Email: support@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd
- 🐛 Issues: https://github.com/mohfadul/nilecare/issues

---

**Last Updated:** October 16, 2025  
**Version:** 3.0.0 (Stateless Orchestrator)  
**Port:** 7000  
**Database:** NONE (Pure orchestrator)  
**Maintained by:** NileCare Development Team
