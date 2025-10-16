# 🔒 Fix #7: Remove Hardcoded Secrets

**Status**: IN PROGRESS  
**Date Started**: October 16, 2025  
**Priority**: 🔴 CRITICAL (Security)

---

## 📋 **Problem Statement**

Hardcoded secrets, credentials, URLs, and configuration values pose **CRITICAL security risks**:

### 🚨 **Security Risks**
❌ **Secrets exposed in Git history** (even if later removed)  
❌ **Credentials visible to all developers**  
❌ **Can't rotate secrets without code changes**  
❌ **Different environments share same values**  
❌ **Secrets in logs and error messages**  
❌ **Compliance violations** (PCI-DSS, HIPAA, etc.)

### 🚨 **Operational Risks**
❌ **Can't change config without redeployment**  
❌ **Different values for dev/staging/prod hardcoded**  
❌ **Testing requires modifying source code**  
❌ **Service URLs can't be dynamically configured**

---

## 🎯 **What We're Looking For**

### **1. Secrets & Credentials**
- API Keys (Stripe, PayPal, SMS, Email, etc.)
- Database passwords
- JWT secrets
- Encryption keys
- Service API keys
- OAuth client secrets
- Webhook secrets

### **2. URLs & Endpoints**
- Service URLs (http://localhost:7020)
- Database URLs
- External API endpoints
- Webhook URLs
- Redirect URLs

### **3. Configuration Values**
- Port numbers
- Database names
- Timeouts
- Retry counts
- Cache TTLs

### **4. Test/Demo Data**
- Test user credentials
- Demo organization IDs
- Sample patient data
- Test payment credentials

---

## 🔍 **Audit Strategy**

### **Phase 1: Automated Search**
```bash
# Search for common patterns
grep -r "password.*=.*'" microservices/
grep -r "secret.*=.*'" microservices/
grep -r "key.*=.*'" microservices/
grep -r "api_key.*=.*'" microservices/
grep -r "http://localhost:" microservices/
grep -r "mysql://\|postgres://\|mongodb://" microservices/
```

### **Phase 2: Manual Review**
- Review configuration files
- Check initialization code
- Examine connection strings
- Review test files
- Check documentation examples

### **Phase 3: Verification**
- No secrets in source code
- All config from environment
- .env.example has all variables
- No secrets in git history (if found, use git-filter-branch)

---

## 📊 **Audit Results**

### **Services to Audit** (Priority Order)

1. ✅ Auth Service (Port 7020) - MOST CRITICAL
2. ⏳ Payment Gateway (Port 7030) - Has Stripe/PayPal keys
3. ⏳ Billing Service (Port 7050) - Payment processing
4. ⏳ Notification Service (Port 7007) - SMTP credentials
5. ⏳ Main NileCare (Port 7000) - Service URLs
6. ⏳ All other services

---

## 🔧 **Fix Pattern**

### **Before (INSECURE ❌)**
```typescript
const stripeKey = 'sk_test_51ABC123...';  // ❌ HARDCODED!
const dbPassword = 'MyP@ssw0rd123';        // ❌ HARDCODED!
const jwtSecret = 'super-secret-key';      // ❌ HARDCODED!
const serviceUrl = 'http://localhost:7020'; // ❌ HARDCODED!
```

### **After (SECURE ✅)**
```typescript
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable required');
}

const dbPassword = process.env.DB_PASSWORD;
if (!dbPassword && process.env.NODE_ENV === 'production') {
  throw new Error('DB_PASSWORD required in production');
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable required');
}

const serviceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
```

---

## 📝 **Findings Template**

| Service | File | Line | Type | Value | Severity | Status |
|---------|------|------|------|-------|----------|--------|
| Auth | config.ts | 45 | JWT_SECRET | hardcoded | 🔴 CRITICAL | ⏳ |
| Payment | stripe.ts | 12 | API Key | hardcoded | 🔴 CRITICAL | ⏳ |

---

## ✅ **Success Criteria**

- ✅ No hardcoded secrets in source code
- ✅ No hardcoded passwords
- ✅ No hardcoded API keys
- ✅ All config from environment variables
- ✅ .env.example has all required variables
- ✅ Environment validation on startup
- ✅ Clear error messages for missing vars
- ✅ Documentation updated

---

**Next**: Start systematic audit of each service

