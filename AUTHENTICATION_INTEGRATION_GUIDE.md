# 🔐 NileCare Authentication Service Integration Guide

**Version:** 2.0  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** October 14, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Integration Requirements](#integration-requirements)
4. [Setup Instructions](#setup-instructions)
5. [Service Configuration](#service-configuration)
6. [Code Integration](#code-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## 🎯 Overview

### Purpose

This guide provides complete instructions for integrating any NileCare microservice with the central **Authentication Service** (port 7020). All microservices MUST delegate authentication and authorization to this service—no local JWT verification is permitted.

### Key Principles

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

---

## 🏗 Architecture

### Authentication Flow

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│          │  Login  │             │  Creds  │              │  Token  │              │
│  Client  ├────────►│  Gateway    ├────────►│ Auth Service ├────────►│    Client    │
│          │         │             │         │  (Port 7020) │         │              │
└──────────┘         └─────────────┘         └──────────────┘         └──────────────┘
                                                     │
                                                     │ Validates user
                                                     │ Generates JWT
                                                     │ Stores session
                                                     ▼
                                              ┌──────────────┐
                                              │   Database   │
                                              │  (MySQL)     │
                                              └──────────────┘

┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│          │ Request │             │ JWT     │              │ Validate│              │
│  Client  ├────────►│ Business    ├────────►│ Auth Service ├────────►│   Response   │
│          │ +Token  │ Service     │ Token   │              │  Valid? │              │
└──────────┘         └─────────────┘         └──────────────┘         └──────────────┘
                            │                        │
                            │                        │ ✓ Validates JWT
                            │                        │ ✓ Checks user status
                            │                        │ ✓ Retrieves permissions
                            │                        │ ✓ Logs access
                            │                        │
                            │◄───────────────────────┘
                            │   User data + permissions
                            ▼
                     Execute business logic
```

### Why Delegation Over Local Verification?

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

## 📦 Integration Requirements

### 1. Environment Variables

Every microservice MUST configure these variables:

```bash
# Service Identification
SERVICE_NAME=your-service-name          # e.g., "appointment-service"
SERVICE_VERSION=1.0.0

# Auth Service Connection (REQUIRED)
AUTH_SERVICE_URL=http://localhost:7020  # or http://auth-service:7020 in Docker
AUTH_SERVICE_API_KEY=<64-char-hex-key>  # Generate with crypto.randomBytes(32)

# DO NOT SET THESE - They are not used by microservices
# JWT_SECRET=xxx  ← NEVER SET IN MICROSERVICES
# JWT_REFRESH_SECRET=xxx  ← NEVER SET IN MICROSERVICES
```

### 2. Dependencies

Install the shared authentication middleware:

```bash
npm install ../../shared
# or
npm install @nilecare/shared@latest
```

### 3. Auth Service Configuration

Add the service API key to Auth Service's `.env`:

```bash
# In microservices/auth-service/.env
SERVICE_API_KEYS=key1,key2,key3,your-new-service-key
```

---

## 🚀 Setup Instructions

### Step 1: Generate Service API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Step 2: Configure Your Service

Create `.env` file in your microservice:

```bash
cd microservices/your-service
cp .env.example .env
```

Edit `.env`:
```bash
SERVICE_NAME=your-service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Step 3: Add Key to Auth Service

Edit `microservices/auth-service/.env`:

```bash
# Add your key to the comma-separated list
SERVICE_API_KEYS=existing-key,a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Step 4: Restart Services

```bash
# Restart Auth Service to load new key
cd microservices/auth-service
npm run dev

# Start your service
cd ../your-service
npm run dev
```

---

## 💻 Code Integration

### Method 1: Using Shared Middleware (Recommended)

```typescript
// src/index.ts or src/app.ts
import { authenticate, requireRole, requirePermission } from '../../shared/middleware/auth';

// Apply to all routes
app.use('/api/v1', authenticate);

// Or apply to specific routes
router.get('/appointments', authenticate, appointmentController.list);

// With role-based access
router.post('/admin/users', 
  authenticate, 
  requireRole(['admin', 'super_admin']), 
  adminController.createUser
);

// With permission-based access
router.get('/patients/:id', 
  authenticate, 
  requirePermission('patients:read'), 
  patientController.getById
);
```

### Method 2: Manual Integration

If you can't use the shared middleware, call Auth Service directly:

```typescript
import axios from 'axios';

async function validateToken(token: string) {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/v1/integration/validate-token`,
      { token },
      {
        headers: {
          'X-Service-Key': process.env.AUTH_SERVICE_API_KEY,
          'X-Service-Name': process.env.SERVICE_NAME,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    return response.data; // { valid: true, user: {...}, tokenInfo: {...} }
  } catch (error) {
    console.error('Token validation failed:', error);
    return { valid: false };
  }
}

async function checkPermission(userId: string, resource: string, action: string) {
  try {
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/v1/integration/verify-permission`,
      { userId, resource, action },
      {
        headers: {
          'X-Service-Key': process.env.AUTH_SERVICE_API_KEY,
          'X-Service-Name': process.env.SERVICE_NAME
        }
      }
    );

    return response.data.allowed;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}
```

### Accessing User Information

After authentication, user data is available in `req.user`:

```typescript
router.get('/my-appointments', authenticate, async (req, res) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const permissions = req.user!.permissions;
  const organizationId = req.user!.organizationId;

  // Use user data for business logic
  const appointments = await appointmentService.getByUserId(userId);
  
  res.json({ appointments });
});
```

---

## 🔬 Testing

### Test 1: Basic Authentication

```bash
# 1. Login to get token
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@nilecare.sd",
    "password": "TestPass123!"
  }'

# Response: { "token": "eyJhbGc..." }

# 2. Use token in your service
curl http://localhost:7040/api/v1/appointments \
  -H "Authorization: Bearer eyJhbGc..."
```

### Test 2: Expired Token

```bash
# Use an expired token
curl http://localhost:7040/api/v1/appointments \
  -H "Authorization: Bearer <expired-token>"

# Expected: 401 Unauthorized
# { "error": { "code": "TOKEN_EXPIRED", "message": "Token has expired" } }
```

### Test 3: Invalid Token

```bash
# Use invalid token
curl http://localhost:7040/api/v1/appointments \
  -H "Authorization: Bearer invalid-token-here"

# Expected: 401 Unauthorized
# { "error": { "code": "INVALID_TOKEN", "message": "Token is not valid" } }
```

### Test 4: Missing Token

```bash
# No authorization header
curl http://localhost:7040/api/v1/appointments

# Expected: 401 Unauthorized
# { "error": { "code": "UNAUTHORIZED", "message": "No authorization header provided" } }
```

### Test 5: Permission Check

```bash
# Try to access admin endpoint as regular user
curl http://localhost:7040/api/v1/admin/settings \
  -H "Authorization: Bearer <non-admin-token>"

# Expected: 403 Forbidden
# { "error": { "code": "INSUFFICIENT_PERMISSIONS" } }
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Auth Service"

**Symptom:**
```
503 Service Unavailable
{ "error": { "code": "SERVICE_UNAVAILABLE", "message": "Authentication service is currently unavailable" } }
```

**Solutions:**
1. Verify Auth Service is running: `curl http://localhost:7020/health`
2. Check AUTH_SERVICE_URL in your `.env`
3. Ensure no firewall blocking port 7020
4. Check Auth Service logs for errors

### Error: "Invalid service credentials"

**Symptom:**
```
500 Configuration Error
{ "error": { "code": "CONFIGURATION_ERROR", "message": "Service authentication misconfigured" } }
```

**Solutions:**
1. Verify AUTH_SERVICE_API_KEY matches in both services
2. Check Auth Service's SERVICE_API_KEYS includes your key
3. Restart Auth Service after changing SERVICE_API_KEYS
4. Ensure no trailing spaces in .env file

### Error: "AUTH_SERVICE_URL not set"

**Symptom:**
```
Error: CRITICAL: AUTH_SERVICE_URL environment variable is not set
```

**Solutions:**
1. Add `AUTH_SERVICE_URL=http://localhost:7020` to `.env`
2. Restart your service
3. Check `.env` file is in the correct directory
4. Verify dotenv is loaded: `require('dotenv').config()`

### Slow Authentication Responses

**Symptom:** Requests taking 3-5+ seconds

**Solutions:**
1. Check network latency between services
2. Verify Auth Service database connection
3. Check Auth Service logs for slow queries
4. Consider increasing timeout in middleware (default 5s)
5. Monitor Auth Service CPU/memory usage

---

## 🔒 Security Best Practices

### 1. API Key Management

✅ **DO:**
- Generate cryptographically secure keys (32+ bytes)
- Use different keys per environment (dev/staging/prod)
- Rotate keys quarterly
- Store keys in environment variables only
- Use secrets management (AWS Secrets Manager, Vault)

❌ **DON'T:**
- Hardcode keys in source code
- Commit keys to version control
- Share keys between services
- Use weak/short keys
- Log API keys

### 2. Network Security

```bash
# Production: Use HTTPS only
AUTH_SERVICE_URL=https://auth.nilecare.sd

# Docker: Use internal network
AUTH_SERVICE_URL=http://auth-service:7020

# Development: Localhost is OK
AUTH_SERVICE_URL=http://localhost:7020
```

### 3. Rate Limiting

The Auth Service has built-in rate limiting. Configure additional limits in your service:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Logging

Log authentication attempts for security monitoring:

```typescript
// Shared middleware automatically logs:
// ✓ Timestamp
// ✓ Service name
// ✓ User ID and email
// ✓ Success/failure status
// ✓ Request duration
// ✓ IP address
// ✓ User agent

// Check logs:
[Auth Middleware] ✓ {"timestamp":"2025-10-14T10:30:00Z","service":"appointment-service","status":"SUCCESS","userId":"123","userEmail":"doctor@nilecare.sd","duration":"45ms"}
```

### 5. Error Handling

Never expose sensitive information in error messages:

```typescript
// ❌ BAD
res.status(401).json({ 
  error: 'JWT verification failed: invalid signature using secret abc123...' 
});

// ✅ GOOD
res.status(401).json({ 
  error: { 
    code: 'INVALID_TOKEN', 
    message: 'Token is not valid' 
  } 
});
```

---

## 📊 Integration Checklist

Use this checklist when integrating a new service:

- [ ] Generate secure API key (32+ bytes)
- [ ] Add AUTH_SERVICE_URL to service `.env`
- [ ] Add AUTH_SERVICE_API_KEY to service `.env`
- [ ] Add API key to Auth Service's SERVICE_API_KEYS
- [ ] Install shared middleware: `npm install ../../shared`
- [ ] Import and apply `authenticate` middleware
- [ ] Remove any local JWT verification code
- [ ] Remove JWT_SECRET from service `.env`
- [ ] Test authentication with valid token
- [ ] Test authentication with expired token
- [ ] Test authentication with invalid token
- [ ] Test permission checks
- [ ] Verify logging is working
- [ ] Update service README with auth section
- [ ] Test in Docker environment
- [ ] Test with Auth Service down (graceful degradation)
- [ ] Add integration tests

---

## 📝 Service-Specific Configuration

### Appointment Service

```bash
# microservices/appointment-service/.env
SERVICE_NAME=appointment-service
AUTH_SERVICE_URL=http://localhost:7040
AUTH_SERVICE_API_KEY=<your-key>
```

### Business Service

```bash
# microservices/business/.env
SERVICE_NAME=business-service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<your-key>
```

### Payment Gateway Service

```bash
# microservices/payment-gateway-service/.env
SERVICE_NAME=payment-gateway-service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<your-key>
```

### Main NileCare Service

```bash
# microservices/main-nilecare/.env
SERVICE_NAME=main-nilecare-service
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<your-key>
```

---

## 🔗 Related Documentation

- [Auth Service Implementation Guide](./microservices/auth-service/START_HERE.md)
- [Auth Service Quick Start](./microservices/auth-service/QUICK_START_GUIDE.md)
- [Auth Service API Documentation](http://localhost:7020/api-docs)
- [NileCare System Documentation](./NILECARE_SYSTEM_DOCUMENTATION.md)

---

## 📞 Support

If you encounter issues:

1. Check Auth Service health: `curl http://localhost:7020/health`
2. Review Auth Service logs: `cd microservices/auth-service && npm run logs`
3. Check integration endpoint health: `curl http://localhost:7020/api/v1/integration/health`
4. Review this troubleshooting guide
5. Contact the platform team

---

**Last Updated:** October 14, 2025  
**Maintained By:** NileCare Platform Team  
**Version:** 2.0 - Production Ready ✅

