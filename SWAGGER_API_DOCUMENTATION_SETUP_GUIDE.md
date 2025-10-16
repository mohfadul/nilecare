# 📖 SWAGGER API DOCUMENTATION SETUP GUIDE

**Version:** 1.0.0  
**Date:** October 16, 2025  
**Status:** ⚠️ Implementation Guide (To Be Implemented)

---

## 🎯 OVERVIEW

This guide describes how to set up **unified API documentation** for all NileCare microservices using Swagger/OpenAPI 3.0 with aggregation at the Gateway level.

### Goals

1. **Single Documentation Portal** - One place to view all API docs
2. **Auto-Generated** - Docs generated from code annotations
3. **Interactive Testing** - Try APIs directly from docs
4. **Version Control** - Track API changes over time
5. **Always Up-to-Date** - Docs update with code changes

---

## 📋 TABLE OF CONTENTS

1. [Architecture](#architecture)
2. [Step 1: Add Swagger to Individual Services](#step-1-add-swagger-to-individual-services)
3. [Step 2: Configure Gateway Aggregation](#step-2-configure-gateway-aggregation)
4. [Step 3: Customize Documentation](#step-3-customize-documentation)
5. [Step 4: Deploy & Maintain](#step-4-deploy--maintain)

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                  SWAGGER AGGREGATION FLOW                    │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Browser        │
                    │  http://api.     │
                    │  nilecare.com    │
                    │  /docs           │
                    └────────┬─────────┘
                             │
                             │ Access docs
                             │
                    ┌────────▼─────────┐
                    │  Gateway Service │
                    │  (Port 7001)     │
                    │                  │
                    │  Swagger UI      │
                    │  + Aggregator    │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼──┐  ┌─────▼────┐  ┌───▼────────┐
        │  Auth    │  │ Business │  │ Billing    │
        │ /swagger │  │ /swagger │  │ /swagger   │
        └──────────┘  └──────────┘  └────────────┘
        
    Each service exposes OpenAPI spec at /swagger.json
    Gateway aggregates all specs into unified docs
```

---

## STEP 1: ADD SWAGGER TO INDIVIDUAL SERVICES

### 1.1 Install Dependencies

For each microservice:

```bash
cd microservices/auth-service

npm install --save swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 1.2 Create Swagger Configuration

Create `src/config/swagger.ts`:

```typescript
// microservices/auth-service/src/config/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Auth Service API',
      version: '1.0.0',
      description: 'Authentication and authorization service for NileCare platform',
      contact: {
        name: 'NileCare Engineering',
        email: 'engineering@nilecare.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:7020',
        description: 'Development server',
      },
      {
        url: 'https://api.nilecare.com/auth',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Roles',
        description: 'Role and permission management',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/types/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
```

### 1.3 Add Swagger Routes

Update `src/index.ts`:

```typescript
// microservices/auth-service/src/index.ts

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();

// ... other middleware ...

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Docs',
}));

// OpenAPI JSON endpoint (for aggregation)
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ... routes ...

app.listen(7020, () => {
  console.log('Auth Service running on port 7020');
  console.log('API Docs: http://localhost:7020/api-docs');
});
```

### 1.4 Document Your Routes

Add JSDoc comments to your routes:

```typescript
// microservices/auth-service/src/routes/auth.routes.ts

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: doctor@nilecare.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginController);
```

### 1.5 Define Schemas

Add schema definitions:

```typescript
// microservices/auth-service/src/types/auth.types.ts

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             access_token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refresh_token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               $ref: '#/components/schemas/User'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: 2025-10-16T10:00:00Z
 *         request_id:
 *           type: string
 *           example: req_abc123xyz
 *     
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: USR-12345
 *         email:
 *           type: string
 *           format: email
 *           example: doctor@nilecare.com
 *         first_name:
 *           type: string
 *           example: John
 *         last_name:
 *           type: string
 *           example: Doe
 *         role:
 *           type: string
 *           enum: [admin, doctor, nurse, receptionist, patient]
 *           example: doctor
 *         
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 400
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Validation failed
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: VALIDATION_ERROR
 *             details:
 *               type: object
 *         timestamp:
 *           type: string
 *           format: date-time
 *         request_id:
 *           type: string
 */
```

### 1.6 Repeat for All Services

Apply steps 1.1-1.5 to all 17 microservices:

```bash
# Script to add Swagger to all services
./scripts/add-swagger-to-all-services.sh
```

---

## STEP 2: CONFIGURE GATEWAY AGGREGATION

### 2.1 Install Dependencies

```bash
cd microservices/gateway-service

npm install --save swagger-ui-express express-http-proxy
npm install --save-dev @types/swagger-ui-express
```

### 2.2 Create Aggregator Service

Create `src/services/swagger-aggregator.ts`:

```typescript
// microservices/gateway-service/src/services/swagger-aggregator.ts

import axios from 'axios';

interface ServiceConfig {
  name: string;
  url: string;
  swaggerPath: string;
}

const services: ServiceConfig[] = [
  { name: 'Auth', url: 'http://auth-service:7020', swaggerPath: '/swagger.json' },
  { name: 'Business', url: 'http://business-service:7010', swaggerPath: '/swagger.json' },
  { name: 'Billing', url: 'http://billing-service:7050', swaggerPath: '/swagger.json' },
  { name: 'Payment', url: 'http://payment-service:7030', swaggerPath: '/swagger.json' },
  { name: 'Appointment', url: 'http://appointment-service:7040', swaggerPath: '/swagger.json' },
  { name: 'Clinical', url: 'http://clinical-service:7001', swaggerPath: '/swagger.json' },
  { name: 'Lab', url: 'http://lab-service:7080', swaggerPath: '/swagger.json' },
  { name: 'Medication', url: 'http://medication-service:7090', swaggerPath: '/swagger.json' },
  { name: 'Facility', url: 'http://facility-service:7060', swaggerPath: '/swagger.json' },
  { name: 'Inventory', url: 'http://inventory-service:7100', swaggerPath: '/swagger.json' },
  // Add all 17 services
];

export async function aggregateSwaggerSpecs() {
  const aggregatedSpec: any = {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Platform API',
      version: '1.0.0',
      description: 'Unified API documentation for all NileCare microservices',
      contact: {
        name: 'NileCare Engineering',
        email: 'engineering@nilecare.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:7001',
        description: 'Development Gateway',
      },
      {
        url: 'https://api.nilecare.com',
        description: 'Production Gateway',
      },
    ],
    tags: [],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
  };

  // Fetch specs from all services
  const specPromises = services.map(async (service) => {
    try {
      const response = await axios.get(`${service.url}${service.swaggerPath}`, {
        timeout: 5000,
      });
      return { service: service.name, spec: response.data };
    } catch (error) {
      console.error(`Failed to fetch spec from ${service.name}:`, error.message);
      return null;
    }
  });

  const specs = await Promise.all(specPromises);

  // Merge specs
  specs.forEach((item) => {
    if (!item) return;

    const { service, spec } = item;

    // Add service tag
    aggregatedSpec.tags.push({
      name: service,
      description: `${service} Service endpoints`,
    });

    // Merge paths with service prefix
    Object.keys(spec.paths || {}).forEach((path) => {
      const prefixedPath = `/${service.toLowerCase()}${path}`;
      aggregatedSpec.paths[prefixedPath] = spec.paths[path];

      // Add service tag to each operation
      Object.keys(spec.paths[path]).forEach((method) => {
        const operation = spec.paths[path][method];
        if (operation.tags) {
          operation.tags.push(service);
        } else {
          operation.tags = [service];
        }
      });
    });

    // Merge schemas
    if (spec.components?.schemas) {
      Object.keys(spec.components.schemas).forEach((schemaName) => {
        const prefixedSchemaName = `${service}_${schemaName}`;
        aggregatedSpec.components.schemas[prefixedSchemaName] = 
          spec.components.schemas[schemaName];
      });
    }
  });

  return aggregatedSpec;
}

// Cache aggregated spec (refresh every 5 minutes)
let cachedSpec: any = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedAggregatedSpec() {
  const now = Date.now();
  if (!cachedSpec || (now - lastFetch) > CACHE_DURATION) {
    cachedSpec = await aggregateSwaggerSpecs();
    lastFetch = now;
  }
  return cachedSpec;
}
```

### 2.3 Add Gateway Routes

Update `src/index.ts`:

```typescript
// microservices/gateway-service/src/index.ts

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { getCachedAggregatedSpec } from './services/swagger-aggregator';

const app = express();

// Unified API documentation
app.get('/docs/swagger.json', async (req, res) => {
  try {
    const spec = await getCachedAggregatedSpec();
    res.json(spec);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate API documentation' });
  }
});

app.use('/docs', swaggerUi.serve);
app.get('/docs', async (req, res) => {
  try {
    const spec = await getCachedAggregatedSpec();
    res.send(swaggerUi.generateHTML(spec, {
      customCss: `
        .swagger-ui .topbar { background-color: #2c3e50; }
        .swagger-ui .info .title { color: #3498db; }
      `,
      customSiteTitle: 'NileCare API Documentation',
      customfavIcon: '/favicon.ico',
    }));
  } catch (error) {
    res.status(500).send('Failed to load API documentation');
  }
});

// Refresh documentation cache endpoint (for CI/CD)
app.post('/docs/refresh', async (req, res) => {
  try {
    await aggregateSwaggerSpecs();
    res.json({ message: 'Documentation cache refreshed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh documentation' });
  }
});

app.listen(7001, () => {
  console.log('Gateway running on port 7001');
  console.log('Unified API Docs: http://localhost:7001/docs');
});
```

---

## STEP 3: CUSTOMIZE DOCUMENTATION

### 3.1 Add Custom CSS

Create custom styling for Swagger UI:

```css
/* public/swagger-custom.css */

.swagger-ui .topbar {
  background-color: #2c3e50;
  padding: 10px 0;
}

.swagger-ui .topbar .topbar-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.swagger-ui .info .title {
  color: #3498db;
  font-size: 36px;
}

.swagger-ui .info .description {
  color: #34495e;
}

.swagger-ui .scheme-container {
  background: #ecf0f1;
  padding: 15px;
  border-radius: 5px;
}

/* Group operations by service */
.swagger-ui .opblock-tag {
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
```

### 3.2 Add Logo and Branding

```typescript
app.use('/docs', swaggerUi.serve);
app.get('/docs', async (req, res) => {
  const spec = await getCachedAggregatedSpec();
  
  spec.info.description = `
    <div style="text-align: center;">
      <img src="/logo.png" alt="NileCare Logo" style="max-width: 200px;" />
      <h2>NileCare Healthcare Platform API</h2>
      <p>Complete API documentation for all microservices</p>
    </div>
    ${spec.info.description}
  `;
  
  res.send(swaggerUi.generateHTML(spec, options));
});
```

### 3.3 Add Authentication UI

Enable "Authorize" button:

```typescript
const spec = await getCachedAggregatedSpec();

// Ensure security scheme is defined
spec.components.securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your JWT token from /auth/login',
  },
};
```

---

## STEP 4: DEPLOY & MAINTAIN

### 4.1 Docker Compose

Update `docker-compose.yml`:

```yaml
services:
  gateway:
    build: ./microservices/gateway-service
    ports:
      - "7001:7001"
    environment:
      - NODE_ENV=production
    depends_on:
      - auth-service
      - business-service
      # ... all services
```

### 4.2 CI/CD Integration

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Refresh API Documentation
  run: |
    curl -X POST http://gateway:7001/docs/refresh
```

### 4.3 Monitoring

Set up health check for documentation:

```typescript
app.get('/docs/health', async (req, res) => {
  try {
    const spec = await getCachedAggregatedSpec();
    const serviceCount = spec.tags.length;
    const pathCount = Object.keys(spec.paths).length;
    
    res.json({
      status: 'healthy',
      services_documented: serviceCount,
      total_endpoints: pathCount,
      last_refresh: new Date(lastFetch).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## 📊 EXPECTED RESULTS

After implementation, you'll have:

```
✅ Unified Documentation Portal
   URL: http://localhost:7001/docs
   
✅ Service-Specific Docs
   - Auth: http://localhost:7020/api-docs
   - Business: http://localhost:7010/api-docs
   - ... (all 17 services)

✅ Interactive Testing
   - Try APIs directly from browser
   - Pre-filled examples
   - Authentication support

✅ Auto-Generated from Code
   - Always up-to-date
   - No manual maintenance

✅ Version Control
   - Track API changes in Git
   - Compare versions
```

---

## 🚀 IMPLEMENTATION CHECKLIST

**Phase 1: Individual Services (Week 1)**
- [ ] Install Swagger dependencies in all services
- [ ] Add Swagger configuration to each service
- [ ] Document Auth Service endpoints (example)
- [ ] Document Business Service endpoints
- [ ] Document 5 more services
- [ ] Test individual service docs

**Phase 2: Gateway Aggregation (Week 2)**
- [ ] Install aggregator dependencies
- [ ] Create swagger-aggregator service
- [ ] Add Gateway routes
- [ ] Test aggregation locally
- [ ] Add custom styling
- [ ] Add authentication UI

**Phase 3: Remaining Services (Week 3)**
- [ ] Document remaining 10 services
- [ ] Add all schemas
- [ ] Add examples to all endpoints
- [ ] Test all endpoints

**Phase 4: Polish & Deploy (Week 4)**
- [ ] Add branding and logo
- [ ] Create user guide
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Train team on usage

---

## 📚 ADDITIONAL RESOURCES

### Tools
- **Swagger Editor:** https://editor.swagger.io/
- **Swagger UI:** https://swagger.io/tools/swagger-ui/
- **OpenAPI Generator:** https://openapi-generator.tech/

### Documentation
- **OpenAPI 3.0 Spec:** https://spec.openapis.org/oas/v3.0.0
- **Swagger JSDoc:** https://github.com/Surnet/swagger-jsdoc
- **Best Practices:** https://swagger.io/docs/specification/about/

---

## ✅ SUMMARY

**Implementation Status:** ⚠️ **Pending Implementation**

**Estimated Effort:** 4 weeks

**Team Required:** 
- 2 Backend Engineers
- 1 Tech Writer (for examples)

**Next Steps:**
1. Review this guide with team
2. Assign services to engineers
3. Start with Auth Service (template)
4. Roll out to remaining services
5. Deploy unified portal

---

**Document Status:** ✅ Implementation Guide Complete  
**Last Updated:** October 16, 2025  
**Implementation:** Pending  
**Priority:** Medium (Phase 2)

