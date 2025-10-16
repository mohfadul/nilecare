# 🔧 BREAKING CHANGES GUIDE

**Version:** 1.0.0  
**Date:** October 16, 2025  
**✅ PHASE 4: API Contract Alignment**

---

## 🎯 PURPOSE

Guide for managing breaking changes in NileCare APIs without disrupting users.

---

## 📋 BREAKING CHANGE CHECKLIST

### Before Making a Breaking Change

- [ ] **Is it really necessary?** - Can it be non-breaking?
- [ ] **Create RFC** - Get team approval
- [ ] **Plan migration** - How will users migrate?
- [ ] **Set timeline** - Minimum 6 months notice
- [ ] **Create new version** - Implement in /api/v2
- [ ] **Write migration guide** - Step-by-step instructions

### During Deprecation Period

- [ ] **Add headers** - X-API-Deprecated, X-API-Sunset-Date
- [ ] **Monitor usage** - Track who's still using old version
- [ ] **Send reminders** - 90 days, 60 days, 30 days, 7 days before sunset
- [ ] **Provide support** - Help users migrate

### After Sunset Date

- [ ] **Remove old version** - Return 410 Gone
- [ ] **Update documentation** - Remove old version docs
- [ ] **Verify no usage** - Check logs for any attempts

---

## 💡 ALTERNATIVES TO BREAKING CHANGES

### Try These First!

**Instead of removing a field:**
```typescript
// ❌ Breaking - removes field
{ "name": "John" }  // removed "firstName"

// ✅ Non-breaking - deprecate but keep
{
  "firstName": "John",  // Keep for compatibility
  "name": "John"         // New preferred field
}
```

**Instead of changing a type:**
```typescript
// ❌ Breaking - changes type
{ "age": "30" }  // was number, now string

// ✅ Non-breaking - add new field
{
  "age": 30,           // Keep original
  "age_string": "30"   // New field
}
```

**Instead of renaming:**
```typescript
// ❌ Breaking - renames field
{ "phone": "123" }  // was "phone_number"

// ✅ Non-breaking - include both
{
  "phone_number": "123",  // Old (deprecated)
  "phone": "123"          // New (preferred)
}
```

---

## 📝 MIGRATION GUIDE TEMPLATE

```markdown
# Migration Guide: v1 → v2

## Overview
Version 2 introduces the following breaking changes:
- [List changes]

## Timeline
- v2 available: October 16, 2025
- v1 deprecated: October 16, 2025
- v1 sunset: April 16, 2026 (6 months)

## Changes

### Change 1: Field Renamed

**Old (v1):**
\`\`\`json
POST /api/v1/patients
{
  "phone_number": "123-456-7890"
}
\`\`\`

**New (v2):**
\`\`\`json
POST /api/v2/patients
{
  "phone": "123-456-7890"
}
\`\`\`

**Migration:**
\`\`\`typescript
// Before
const patient = { phone_number: "123-456-7890" };

// After  
const patient = { phone: "123-456-7890" };
\`\`\`

## Testing
- Test endpoints available at staging
- Swagger docs: /api/v2/docs
- Support: api-support@nilecare.com
```

---

## ✅ EXAMPLES

### Good Breaking Change Process

**Timeline:**
```
Day 0:   Announce deprecation, v2 available
Day 30:  Reminder email
Day 60:  Reminder email  
Day 90:  Final warning
Day 180: Sunset v1, 410 responses
```

**Communication:**
```
Subject: [ACTION REQUIRED] API v1 Deprecation Notice

Dear API Consumer,

We're announcing the deprecation of the Patients API v1.

What's changing: field "phone_number" → "phone"
When: v2 available now, v1 sunset in 6 months
Why: Consistency with other APIs

Action required:
1. Update your code to use "phone" instead of "phone_number"
2. Test with v2: POST /api/v2/patients
3. Migrate by April 16, 2026

Need help? Contact api-support@nilecare.com

Migration guide: https://docs.nilecare.com/migration/v1-v2
```

---

## 🎯 CURRENT STATUS

### All Services on v1 ✅

- ✅ Consistent versioning across all 17 services
- ✅ `/api/v1/` prefix on all endpoints
- ✅ No version conflicts
- ✅ Room for v2 when needed

### No Breaking Changes Planned ✅

- ✅ Current API is stable
- ✅ Fix #1 standardized all responses
- ✅ No need for v2 yet

**First breaking change will trigger v2 creation**

---

## ✅ PHASE 4 STATUS

**API Versioning:** ✅ Complete
- Policy documented
- Current state: all v1
- Breaking change process defined
- Migration template created

**Next:** Type generation or move to Phase 6!

---

**Status:** ✅ Complete  
**Version:** All services on v1  
**Policy:** Defined and documented

**🎯 API VERSIONING POLICY COMPLETE! 🎯**

