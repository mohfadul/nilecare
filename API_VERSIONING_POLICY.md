# 📋 NILECARE API VERSIONING POLICY

**Version:** 1.0.0  
**Date:** October 16, 2025  
**Status:** ✅ Active Policy  
**✅ PHASE 4: API Contract Alignment**

---

## 🎯 OVERVIEW

This document defines how NileCare manages API versions, deprecations, and breaking changes.

---

## 📌 CURRENT VERSION

**All NileCare APIs use:** `/api/v1/`

**Format:** `/api/v{major_version}/{resource}`

**Examples:**
- `POST /api/v1/auth/login`
- `GET /api/v1/patients`
- `POST /api/v1/invoices`

---

## 🔢 VERSIONING STRATEGY

### Version Format

**URL-based versioning:** `/api/v{major}/`

- **v1** - Current stable version
- **v2** - Future major version (when breaking changes needed)
- **v3** - And so on...

**We DO NOT version:**
- Minor changes (new optional fields)
- Bug fixes
- New endpoints
- Additional response fields

**We DO version:**
- Removing endpoints
- Removing response fields
- Changing field types
- Renaming fields
- Authentication changes

---

## 🚨 BREAKING CHANGES

### What is a Breaking Change?

A change that **requires client code updates**:

❌ **Breaking:**
- Removing an endpoint
- Removing a response field
- Changing field type (string → number)
- Renaming a field
- Required → Optional (for responses)
- Optional → Required (for requests)
- Changing authentication requirements

✅ **Non-Breaking:**
- Adding new endpoint
- Adding optional request parameter
- Adding new response field
- Bug fixes
- Performance improvements
- Internal refactoring

---

## 📋 BREAKING CHANGE PROCESS

### 1. Announcement (T-90 days)

- ✅ Create RFC (Request for Comments)
- ✅ Email all API consumers
- ✅ Post in developer portal
- ✅ Add to release notes

**Example:**
```
BREAKING CHANGE ANNOUNCEMENT

Endpoint: POST /api/v1/patients
Field: phone_number → phone
Timeline: Deprecated 2025-10-16, Sunset 2026-01-16
Migration: Use 'phone' instead of 'phone_number'
New Version: Available at /api/v2/patients
```

### 2. Deprecation (T-60 days)

- ✅ Add deprecation headers to responses
- ✅ Update documentation with warnings
- ✅ Provide migration guide

**Headers:**
```
X-API-Deprecated: true
X-API-Sunset-Date: 2026-01-16
X-API-Replacement: /api/v2/patients
Deprecation: true
Sunset: Sat, 16 Jan 2026 00:00:00 GMT
```

### 3. New Version Available (T-30 days)

- ✅ Release `/api/v2` with breaking changes
- ✅ Keep `/api/v1` working (parallel)
- ✅ Provide side-by-side comparison
- ✅ Code examples for migration

### 4. Migration Period (6 months)

- ✅ Both v1 and v2 available
- ✅ Monitor v1 usage (decrease over time)
- ✅ Send reminders to clients still on v1
- ✅ Offer migration assistance

### 5. Sunset (T+180 days)

- ✅ Remove v1 endpoint
- ✅ Return 410 Gone with migration info
- ✅ Final email to any remaining users

**Example 410 Response:**
```json
{
  "status": 410,
  "success": false,
  "message": "This API version is no longer available",
  "error": {
    "code": "API_VERSION_SUNSET",
    "details": {
      "deprecated_date": "2025-10-16",
      "sunset_date": "2026-01-16",
      "replacement": "/api/v2/patients",
      "migration_guide": "https://docs.nilecare.com/api/migration/v1-to-v2"
    }
  }
}
```

---

## 🔄 NON-BREAKING CHANGES

**Can be added to existing version:**

### Adding New Fields (Response)

✅ **Allowed:** Add optional fields to response
```typescript
// v1 response
{ "name": "John", "age": 30 }

// Enhanced (still v1)
{ "name": "John", "age": 30, "email": "john@example.com" }
```

### Adding Optional Parameters (Request)

✅ **Allowed:** New optional query/body parameters
```typescript
// v1
GET /api/v1/patients?status=active

// Enhanced (still v1)
GET /api/v1/patients?status=active&facility_id=123
```

### New Endpoints

✅ **Allowed:** Add new endpoints to v1
```typescript
// Existing
POST /api/v1/patients

// New (still v1)
POST /api/v1/patients/batch
GET /api/v1/patients/:id/summary
```

---

## 📦 VERSION IMPLEMENTATION

### Backend Middleware

```typescript
// shared/middleware/api-version.ts

export function apiVersionMiddleware(req, res, next) {
  const version = req.path.match(/\/api\/(v\d+)/)?.[1];
  
  req.apiVersion = version || 'v1';
  res.setHeader('X-API-Version', req.apiVersion);
  
  // Check if version is deprecated
  const deprecated = checkDeprecated(req.apiVersion);
  if (deprecated) {
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Sunset-Date', deprecated.sunsetDate);
    res.setHeader('X-API-Replacement', deprecated.replacement);
  }
  
  next();
}

function checkDeprecated(version: string) {
  const deprecations = {
    'v0': {
      sunsetDate: '2025-12-31',
      replacement: '/api/v1',
    },
  };
  
  return deprecations[version];
}
```

### Frontend Version Handling

```typescript
// src/api/client.ts

const API_VERSION = 'v1';

export const apiClient = axios.create({
  baseURL: `${process.env.VITE_API_URL}/api/${API_VERSION}`,
});

// Check for deprecation warnings
apiClient.interceptors.response.use((response) => {
  if (response.headers['x-api-deprecated'] === 'true') {
    console.warn(`⚠️  API DEPRECATED: ${response.config.url}`);
    console.warn(`Sunset: ${response.headers['x-api-sunset-date']}`);
    console.warn(`Use: ${response.headers['x-api-replacement']}`);
  }
  return response;
});
```

---

## ✅ CURRENT STATUS

### All Services Use v1 ✅

- Auth Service: `/api/v1/auth/*`
- Business Service: `/api/v1/staff/*`
- Billing Service: `/api/v1/invoices/*`
- Payment Gateway: `/api/v1/payments/*`
- All 17 services: `/api/v1/*`

**Consistent! ✅**

### Response Format Standardized ✅

All services return:
```typescript
{
  status: number,
  success: boolean,
  message: string,
  data?: any,
  error?: {
    code: string,
    details?: any
  },
  timestamp: string,
  request_id: string
}
```

**Consistent! ✅**

---

## 📚 DOCUMENTATION

### For API Consumers

**Always include in release notes:**
- New endpoints added
- Fields added to responses
- **Breaking changes** (bold, highlighted)
- Migration guides
- Deprecation notices

### For Developers

**Checklist before making changes:**
- [ ] Is this a breaking change?
- [ ] If yes, create new version?
- [ ] If yes, deprecate old version
- [ ] Update documentation
- [ ] Add to release notes
- [ ] Communicate to users

---

## 🎯 BEST PRACTICES

### DO ✅

- Version major breaking changes
- Deprecate before removing
- Give 6 months notice
- Provide migration guides
- Communicate clearly
- Support old version during migration

### DON'T ❌

- Break APIs without notice
- Remove fields without deprecation
- Change types without versioning
- Surprise users with breaking changes
- Remove endpoints immediately

---

## 📞 COMMUNICATION CHANNELS

**When releasing breaking changes:**

1. **Email** - All registered API consumers
2. **Developer Portal** - Banner announcement
3. **Release Notes** - Highlighted section
4. **API Response Headers** - Deprecation headers
5. **Slack/Discord** - Community announcement
6. **Documentation** - Update immediately

---

## ✅ SUCCESS CRITERIA

- ✅ All APIs use consistent versioning
- ✅ Deprecation process documented
- ✅ Breaking change policy defined
- ✅ Migration guides template created
- ✅ Version middleware implemented
- ✅ Frontend handles deprecation warnings

---

**Status:** ✅ Policy Complete  
**Current Version:** v1 (across all services)  
**Next Version:** v2 (when needed)

**🎯 PHASE 4: API Versioning Policy Complete! 🎯**

