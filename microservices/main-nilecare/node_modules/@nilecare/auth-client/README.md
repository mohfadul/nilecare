# @nilecare/auth-client

Centralized authentication client for NileCare microservices.

## ⚠️ CRITICAL: Security Architecture

**ALL microservices (except auth-service) MUST use this package for authentication.**

### The Problem This Solves

**BEFORE (❌ INSECURE):**
- Each service had `JWT_SECRET` in its .env
- Each service verified tokens locally with `jwt.verify()`
- 12+ copies of the same secret across services
- Impossible to rotate tokens
- No centralized audit trail

**AFTER (✅ SECURE):**
- Only auth-service has `JWT_SECRET`
- All services delegate to auth-service via this client
- Single source of truth for authentication
- Easy token rotation
- Complete audit trail

## Installation

```bash
cd microservices/your-service
npm install @nilecare/auth-client
```

## Usage

### 1. Initialize Auth Client

```typescript
// src/index.ts or src/config/auth.ts
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

const authClient = new AuthServiceClient({
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:7020',
  serviceApiKey: process.env.AUTH_SERVICE_API_KEY || '',
  serviceName: process.env.SERVICE_NAME || 'your-service',
  timeout: 5000,
});

const { authenticate, requireRole, requirePermission } = createAuthMiddleware(authClient);

export { authClient, authenticate, requireRole, requirePermission };
```

### 2. Use in Routes

```typescript
// src/routes/appointments.ts
import express from 'express';
import { authenticate, requireRole } from '../config/auth';

const router = express.Router();

// Public route (no auth)
router.get('/public', (req, res) => {
  res.json({ message: 'Public data' });
});

// Protected route (authentication required)
router.get('/appointments', authenticate, async (req, res) => {
  // req.user is now available
  const userId = req.user!.userId;
  const appointments = await getAppointments(userId);
  res.json({ success: true, data: appointments });
});

// Role-restricted route
router.post(
  '/appointments', 
  authenticate, 
  requireRole(['doctor', 'nurse']), 
  async (req, res) => {
    // Only doctors and nurses can create appointments
    const appointment = await createAppointment(req.body, req.user!.userId);
    res.json({ success: true, data: appointment });
  }
);

// Permission-restricted route
router.delete(
  '/appointments/:id',
  authenticate,
  requirePermission('appointments:delete'),
  async (req, res) => {
    await deleteAppointment(req.params.id);
    res.json({ success: true });
  }
);

export default router;
```

### 3. Environment Configuration

**IMPORTANT: Remove JWT_SECRET from your .env!**

```env
# ❌ REMOVE THIS:
# JWT_SECRET=your-jwt-secret

# ✅ ADD THESE:
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-64-char-hex-api-key
SERVICE_NAME=your-service-name
LOG_AUTH=true
```

## API Reference

### AuthServiceClient

#### Constructor

```typescript
new AuthServiceClient(config: AuthConfig)
```

**Config:**
- `authServiceUrl`: URL of auth service (e.g., http://localhost:7020)
- `serviceApiKey`: 64-char hex API key for service-to-service auth
- `serviceName`: Name of your service (for logging)
- `timeout`: Optional, defaults to 5000ms

#### Methods

##### validateToken(token: string): Promise<TokenValidationResult>

Validates a JWT token with auth service.

```typescript
const result = await authClient.validateToken(token);
if (result.valid) {
  console.log('User:', result.user);
} else {
  console.log('Invalid:', result.reason);
}
```

##### checkPermission(userId: string, permission: string): Promise<boolean>

Check if user has specific permission.

```typescript
const allowed = await authClient.checkPermission(userId, 'appointments:create');
```

##### getUserById(userId: string): Promise<UserInfo | null>

Get user details by ID.

```typescript
const user = await authClient.getUserById('user-123');
```

##### healthCheck(): Promise<boolean>

Check if auth service is available.

```typescript
const healthy = await authClient.healthCheck();
```

### Middleware Functions

#### authenticate

Validates JWT token and attaches user to `req.user`.

```typescript
router.get('/protected', authenticate, (req, res) => {
  console.log('User ID:', req.user!.userId);
  console.log('Role:', req.user!.role);
});
```

#### requireRole(roles: string | string[])

Requires user to have one of the specified roles.

```typescript
router.post('/admin', authenticate, requireRole('admin'), handler);
router.get('/clinical', authenticate, requireRole(['doctor', 'nurse']), handler);
```

#### requirePermission(permission: string)

Requires user to have specific permission.

```typescript
router.delete('/users/:id', authenticate, requirePermission('users:delete'), handler);
```

## Migration Guide

### Before (Old Pattern)

```typescript
// ❌ OLD - Don't do this!
import jwt from 'jsonwebtoken';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // ❌ Local verification!
  req.user = decoded;
  next();
}
```

### After (New Pattern)

```typescript
// ✅ NEW - Do this!
import { AuthServiceClient, createAuthMiddleware } from '@nilecare/auth-client';

const authClient = new AuthServiceClient({ ... });
const { authenticate } = createAuthMiddleware(authClient);

// Use authenticate middleware directly
router.get('/data', authenticate, handler);
```

## Generating Service API Keys

```bash
# Generate a 64-character hex API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this key to:
1. Your service's `.env` file as `AUTH_SERVICE_API_KEY`
2. Auth service's `.env` file in `SERVICE_API_KEYS` (comma-separated)

## Troubleshooting

### Token validation fails

**Check:**
1. Auth service is running on correct port
2. `AUTH_SERVICE_URL` is correct
3. `AUTH_SERVICE_API_KEY` matches auth service's `SERVICE_API_KEYS`
4. Token is valid (not expired)

### "Auth service unavailable" error

**Solutions:**
- Ensure auth service is running: `curl http://localhost:7020/health`
- Check network connectivity between services
- Verify firewall rules

### Permission check always returns false

**Check:**
- User has the correct role assigned
- Permission exists in auth service
- Permission format is correct (e.g., `resource:action`)

## License

MIT

## Support

For issues or questions, see:
- `NILECARE_REFACTORING_IMPLEMENTATION_GUIDE.md`
- `NILECARE_SYSTEM_HARMONY_AUDIT_REPORT.md`

