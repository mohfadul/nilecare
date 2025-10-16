# 🔒 Fix #3: Auth Delegation Audit

**Status**: IN PROGRESS  
**Date**: October 16, 2025  
**Priority**: HIGH (Security Critical)

---

## 📋 **Problem Statement**

Currently, some microservices may be performing **local JWT verification** instead of delegating to the Auth Service. This creates:

❌ **Security Risks**:
- JWT secrets scattered across multiple services
- No real-time user status validation  
- Inconsistent RBAC across services
- Difficult to revoke access immediately

❌ **Maintenance Issues**:
- Duplicated auth logic  
- Hard to update auth rules
- No centralized audit logging

---

## ✅ **Solution: Centralized Auth Delegation**

All services MUST use the **shared auth middleware** that delegates to Auth Service:

```typescript
import { authenticate, requireRole, requirePermission } from '../../shared/middleware/auth';

// Example usage
router.get('/patients', authenticate, requireRole(['doctor', 'nurse']), getPatients);
```

---

## 🔍 **Current State**

### ✅ **Infrastructure Ready**

1. **Auth Service Integration Endpoints** ✅
   - `POST /api/v1/integration/validate-token` ✅
   - `POST /api/v1/integration/verify-permission` ✅
   - Service-to-service authentication ✅

2. **Shared Auth Middleware** ✅
   - Located: `shared/middleware/auth.ts`
   - Properly delegates to Auth Service
   - No local JWT verification
   - Comprehensive error handling

---

## 📊 **Services Audit**

### **Priority 1: Services with Stats Endpoints (Recently Modified)**

| Service | Port | Status | Issues | Action Required |
|---------|------|--------|--------|-----------------|
| **Clinical** | 7001 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |
| **Lab** | 7080 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |
| **Medication** | 7090 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |
| **Inventory** | 7100 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |
| **Appointment** | 7040 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |
| **Facility** | 7060 | ⚠️ TO AUDIT | Check if using shared middleware | Verify & fix |

### **Priority 2: Other Microservices**

| Service | Port | Status | Action |
|---------|------|--------|--------|
| **Auth** | 7020 | ✅ CORRECT | Has JWT secrets (source of truth) |
| **Main NileCare** | 7000 | ⚠️ TO AUDIT | Should use shared middleware |
| **Business** | 7010 | ⚠️ TO AUDIT | Check implementation |
| **Billing** | 7050 | ⚠️ TO AUDIT | Check implementation |
| **Payment Gateway** | 7030 | ⚠️ TO AUDIT | Check implementation |
| **Device Integration** | 7070 | ⚠️ TO AUDIT | Check implementation |
| **Notification** | 7007 | ⚠️ TO AUDIT | Check implementation |
| **CDS** | 7002 | ⚠️ TO AUDIT | Check implementation |

---

## 🔧 **Fix Requirements**

### **For Each Service (Except Auth Service):**

#### 1. **Check Current Implementation**
```bash
# Look for local JWT verification
grep -r "jwt.verify" microservices/[service-name]/src/
grep -r "JWT_SECRET" microservices/[service-name]/src/
grep -r "jsonwebtoken" microservices/[service-name]/src/
```

#### 2. **Verify Shared Middleware Usage**
```typescript
// ✅ CORRECT: Using shared middleware
import { authenticate } from '../../shared/middleware/auth';
app.use('/api/v1/protected', authenticate, handler);

// ❌ WRONG: Local JWT verification
import jwt from 'jsonwebtoken';
const payload = jwt.verify(token, process.env.JWT_SECRET);
```

#### 3. **Update Environment Variables**
```env
# ✅ REQUIRED for all services (except Auth)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=secure-api-key-here
SERVICE_NAME=service-name

# ❌ REMOVE from all services (except Auth)
JWT_SECRET=...  # DELETE THIS!
JWT_REFRESH_SECRET=...  # DELETE THIS!
```

#### 4. **Update package.json**
```json
// ❌ REMOVE if not Auth Service
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2"  // DELETE unless Auth Service
  }
}
```

---

## 📝 **Implementation Checklist**

### **Per Service:**

- [ ] **Audit**: Check for local JWT verification code
- [ ] **Remove**: Delete any local JWT verification  
- [ ] **Import**: Use shared auth middleware
- [ ] **Configure**: Add AUTH_SERVICE_URL and AUTH_SERVICE_API_KEY to .env
- [ ] **Remove**: Delete JWT_SECRET from .env (if not Auth Service)
- [ ] **Test**: Verify authentication works via Auth Service
- [ ] **Document**: Update service README

---

## 🎯 **Expected Outcome**

### **Before (Current State)**
```
Service → Local JWT Verification → Database
  ↑
  ❌ Each service has JWT secrets
  ❌ No real-time user validation
  ❌ Inconsistent auth logic
```

### **After (Target State)**
```
Service → Shared Middleware → Auth Service → Validates & Returns User
  ↑
  ✅ No JWT secrets in services
  ✅ Real-time user status checks
  ✅ Centralized auth logic
  ✅ Audit logging
```

---

## 🚀 **Implementation Plan**

### **Phase 1: Priority Services** (1-2 hours)
1. Clinical Service
2. Lab Service  
3. Medication Service
4. Inventory Service
5. Appointment Service
6. Facility Service

### **Phase 2: Remaining Services** (1 hour)
7. Main NileCare
8. Business Service
9. Billing Service
10. Payment Gateway
11. Device Integration
12. Notification Service
13. CDS Service

### **Phase 3: Testing & Verification** (30 mins)
- Test login flow
- Test protected endpoints
- Test role-based access
- Test permission checks
- Verify Auth Service logs

---

## 📚 **Resources**

### **Documentation**
- Shared Auth Middleware: `shared/middleware/auth.ts`
- Auth Service Integration: `microservices/auth-service/src/routes/integration.ts`
- Example Usage: See any service using shared middleware

### **Environment Variables Template**
```env
# Every service (except Auth) needs these:
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-secure-key
SERVICE_NAME=your-service-name

# Only Auth Service needs these:
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
SERVICE_API_KEYS=key1,key2,key3  # For validating service requests
```

---

## ⚠️ **Critical Notes**

1. **Auth Service is the only service that should have JWT_SECRET**
2. **All other services use AUTH_SERVICE_API_KEY to call Auth Service**
3. **Shared middleware handles all authentication logic**
4. **Services should NEVER call jwt.verify() directly**
5. **User status is validated in real-time on every request**

---

## 📊 **Success Criteria**

- ✅ All services use shared auth middleware
- ✅ No local JWT verification code (except Auth Service)
- ✅ No JWT_SECRET in services (except Auth Service)
- ✅ All services have AUTH_SERVICE_URL configured
- ✅ All services have AUTH_SERVICE_API_KEY configured
- ✅ Authentication works across all services
- ✅ Role-based access control works
- ✅ Permission checks delegate to Auth Service

---

**Next Steps**: Start auditing services one by one, beginning with Priority 1 services.

