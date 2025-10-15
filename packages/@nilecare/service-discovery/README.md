# @nilecare/service-discovery

Service discovery and health-based routing for NileCare microservices.

## Features

- ✅ **Service Registry** - Register services with names and URLs
- ✅ **Health Checks** - Automatic periodic health monitoring
- ✅ **Failover** - Returns `null` for unhealthy services
- ✅ **Auto-recovery** - Detects when services come back online
- ✅ **Configurable** - Custom health check paths, timeouts, intervals
- ✅ **Zero Dependencies** - Only requires `axios`

## Installation

```bash
npm install @nilecare/service-discovery
```

## Quick Start

```typescript
import { ServiceRegistry, createNileCareRegistry } from '@nilecare/service-discovery';

// Option 1: Use pre-configured NileCare registry
const registry = createNileCareRegistry({
  autoStart: true // Starts health checks immediately
});

// Option 2: Create custom registry
const registry = new ServiceRegistry({
  path: '/health',
  timeout: 3000,
  interval: 30000,
  maxFailures: 3
});

registry.register('auth-service', 'http://localhost:7020');
registry.register('business-service', 'http://localhost:7010');
registry.startHealthChecks();

// Use in your routes
app.get('/api/patients', async (req, res) => {
  const clinicalUrl = await registry.getServiceUrl('clinical-service');
  
  if (!clinicalUrl) {
    return res.status(503).json({
      error: 'Clinical service unavailable'
    });
  }

  // Make request to clinical service
  const response = await axios.get(`${clinicalUrl}/api/v1/patients`);
  res.json(response.data);
});
```

## API Reference

### `ServiceRegistry`

#### `register(name: string, url: string): void`
Register a service in the registry.

#### `getServiceUrl(name: string): Promise<string | null>`
Get service URL if healthy. Performs health check if service was previously unhealthy.

#### `getServiceUrlSync(name: string): string | null`
Get service URL without health check (uses cached status).

#### `startHealthChecks(): void`
Start periodic health checks for all registered services.

#### `stopHealthChecks(): void`
Stop periodic health checks.

#### `getStatus(): Record<string, ServiceConfig>`
Get status of all services.

#### `isHealthy(name: string): boolean`
Check if a service is healthy (cached status).

### `createNileCareRegistry(options?)`

Creates a pre-configured registry with all NileCare services.

**Options:**
- `services?: Record<string, string>` - Custom service URLs
- `autoStart?: boolean` - Auto-start health checks (default: `true`)
- `healthConfig?: HealthCheckConfig` - Health check configuration

## Configuration

### Health Check Config

```typescript
{
  path: '/health',        // Health check endpoint path
  timeout: 3000,          // Request timeout in ms
  interval: 30000,        // Check interval in ms
  maxFailures: 3          // Failures before marking unhealthy
}
```

### Environment Variables

When using `createNileCareRegistry()`, these env vars are used:

- `AUTH_SERVICE_URL`
- `BUSINESS_SERVICE_URL`
- `APPOINTMENT_SERVICE_URL`
- `PAYMENT_SERVICE_URL`
- `BILLING_SERVICE_URL`
- `MEDICATION_SERVICE_URL`
- `LAB_SERVICE_URL`
- `INVENTORY_SERVICE_URL`
- `FACILITY_SERVICE_URL`
- `FHIR_SERVICE_URL`
- `HL7_SERVICE_URL`

## Example: Main Orchestrator

```typescript
import express from 'express';
import { createNileCareRegistry } from '@nilecare/service-discovery';
import axios from 'axios';

const app = express();
const registry = createNileCareRegistry();

// Patient routes - proxy to clinical service
app.get('/api/v1/patients', async (req, res) => {
  const clinicalUrl = await registry.getServiceUrl('clinical-service');
  
  if (!clinicalUrl) {
    return res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Clinical service is currently unavailable' }
    });
  }

  try {
    const response = await axios.get(`${clinicalUrl}/api/v1/patients`, {
      headers: { Authorization: req.headers.authorization },
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PROXY_ERROR', message: 'Failed to fetch patients' }
    });
  }
});

// Service status endpoint
app.get('/api/v1/services/status', (req, res) => {
  res.json({
    success: true,
    data: registry.getStatus()
  });
});

app.listen(7000, () => {
  console.log('Orchestrator running on port 7000');
});
```

## Benefits

### Before (Hardcoded URLs)

```typescript
const authUrl = 'http://localhost:7020'; // ❌ Hardcoded
const response = await axios.get(`${authUrl}/api/v1/users`);
// No way to know if service is down until request fails
```

### After (Service Discovery)

```typescript
const authUrl = await registry.getServiceUrl('auth-service'); // ✅ Dynamic

if (!authUrl) {
  return res.status(503).json({ error: 'Auth service unavailable' });
}

const response = await axios.get(`${authUrl}/api/v1/users`);
// Automatic health checks prevent requests to unhealthy services
```

## License

MIT

