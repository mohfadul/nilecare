# 🔐 NileCare Authentication Architecture

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Integration Guide](#integration-guide)
4. [API Reference](#api-reference)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### Centralized Authentication Model

NileCare uses a **centralized authentication architecture** where the Auth Service (port 7020) is the **single source of truth** for all authentication and authorization decisions.

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  CRITICAL ARCHITECTURAL REQUIREMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Auth Service is the SINGLE SOURCE OF TRUTH                  │
│  ✓ NO local JWT verification in microservices                  │
│  ✓ ALL auth requests delegated via HTTP to Auth Service        │
│  ✓ Real-time validation - no stale tokens                      │
│  ✓ Centralized audit logging                                   │
│  ✓ Consistent RBAC across all services                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Centralized Authentication?

| Aspect | Local JWT Verification ❌ | Auth Service Delegation ✅ |
|--------|---------------------------|----------------------------|
| **Single Source of Truth** | No - each service has own logic | Yes - one central authority |
| **Real-time User Status** | No - can't detect suspended users | Yes - validates current status |
| **Permission Changes** | No - stale until token expires | Yes - immediate effect |
| **Audit Logging** | Fragmented across services | Centralized in Auth Service |
| **Security** | JWT secret in every service | JWT secret only in Auth Service |
| **Consistency** | Can drift between services | Always consistent |
| **Maintenance** | Update logic in N services | Update once in Auth Service |

---

## 🏗 Architecture

### Authentication Flow

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│          │  Login  │             │  Creds  │              │
│  Client  ├────────►│  Service    ├────────►│ Auth Service │
│          │         │             │         │  (Port 7020) │
└──────────┘         └─────────────┘         └──────┬───────┘
                                                     │
                                                     │ 1. Validate credentials
                                                     │ 2. Generate JWT token
                                                     │ 3. Store session in Redis
                                                     │ 4. Log authentication
                                                     ▼
                                              ┌──────────────┐
                                              │   Database   │
                                              │  + Redis     │
                                              └──────────────┘

User receives JWT token in response
```

### Request Validation Flow

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐
│          │ Request │             │ Verify  │              │
│  Client  ├────────►│ Any Service ├────────►│ Auth Service │
│          │ +Token  │             │  Token  │              │
└──────────┘         └─────────────┘         └──────┬───────┘
                            ▲                        │
                            │                        │ ✓ Validates JWT
                            │                        │ ✓ Checks user status
                            │                        │ ✓ Retrieves permissions
                            │                        │ ✓ Logs access attempt
                            │                        │
                            │◄───────────────────────┘
                            │   Returns user data + permissions
                            ▼
                     Execute business logic
```

---

## 🔧 Integration Guide

### For New Microservices

#### Step 1: Install Dependencies

```bash
cd microservices/your-service
npm install axios express dotenv
```

#### Step 2: Configure Environment

Create `.env` file:

```env
NODE_ENV=development
PORT=7XXX
SERVICE_NAME=your-service

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<64-char-hex-key-must-match-auth-service>

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# DO NOT ADD JWT_SECRET HERE!
# Only Auth Service should have JWT secrets

LOG_LEVEL=info
LOG_AUTH=true
```

**🔑 Generate API Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then add this key to Auth Service's `SERVICE_API_KEYS` list.

#### Step 3: Create Auth Middleware

Create `middleware/auth.ts`:

```typescript
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const SERVICE_API_KEY = process.env.AUTH_SERVICE_API_KEY;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
    permissions: string[];
    facilityId?: number;
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Delegate to Auth Service
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/validate`,
      { token },
      {
        headers: {
          'X-Service-API-Key': SERVICE_API_KEY,
        },
        timeout: 5000,
      }
    );

    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}
```

#### Step 4: Apply Middleware to Routes

```typescript
import express from 'express';
import { authenticateToken, requirePermission, requireRole } from './middleware/auth';

const router = express.Router();

// Public route - no authentication
router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Protected route - requires authentication
router.get('/appointments', authenticateToken, async (req, res) => {
  // req.user is now available
  const appointments = await getAppointments(req.user.userId);
  res.json(appointments);
});

// Protected route - requires specific permission
router.post('/appointments', 
  authenticateToken, 
  requirePermission('appointments:create'),
  async (req, res) => {
    // Only users with 'appointments:create' permission can access
    const appointment = await createAppointment(req.body, req.user.userId);
    res.json(appointment);
  }
);

// Protected route - requires specific role
router.delete('/appointments/:id',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    // Only admins can delete appointments
    await deleteAppointment(req.params.id);
    res.json({ success: true });
  }
);

export default router;
```

#### Step 5: Update Auth Service Configuration

Add your service's API key to Auth Service's `.env`:

```env
SERVICE_API_KEYS=existing_keys,your_new_service_key
```

---

## 📡 API Reference

### Auth Service Endpoints

#### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@nilecare.sd",
  "password": "TestPass123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "userId": 1,
    "email": "doctor@nilecare.sd",
    "role": "doctor",
    "permissions": ["patients:read", "appointments:create"]
  }
}
```

#### 2. Validate Token (For Microservices)
```http
POST /api/auth/validate
Content-Type: application/json
X-Service-API-Key: your_service_api_key

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "valid": true,
  "user": {
    "userId": 1,
    "email": "doctor@nilecare.sd",
    "role": "doctor",
    "permissions": ["patients:read", "appointments:create"],
    "facilityId": 1
  }
}
```

#### 3. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}

Response:
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer your_jwt_token

Response:
{
  "message": "Logged out successfully"
}
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

- ✅ **DO**: Store JWT secrets only in Auth Service
- ✅ **DO**: Use strong, random secrets (minimum 32 characters)
- ✅ **DO**: Generate unique API keys for each service
- ❌ **DON'T**: Commit secrets to version control
- ❌ **DON'T**: Share secrets between environments

### 2. Token Management

- ✅ **DO**: Set appropriate token expiration times (e.g., 24h for access, 7d for refresh)
- ✅ **DO**: Implement refresh token rotation
- ✅ **DO**: Invalidate tokens on logout
- ❌ **DON'T**: Store tokens in localStorage (use httpOnly cookies for web)
- ❌ **DON'T**: Send tokens in URL query parameters

### 3. API Key Security

- ✅ **DO**: Use 64-character hex keys (256-bit)
- ✅ **DO**: Rotate keys regularly
- ✅ **DO**: Use different keys per service
- ❌ **DON'T**: Hardcode API keys in source code
- ❌ **DON'T**: Log API keys

### 4. Rate Limiting

```typescript
// Implement rate limiting on Auth Service
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

router.post('/api/auth/login', loginLimiter, loginHandler);
```

### 5. HTTPS in Production

```nginx
# nginx configuration
server {
    listen 443 ssl http2;
    server_name api.nilecare.sd;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location /api/auth {
        proxy_pass http://localhost:7020;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🐛 Troubleshooting

### "Authentication failed" Error

**Symptoms:** All requests return 401 Unauthorized

**Solutions:**
1. Verify Auth Service is running: `curl http://localhost:7020/health`
2. Check service API key matches Auth Service configuration
3. Verify token is being sent in Authorization header
4. Check Auth Service logs for validation errors

### "Token expired" Error

**Symptoms:** Previously working tokens suddenly fail

**Solutions:**
1. Implement token refresh logic in client
2. Check JWT_EXPIRES_IN setting in Auth Service
3. Verify system clocks are synchronized (for distributed systems)

### "Invalid API key" Error

**Symptoms:** Service-to-service calls fail

**Solutions:**
1. Verify API key in service `.env` matches Auth Service
2. Ensure no whitespace in API key string
3. Check Auth Service SERVICE_API_KEYS contains the key
4. Regenerate and update API key if necessary

### Permission Denied Errors

**Symptoms:** 403 Forbidden responses

**Solutions:**
1. Check user has required permission in database
2. Verify permission string matches exactly (case-sensitive)
3. Check role assignments in users table
4. Review audit logs to see what permissions were checked

---

## 📊 Monitoring & Audit

### Authentication Metrics

Monitor these key metrics:

- **Login Success Rate**: Should be > 95%
- **Token Validation Latency**: Should be < 100ms
- **Failed Auth Attempts**: Monitor for suspicious activity
- **Active Sessions**: Track concurrent users

### Audit Logging

All authentication events are logged:

```sql
SELECT * FROM audit_logs 
WHERE event_type IN ('LOGIN', 'LOGOUT', 'TOKEN_VALIDATION', 'PERMISSION_CHECK')
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🔗 Related Documentation

- [Main README](./README.md) - Full system documentation
- [Quick Start Guide](./QUICKSTART.md) - Get started quickly
- [API Reference](./API_REFERENCE.md) - All API endpoints
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

---

## 📞 Support

For authentication issues:

- 📧 Email: security@nilecare.sd
- 🔒 Security Issues: security@nilecare.sd (encrypted preferred)
- 📖 Documentation: https://docs.nilecare.sd/authentication

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready


