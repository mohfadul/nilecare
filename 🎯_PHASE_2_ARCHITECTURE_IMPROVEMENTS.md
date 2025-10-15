# 🎯 Phase 2: Architecture Improvements

**Started:** October 14, 2025  
**Duration:** Week 2  
**Estimated Time:** 30-40 hours  
**Status:** 🚀 **STARTING NOW**

---

## 📊 Phase 2 Overview

### Objectives:
1. **Refactor Main NileCare to True Orchestrator** (16 hours)
2. **Implement Service Discovery** (8 hours)
3. **Create Additional Shared Packages** (12 hours)
4. **Add Environment Validation** (4 hours)

**Total:** 40 hours of work

---

## 🎯 Task 2.1: Refactor Main NileCare to True Orchestrator

### Current Issues:

**Main NileCare (Port 7000) currently:**
- ❌ Has MySQL database (should be stateless)
- ❌ Contains patient CRUD operations (should be in clinical service)
- ❌ Has business logic (should only route)
- ❌ Acts as data service instead of orchestrator

### Target Architecture:

**Main NileCare should be:**
- ✅ **Stateless routing layer** (no database)
- ✅ **Request aggregator** (combines responses from multiple services)
- ✅ **API Gateway proxy** (routes to appropriate services)
- ✅ **Circuit breaker** (handles service failures gracefully)
- ✅ **Load balancer** (distributes requests)

### Refactoring Plan:

#### Step 1: Identify Business Logic to Move
- Patient CRUD → Move to clinical-service
- Bulk operations → Move to appropriate services
- Search operations → Create search-service or distribute

#### Step 2: Remove Database Dependency
- Remove MySQL connection
- Remove all repository/model files
- Keep only routing logic

#### Step 3: Implement Pure Routing
- Create route handlers that proxy to services
- Add response aggregation
- Implement timeout handling
- Add circuit breakers

#### Step 4: Add Service Registry
- Track available services
- Health check monitoring
- Automatic failover

---

## 🎯 Task 2.2: Implement Service Discovery

### Current Issue:
Services use hardcoded URLs in environment variables:
```env
AUTH_SERVICE_URL=http://localhost:7020  # ❌ Hardcoded
```

### Solution Options:

#### Option 1: Kubernetes DNS (Recommended for K8s deployment)
```typescript
// Instead of hardcoded URL
const authUrl = 'http://auth-service.nilecare.svc.cluster.local:7020';
```

#### Option 2: Consul (Service Registry)
```typescript
import Consul from 'consul';

const consul = new Consul();
const services = await consul.health.service('auth-service');
const authUrl = `http://${services[0].Service.Address}:${services[0].Service.Port}`;
```

#### Option 3: Environment-based with DNS (Hybrid)
```typescript
const authUrl = process.env.AUTH_SERVICE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'http://auth-service.nilecare.svc.cluster.local:7020'
    : 'http://localhost:7020');
```

### Implementation Plan:

#### Step 1: Create Service Registry Package
```
packages/@nilecare/service-discovery/
├── src/
│   ├── index.ts (ServiceRegistry class)
│   ├── consul.ts (Consul integration)
│   └── kubernetes.ts (K8s DNS)
└── package.json
```

#### Step 2: Update All Services
- Replace hardcoded URLs
- Use service discovery
- Add health-based routing

---

## 🎯 Task 2.3: Create Additional Shared Packages

### Packages to Create:

#### 1. @nilecare/config-validator
```typescript
// Validates environment variables on startup
import { validateEnv, commonSchema } from '@nilecare/config-validator';

const config = validateEnv(commonSchema.keys({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required()
}));
```

#### 2. @nilecare/logger
```typescript
// Centralized logging with structured format
import { createLogger } from '@nilecare/logger';

const logger = createLogger('my-service');
logger.info('Request received', { userId, traceId });
```

#### 3. @nilecare/error-handler
```typescript
// Standardized error responses
import { ErrorHandler, ApiError } from '@nilecare/error-handler';

throw new ApiError('NOT_FOUND', 'User not found', 404);
```

#### 4. @nilecare/circuit-breaker
```typescript
// Circuit breakers for resilience
import { createBreaker } from '@nilecare/circuit-breaker';

const breaker = createBreaker(externalServiceCall);
const result = await breaker.fire(params);
```

---

## 🎯 Task 2.4: Add Environment Validation

### Create Validation Framework:

```typescript
// packages/@nilecare/config-validator/src/index.ts
import Joi from 'joi';

export const commonEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().required(),
  SERVICE_NAME: Joi.string().required(),
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  AUTH_SERVICE_API_KEY: Joi.string().length(64).required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_AUTH: Joi.boolean().default(false)
});

export function validateEnv(schema: Joi.Schema) {
  const { error, value } = schema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false
  });

  if (error) {
    const details = error.details.map(d => `  - ${d.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }

  return value;
}
```

### Apply to All Services:

```typescript
// In each service's index.ts
import { validateEnv, commonEnvSchema } from '@nilecare/config-validator';

// Validate on startup (before anything else)
const config = validateEnv(commonEnvSchema.keys({
  // Service-specific variables
  DB_HOST: Joi.string().required(),
  DB_NAME: Joi.string().required()
}));
```

---

## 📋 Phase 2 Task Checklist

### Week 2 Tasks:

#### Orchestrator Refactoring:
- [ ] Analyze current main-nilecare business logic
- [ ] Identify code to move to clinical-service
- [ ] Remove MySQL database dependency
- [ ] Create pure routing layer
- [ ] Implement response aggregation
- [ ] Add timeout handling
- [ ] Implement circuit breakers
- [ ] Test orchestrator functionality

#### Service Discovery:
- [ ] Choose approach (K8s DNS, Consul, or Hybrid)
- [ ] Create service-discovery package
- [ ] Update all services to use discovery
- [ ] Remove hardcoded URLs
- [ ] Add health-based routing
- [ ] Test failover scenarios

#### Shared Packages:
- [ ] Create @nilecare/config-validator
- [ ] Create @nilecare/logger
- [ ] Create @nilecare/error-handler
- [ ] Create @nilecare/circuit-breaker
- [ ] Document all packages
- [ ] Update services to use packages

#### Environment Validation:
- [ ] Define common schema
- [ ] Define service-specific schemas
- [ ] Add validation to all services
- [ ] Test with invalid configurations
- [ ] Document required variables

---

## 📊 Success Criteria

Phase 2 is complete when:
- [ ] Main NileCare is stateless (no database)
- [ ] Patient CRUD moved to clinical service
- [ ] Services use discovery (no hardcoded URLs)
- [ ] 4 shared packages created and in use
- [ ] All services validate environment on startup
- [ ] Circuit breakers implemented
- [ ] All tests pass

---

## 🎯 Starting Point

**Current Status:**
- ✅ Phase 1 complete (authentication centralized)
- ✅ All services using @nilecare/auth-client
- ✅ Clean codebase (2,300 lines removed)
- ✅ Secure architecture (JWT_SECRET isolated)

**Ready for Phase 2:** Architecture improvements to make system truly scalable!

---

**Let's begin Phase 2 implementation...**

