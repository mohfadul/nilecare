# 🔧 NileCare Refactoring Implementation Guide

**Date:** October 14, 2025  
**Purpose:** Step-by-step guide to fix critical issues identified in System Harmony Audit  
**Target Audience:** Backend Engineers & DevOps  
**Estimated Time:** 2-4 weeks

---

## 📋 Table of Contents

1. [Phase 1: Critical Security Fixes](#phase-1-critical-security-fixes)
2. [Phase 2: Architecture Improvements](#phase-2-architecture-improvements)
3. [Phase 3: Code Quality & Consistency](#phase-3-code-quality--consistency)
4. [Testing & Validation](#testing--validation)
5. [Deployment Strategy](#deployment-strategy)

---

## 🚨 Phase 1: Critical Security Fixes (Week 1)

### Priority: 🔴 CRITICAL - MUST FIX IMMEDIATELY

---

### Task 1.1: Remove JWT_SECRET from All Services (Except Auth)

**Time Estimate:** 4 hours  
**Risk Level:** HIGH - Requires service restarts  
**Impact:** All services except Auth Service

#### Step 1: Create Centralized Auth Client Package

```bash
# Create shared authentication package
mkdir -p packages/@nilecare/auth-client
cd packages/@nilecare/auth-client
npm init -y
npm install axios uuid
```

**packages/@nilecare/auth-client/package.json:**
```json
{
  "name": "@nilecare/auth-client",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

**packages/@nilecare/auth-client/src/index.ts:**
```typescript
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Centralized Authentication Service Client
 * All microservices use this to validate tokens
 */

export interface AuthConfig {
  authServiceUrl: string;
  serviceApiKey: string;
  serviceName: string;
  timeout?: number;
}

export interface UserInfo {
  userId: string;
  email: string;
  username?: string;
  role: string;
  permissions: string[];
  organizationId?: string;
  facilityId?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: UserInfo;
  reason?: string;
}

export class AuthServiceClient {
  private client: AxiosInstance;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;

    if (!config.authServiceUrl) {
      throw new Error('AUTH_SERVICE_URL is required');
    }

    if (!config.serviceApiKey) {
      console.warn(
        `⚠️  AUTH_SERVICE_API_KEY not configured for ${config.serviceName}. ` +
        `Service-to-service authentication will fail!`
      );
    }

    this.client = axios.create({
      baseURL: config.authServiceUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-ID': config.serviceName,
        'X-API-Key': config.serviceApiKey || '',
      },
    });

    // Add request ID to all requests
    this.client.interceptors.request.use((config) => {
      config.headers['X-Request-ID'] = uuidv4();
      return config;
    });
  }

  /**
   * Validate JWT token
   * STANDARD ENDPOINT: /api/v1/integration/validate-token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const response = await this.client.post(
        '/api/v1/integration/validate-token',
        { token }
      );

      if (response.data.valid && response.data.user) {
        return {
          valid: true,
          user: {
            userId: response.data.user.id || response.data.user.userId,
            email: response.data.user.email,
            username: response.data.user.username,
            role: response.data.user.role,
            permissions: response.data.permissions || response.data.user.permissions || [],
            organizationId: response.data.user.organizationId,
            facilityId: response.data.user.facilityId,
          },
        };
      }

      return {
        valid: false,
        reason: response.data.reason || 'Invalid token',
      };
    } catch (error: any) {
      console.error(`[${this.config.serviceName}] Token validation error:`, {
        error: error.message,
        status: error.response?.status,
      });

      return {
        valid: false,
        reason: error.response?.data?.message || 'Authentication service error',
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await this.client.post(
        '/api/v1/integration/check-permission',
        { userId, permission }
      );

      return response.data.allowed === true;
    } catch (error: any) {
      console.error(`[${this.config.serviceName}] Permission check error:`, error.message);
      return false;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    try {
      const response = await this.client.get(`/api/v1/integration/users/${userId}`);

      if (response.data.success && response.data.user) {
        return {
          userId: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          role: response.data.user.role,
          permissions: response.data.user.permissions || [],
          organizationId: response.data.user.organizationId,
          facilityId: response.data.user.facilityId,
        };
      }

      return null;
    } catch (error: any) {
      console.error(`[${this.config.serviceName}] Get user error:`, error.message);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default AuthServiceClient;
```

**packages/@nilecare/auth-client/src/middleware.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthServiceClient, UserInfo } from './index';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      traceId?: string;
    }
  }
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(authClient: AuthServiceClient) {
  
  /**
   * Authenticate user
   */
  async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Provide: Authorization: Bearer <token>',
          },
        });
        return;
      }

      const token = authHeader.substring(7);

      // Validate token with Auth Service
      const result = await authClient.validateToken(token);

      if (!result.valid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: result.reason || 'Invalid or expired token',
          },
        });
        return;
      }

      // Attach user to request
      req.user = result.user;

      next();
    } catch (error: any) {
      console.error('Authentication error:', error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication failed',
        },
      });
    }
  }

  /**
   * Require specific role
   */
  function requireRole(roles: string | string[]) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          },
        });
        return;
      }

      next();
    };
  }

  /**
   * Require specific permission
   */
  function requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const hasPermission = await authClient.checkPermission(req.user.userId, permission);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `This action requires the permission: ${permission}`,
          },
        });
        return;
      }

      next();
    };
  }

  return {
    authenticate,
    requireRole,
    requirePermission,
  };
}

export default createAuthMiddleware;
```

**packages/@nilecare/auth-client/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Build the package:**
```bash
cd packages/@nilecare/auth-client
npm run build
npm link  # For local development
```

---

#### Step 2: Update Each Service to Use Centralized Auth

**For EVERY service (except auth-service), follow these steps:**

##### Example: Business Service

**1. Install the package:**
```bash
cd microservices/business
npm link @nilecare/auth-client
# OR for production:
# npm install @nilecare/auth-client@1.0.0
```

**2. Update .env file - REMOVE JWT_SECRET:**
```env
# microservices/business/.env

# ❌ REMOVE THIS LINE:
# JWT_SECRET=your-jwt-secret

# ✅ ADD THESE LINES:
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-64-char-api-key-generated-with-crypto
SERVICE_NAME=business-service
```

**3. Replace middleware/auth.ts:**
```typescript
// microservices/business/src/middleware/auth.ts
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

// Initialize auth client
const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || 'business-service',
  timeout: 5000,
});

// Create middleware functions
const { authenticate, requireRole, requirePermission } = createAuthMiddleware(authClient);

export { authenticate, requireRole, requirePermission, authClient };
```

**4. Update routes to use new middleware:**
```typescript
// microservices/business/src/routes/appointments.ts
import { authenticate, requireRole } from '../middleware/auth';

router.get('/appointments', authenticate, async (req, res) => {
  // req.user is now populated by centralized auth
  const appointments = await appointmentService.getAll(req.user!.userId);
  res.json({ success: true, data: appointments });
});

router.post(
  '/appointments', 
  authenticate, 
  requireRole(['doctor', 'nurse']), 
  async (req, res) => {
    // Only doctors and nurses can create appointments
    const appointment = await appointmentService.create(req.body, req.user!.userId);
    res.json({ success: true, data: appointment });
  }
);
```

**5. Remove JWT dependency:**
```bash
cd microservices/business
npm uninstall jsonwebtoken @types/jsonwebtoken
```

**6. Repeat for all services:**
- main-nilecare
- appointment-service
- payment-gateway-service
- medication-service
- lab-service
- inventory-service
- facility-service
- fhir-service
- hl7-service
- billing-service (may already be correct - verify)

---

#### Step 3: Update Auth Service Integration Routes

**microservices/auth-service/src/routes/integration.ts:**
```typescript
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';

const router = Router();
const userService = new UserService();
const roleService = new RoleService();

// Middleware to verify service API key
function verifyServiceKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.SERVICE_API_KEYS?.split(',') || [];

  if (!apiKey || !validKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid service API key'
    });
  }

  next();
}

/**
 * STANDARD ENDPOINT: Validate JWT token
 * POST /api/v1/integration/validate-token
 */
router.post('/validate-token', verifyServiceKey, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        reason: 'Token is required'
      });
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        valid: false,
        reason: 'JWT secret not configured'
      });
    }

    const payload = jwt.verify(token, jwtSecret) as any;

    // Get user from database
    const user = await userService.findById(payload.userId || payload.sub);

    if (!user || user.status !== 'active') {
      return res.json({
        valid: false,
        reason: 'User not found or inactive'
      });
    }

    // Get user permissions
    const permissions = await roleService.getUserPermissions(user.id);

    res.json({
      valid: true,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
        facilityId: user.facilityId
      },
      permissions
    });

  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.json({
        valid: false,
        reason: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.json({
        valid: false,
        reason: 'Token expired'
      });
    }

    res.status(500).json({
      valid: false,
      reason: 'Token validation error'
    });
  }
});

/**
 * Check user permission
 * POST /api/v1/integration/check-permission
 */
router.post('/check-permission', verifyServiceKey, async (req, res) => {
  try {
    const { userId, permission } = req.body;

    const allowed = await roleService.hasPermission(userId, permission);

    res.json({ allowed });

  } catch (error: any) {
    res.status(500).json({
      allowed: false,
      error: error.message
    });
  }
});

/**
 * Get user by ID
 * GET /api/v1/integration/users/:userId
 */
router.get('/users/:userId', verifyServiceKey, async (req, res) => {
  try {
    const user = await userService.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const permissions = await roleService.getUserPermissions(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        organizationId: user.organizationId,
        facilityId: user.facilityId,
        permissions
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

---

#### Step 4: Generate Service API Keys

```bash
# Generate API keys for each service
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update auth-service .env:**
```env
# microservices/auth-service/.env

# Service-to-service API keys (comma-separated)
SERVICE_API_KEYS=key1_for_business,key2_for_medication,key3_for_lab,key4_for_facility,key5_for_fhir
```

---

#### Step 5: Testing the Changes

**Test token validation:**
```bash
# 1. Get a token from auth service
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@nilecare.sd","password":"TestPass123!"}' \
  | jq -r '.data.token')

# 2. Test business service (should use centralized auth)
curl -X GET http://localhost:7010/api/v1/appointments \
  -H "Authorization: Bearer $TOKEN"

# Should return appointments if token is valid
```

---

### Task 1.2: Fix Main NileCare Port to 7000

**Time Estimate:** 30 minutes  
**Risk Level:** MEDIUM

#### Step 1: Update index.ts

```typescript
// microservices/main-nilecare/src/index.ts
const PORT = process.env.PORT || 7000; // ✅ Changed from 3006
```

#### Step 2: Update .env

```env
# microservices/main-nilecare/.env
PORT=7000
```

#### Step 3: Update all service URLs

**Update these files in ALL services:**
```env
# All services' .env files
MAIN_NILECARE_URL=http://localhost:7000  # ✅ Changed from 3006
```

---

### Task 1.3: Standardize Service-to-Service Headers

**Time Estimate:** 2 hours  
**Risk Level:** LOW

**Create standard interceptor:**
```typescript
// packages/@nilecare/auth-client/src/interceptors.ts
import { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export function addServiceHeaders(config: AxiosRequestConfig, serviceName: string, apiKey: string) {
  config.headers = config.headers || {};
  config.headers['X-Service-ID'] = serviceName;
  config.headers['X-API-Key'] = apiKey;
  config.headers['X-Request-ID'] = uuidv4();
  config.headers['X-Request-Time'] = new Date().toISOString();
  
  return config;
}
```

---

## 📐 Phase 2: Architecture Improvements (Week 2)

### Task 2.1: Refactor Main NileCare to True Orchestrator

**Time Estimate:** 16 hours  
**Risk Level:** HIGH - Major architectural change

#### Problem
Current main-nilecare:
- Has MySQL database
- Contains patient CRUD operations
- Performs business logic
- Acts as a data service, not orchestrator

#### Solution
Transform into lightweight routing layer.

**New architecture:**
```typescript
// microservices/main-nilecare-orchestrator/src/index.ts
import express from 'express';
import axios from 'axios';

const app = express();

// NO DATABASE CONNECTION!
// NO BUSINESS LOGIC!

// Pure routing and aggregation
app.get('/api/v1/patients/:id/complete', async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Aggregate from multiple services
    const [patient, appointments, prescriptions, labResults] = await Promise.all([
      axios.get(`${CLINICAL_SERVICE_URL}/api/v1/patients/${patientId}`),
      axios.get(`${APPOINTMENT_SERVICE_URL}/api/v1/appointments?patientId=${patientId}`),
      axios.get(`${MEDICATION_SERVICE_URL}/api/v1/prescriptions?patientId=${patientId}`),
      axios.get(`${LAB_SERVICE_URL}/api/v1/results?patientId=${patientId}`)
    ]);

    res.json({
      success: true,
      data: {
        patient: patient.data.data,
        appointments: appointments.data.data,
        prescriptions: prescriptions.data.data,
        labResults: labResults.data.data
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate patient data',
      details: error.message
    });
  }
});
```

**Move patient CRUD to clinical-service:**
```bash
# Move routes from main-nilecare to clinical-service
mv microservices/main-nilecare/src/routes/patients.ts \
   microservices/clinical-service/src/routes/patients.ts
```

---

### Task 2.2: Implement Service Discovery with Kubernetes DNS

**Time Estimate:** 8 hours  
**Risk Level:** MEDIUM

#### Solution 1: Kubernetes DNS (Recommended)

**Update service URLs to use Kubernetes DNS:**
```env
# Instead of:
AUTH_SERVICE_URL=http://localhost:7020

# Use:
AUTH_SERVICE_URL=http://auth-service.nilecare.svc.cluster.local:7020
```

**Kubernetes service definition:**
```yaml
# infrastructure/kubernetes/auth-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: nilecare
spec:
  selector:
    app: auth-service
  ports:
    - port: 7020
      targetPort: 7020
  type: ClusterIP
```

#### Solution 2: Consul (Alternative)

**Install Consul:**
```bash
helm install consul hashicorp/consul --set global.name=consul
```

**Register services:**
```typescript
// Each service registers itself
import Consul from 'consul';

const consul = new Consul();

await consul.agent.service.register({
  name: 'auth-service',
  port: 7020,
  check: {
    http: 'http://localhost:7020/health',
    interval: '10s'
  }
});
```

---

### Task 2.3: Create Shared Packages

**Time Estimate:** 12 hours  
**Risk Level:** LOW

**Create packages:**
```bash
mkdir -p packages/@nilecare
cd packages/@nilecare

# 1. Auth Client (already created)
# 2. Config Validator
# 3. Logger
# 4. Error Handler
```

**Package 2: Config Validator**
```typescript
// packages/@nilecare/config-validator/src/index.ts
import Joi from 'joi';

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

// Pre-built schemas
export const commonEnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().required(),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  AUTH_SERVICE_API_KEY: Joi.string().min(32).required()
});
```

**Usage in services:**
```typescript
// microservices/business/src/index.ts
import { validateEnv, commonEnvSchema } from '@nilecare/config-validator';

const config = validateEnv(commonEnvSchema.keys({
  DB_HOST: Joi.string().required(),
  DB_NAME: Joi.string().required()
}));
```

---

## 🧪 Phase 3: Code Quality & Consistency (Week 3)

### Task 3.1: Implement Distributed Tracing

**Time Estimate:** 8 hours  
**Risk Level:** LOW

**Install OpenTelemetry:**
```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

**Create tracer:**
```typescript
// packages/@nilecare/tracing/src/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export function initTracing(serviceName: string) {
  const sdk = new NodeSDK({
    serviceName,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}
```

---

### Task 3.2: Add Circuit Breakers

**Time Estimate:** 6 hours  
**Risk Level:** LOW

```bash
npm install opossum
```

```typescript
// packages/@nilecare/circuit-breaker/src/index.ts
import CircuitBreaker from 'opossum';

export function createCircuitBreaker<T, R>(
  fn: (...args: T[]) => Promise<R>,
  options?: {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
  }
) {
  const breaker = new CircuitBreaker(fn, {
    timeout: options?.timeout || 3000,
    errorThresholdPercentage: options?.errorThresholdPercentage || 50,
    resetTimeout: options?.resetTimeout || 30000,
  });

  breaker.on('open', () => {
    console.warn('Circuit breaker opened');
  });

  breaker.on('halfOpen', () => {
    console.info('Circuit breaker half-open (testing)');
  });

  breaker.on('close', () => {
    console.info('Circuit breaker closed (recovered)');
  });

  return breaker;
}
```

**Usage:**
```typescript
import { createCircuitBreaker } from '@nilecare/circuit-breaker';

const validateTokenBreaker = createCircuitBreaker(
  (token: string) => authClient.validateToken(token)
);

// Use with fallback
const result = await validateTokenBreaker.fire(token).catch(() => ({
  valid: false,
  reason: 'Auth service unavailable'
}));
```

---

## 🧪 Testing & Validation

### Integration Tests

```typescript
// tests/integration/auth-flow.test.ts
import request from 'supertest';

describe('Centralized Authentication Flow', () => {
  let authToken: string;

  it('should login and get token from auth service', async () => {
    const response = await request('http://localhost:7020')
      .post('/api/v1/auth/login')
      .send({
        email: 'doctor@nilecare.sd',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    authToken = response.body.data.token;
  });

  it('should validate token in business service', async () => {
    const response = await request('http://localhost:7010')
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject invalid token', async () => {
    const response = await request('http://localhost:7010')
      .get('/api/v1/appointments')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
```

---

## 🚀 Deployment Strategy

### Deployment Steps

1. **Deploy Auth Service First**
```bash
kubectl apply -f infrastructure/kubernetes/auth-service.yaml
kubectl wait --for=condition=ready pod -l app=auth-service --timeout=60s
```

2. **Deploy Supporting Services**
```bash
kubectl apply -f infrastructure/kubernetes/
```

3. **Run Health Checks**
```bash
./scripts/health-check-all.sh
```

4. **Monitor Logs**
```bash
kubectl logs -f deployment/auth-service -n nilecare
```

---

## 📊 Validation Checklist

After completing refactoring:

- [ ] JWT_SECRET removed from all services except auth-service
- [ ] All services use @nilecare/auth-client package
- [ ] Token validation endpoint standardized to `/api/v1/integration/validate-token`
- [ ] Main NileCare port changed to 7000
- [ ] Service API keys generated and configured
- [ ] All services start successfully
- [ ] Integration tests pass
- [ ] No JWT_SECRET in any .env file except auth-service
- [ ] Health checks return 200 for all services
- [ ] Distributed tracing working
- [ ] Circuit breakers configured

---

## 🆘 Troubleshooting

### Issue: Token validation fails after migration

**Solution:**
```bash
# Check auth service logs
kubectl logs -f deployment/auth-service -n nilecare

# Verify API key is correct
echo $AUTH_SERVICE_API_KEY

# Test endpoint directly
curl -X POST http://localhost:7020/api/v1/integration/validate-token \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"token":"your-jwt-token"}'
```

### Issue: Service can't find @nilecare/auth-client

**Solution:**
```bash
# Make sure package is built
cd packages/@nilecare/auth-client
npm run build

# Link package
npm link

# In service directory
npm link @nilecare/auth-client
```

---

## 📞 Support

For questions or issues:
- Review: `NILECARE_SYSTEM_HARMONY_AUDIT_REPORT.md`
- Check logs: `kubectl logs -f deployment/<service-name>`
- Run tests: `npm test`

---

**Document Version:** 1.0  
**Last Updated:** October 14, 2025  
**Status:** ✅ Ready for Implementation


