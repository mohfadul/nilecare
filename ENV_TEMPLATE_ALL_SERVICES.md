# 🔐 NileCare Environment Variables Template

**Purpose**: Complete reference for all environment variables across all NileCare microservices  
**Security**: NEVER commit .env files to Git!

---

## 🎯 **Quick Start Per Service**

Copy this section to each service's `.env` file:

###  **All Services (Except Auth Service)**

```env
# Auth Delegation (REQUIRED for all services)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=generate-unique-key-per-service
SERVICE_NAME=your-service-name
```

---

## 📦 **Service-Specific Environment Variables**

### 1️⃣ **Auth Service** (Port 7020)

```env
NODE_ENV=development
PORT=7020
SERVICE_NAME=auth-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=auth_db
DB_USER=root
DB_PASSWORD=your-db-password

# JWT Secrets (ONLY Auth Service needs these!)
JWT_SECRET=super-secret-jwt-key-min-32-characters-long-change-in-production
JWT_REFRESH_SECRET=different-refresh-secret-also-32-chars-minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret-32-chars-minimum
SESSION_MAX_AGE=86400000

# MFA
MFA_ENCRYPTION_KEY=your-mfa-encryption-key-32-characters
MFA_ISSUER=NileCare

# Service API Keys (comma-separated)
SERVICE_API_KEYS=key-for-clinical,key-for-lab,key-for-medication,key-for-inventory,key-for-appointment,key-for-facility,key-for-main-nilecare,key-for-billing,key-for-payment,key-for-business,key-for-device,key-for-notification,key-for-cds

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMTP (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@nilecare.sd
SMTP_FROM_NAME=NileCare Healthcare

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 2️⃣ **Clinical Service** (Port 7001)

```env
NODE_ENV=development
PORT=7001
SERVICE_NAME=clinical-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-clinical-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinical_db
DB_USER=root
DB_PASSWORD=your-db-password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 3️⃣ **Lab Service** (Port 7080)

```env
NODE_ENV=development
PORT=7080
SERVICE_NAME=lab-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-lab-service

# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lab_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 4️⃣ **Medication Service** (Port 7090)

```env
NODE_ENV=development
PORT=7090
SERVICE_NAME=medication-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-medication-service

# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=medication_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 5️⃣ **Inventory Service** (Port 7100)

```env
NODE_ENV=development
PORT=7100
SERVICE_NAME=inventory-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-inventory-service

# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=inventory_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 6️⃣ **Appointment Service** (Port 7040)

```env
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-appointment-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=appointment_db
DB_USER=root
DB_PASSWORD=your-db-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 7️⃣ **Facility Service** (Port 7060)

```env
NODE_ENV=development
PORT=7060
SERVICE_NAME=facility-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-facility-service

# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=facility_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 8️⃣ **Billing Service** (Port 7050)

```env
NODE_ENV=development
PORT=7050
SERVICE_NAME=billing-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-billing-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=billing_db
DB_USER=root
DB_PASSWORD=your-db-password

# Payment Gateway Integration
PAYMENT_GATEWAY_URL=http://localhost:7030

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 9️⃣ **Payment Gateway Service** (Port 7030)

```env
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-payment-gateway

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=payment_db
DB_USER=root
DB_PASSWORD=your-db-password

# Payment Encryption
PAYMENT_ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
PAYMENT_WEBHOOK_SECRET=secure-webhook-secret-32-chars

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal (Optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_MODE=sandbox

# Local Payment Providers (Optional)
BANK_OF_KHARTOUM_API_KEY=your-bok-api-key
BANK_OF_KHARTOUM_API_SECRET=your-bok-secret
ZAIN_CASH_API_KEY=your-zain-api-key
ZAIN_CASH_API_SECRET=your-zain-secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 🔟 **Notification Service** (Port 7007)

```env
NODE_ENV=development
PORT=7007
SERVICE_NAME=notification-service

# Auth Delegation
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=unique-key-for-notification-service

# Redis (REQUIRED)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@nilecare.sd
SMTP_FROM_NAME=NileCare Healthcare

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Push (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Feature Flags
FEATURE_EMAIL_ENABLED=true
FEATURE_SMS_ENABLED=true
FEATURE_PUSH_ENABLED=true

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### 1️⃣1️⃣ **Main NileCare Orchestrator** (Port 7000)

```env
NODE_ENV=development
PORT=7000

# Service URLs
AUTH_SERVICE_URL=http://localhost:7020
CLINICAL_SERVICE_URL=http://localhost:7001
APPOINTMENT_SERVICE_URL=http://localhost:7040
BILLING_SERVICE_URL=http://localhost:7050
PAYMENT_SERVICE_URL=http://localhost:7030
LAB_SERVICE_URL=http://localhost:7080
MEDICATION_SERVICE_URL=http://localhost:7090
INVENTORY_SERVICE_URL=http://localhost:7100
FACILITY_SERVICE_URL=http://localhost:7060
BUSINESS_SERVICE_URL=http://localhost:7010
DEVICE_SERVICE_URL=http://localhost:7070
NOTIFICATION_SERVICE_URL=http://localhost:7007
CDS_SERVICE_URL=http://localhost:7002

# Redis Cache (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL=300

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 🔑 **How to Generate Secure Secrets**

### **JWT Secrets** (32+ characters)
```bash
# Option 1: OpenSSL
openssl rand -base64 48

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Password generator
# Use a password manager to generate 32+ character random string
```

### **Encryption Keys** (64 hex characters = 32 bytes)
```bash
openssl rand -hex 32
```

### **Service API Keys** (32+ characters)
```bash
# Generate unique key for each service
openssl rand -base64 32
```

### **Webhook Secrets**
```bash
openssl rand -base64 32
```

---

## 🚨 **Critical Security Rules**

### ✅ **DO's**
1. ✅ Use unique secrets for each environment (dev/staging/prod)
2. ✅ Rotate secrets regularly (every 90 days)
3. ✅ Store secrets in secure vaults (AWS Secrets Manager, HashiCorp Vault)
4. ✅ Use strong random secrets (32+ characters)
5. ✅ Validate secrets on service startup
6. ✅ Never log secret values

### ❌ **DON'Ts**
1. ❌ NEVER commit .env files to Git
2. ❌ NEVER use "password", "secret", "test" as secrets
3. ❌ NEVER reuse secrets across services
4. ❌ NEVER share secrets in Slack/Email
5. ❌ NEVER hardcode secrets in source code
6. ❌ NEVER use weak/short secrets

---

## 📋 **Service Startup Checklist**

Before starting any service:

1. [ ] Copy appropriate template from this file
2. [ ] Create `.env` file in service directory
3. [ ] Generate strong secrets using commands above
4. [ ] Update all required variables
5. [ ] Run validation: `node scripts/validate-env.js <service-name>`
6. [ ] Start service: `npm run dev`
7. [ ] Verify service logs show "✅" for all required configs

---

## 🧪 **Validation Script**

Validate a single service:
```bash
node scripts/validate-env.js auth-service
```

Validate all services:
```bash
node scripts/validate-env.js all
```

---

## 🔄 **Secret Rotation Guide**

### **When to Rotate**
- Every 90 days (scheduled)
- After team member leaves
- If secret potentially compromised
- Before major deployment

### **How to Rotate**
1. Generate new secrets using above commands
2. Update .env files in all environments
3. Deploy services with new secrets
4. Revoke old secrets after verification
5. Update secret vault/manager

---

**Last Updated**: October 16, 2025  
**Maintained By**: DevOps Team

