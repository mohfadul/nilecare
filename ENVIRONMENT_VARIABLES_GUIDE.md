# 🔐 Environment Variables Configuration Guide

**NileCare Platform - Complete Environment Variables Reference**

This guide provides all required environment variables for each microservice. Create a `.env` file in each service directory and configure these variables before deployment.

---

## 🚀 Quick Setup

For each microservice:
1. Navigate to the service directory (e.g., `cd microservices/auth-service`)
2. Create a `.env` file
3. Copy the relevant configuration from below
4. Replace placeholder values with actual secrets

---

## 1️⃣ Auth Service (`microservices/auth-service/.env`)

```bash
# ============================================================================
# SERVICE CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

# ============================================================================
# SESSION CONFIGURATION (REQUIRED - NO FALLBACK)
# ============================================================================
SESSION_SECRET=your-strong-session-secret-min-32-characters-here

# ============================================================================
# JWT CONFIGURATION
# ============================================================================
JWT_SECRET=your-jwt-secret-min-32-characters-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=nilecare_user
DB_PASSWORD=your-secure-database-password

# ============================================================================
# OAUTH2/OIDC PROVIDERS (Optional)
# ============================================================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:3001/auth/microsoft/callback

# ============================================================================
# MFA CONFIGURATION
# ============================================================================
MFA_ISSUER=NileCare
MFA_APP_NAME=NileCare Healthcare Platform

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info
```

---

## 2️⃣ Payment Gateway Service (`microservices/payment-gateway-service/.env`)

```bash
# ============================================================================
# SERVICE CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=7001
SERVICE_NAME=payment-gateway-service
APP_URL=http://localhost:3000

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_payment_system
DB_USER=nilecare_user
DB_PASSWORD=your-secure-password-here
DB_CONNECTION_POOL_MIN=10
DB_CONNECTION_POOL_MAX=100

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=2

# ============================================================================
# KAFKA CONFIGURATION
# ============================================================================
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=payment-gateway-service

# ============================================================================
# JWT CONFIGURATION
# ============================================================================
JWT_SECRET=your-jwt-secret-min-32-characters-here

# ============================================================================
# PAYMENT ENCRYPTION (REQUIRED)
# Generate with: openssl rand -hex 32
# ============================================================================
PAYMENT_ENCRYPTION_KEY=your-256-bit-hex-encryption-key-here

# ============================================================================
# SUDAN PAYMENT PROVIDERS
# ============================================================================

# Bank of Khartoum
BANK_OF_KHARTOUM_API_KEY=your-api-key-here
BANK_OF_KHARTOUM_API_SECRET=your-api-secret-here
BANK_OF_KHARTOUM_API_URL=https://api.bankofkhartoum.com
BANK_OF_KHARTOUM_MERCHANT_ID=your-merchant-id

# Zain Cash
ZAIN_CASH_API_KEY=your-api-key-here
ZAIN_CASH_API_SECRET=your-api-secret-here
ZAIN_CASH_API_URL=https://api.zaincash.sd
ZAIN_CASH_MERCHANT_ID=your-merchant-id

# MTN Mobile Money
MTN_MONEY_API_KEY=your-api-key-here
MTN_MONEY_API_SECRET=your-api-secret-here
MTN_MONEY_API_URL=https://api.mtn.sd

# Sudani Cash
SUDANI_CASH_API_KEY=your-api-key-here
SUDANI_CASH_API_SECRET=your-api-secret-here
SUDANI_CASH_API_URL=https://api.sudanicash.sd

# ============================================================================
# AWS S3 (Evidence Storage)
# ============================================================================
AWS_REGION=me-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=nilecare-payment-evidence

# ============================================================================
# WEBHOOK CONFIGURATION
# ============================================================================
PAYMENT_WEBHOOK_SECRET=your-webhook-secret-here

# ============================================================================
# CORS CONFIGURATION
# ============================================================================
CORS_ORIGIN=http://localhost:3000

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# MONITORING
# ============================================================================
PROMETHEUS_ENABLED=true
LOG_LEVEL=info
```

---

## 3️⃣ Notification Service (`microservices/notification-service/.env`)

```bash
# ============================================================================
# SERVICE CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT=3002
CLIENT_URL=http://localhost:3000

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@nilecare.sd
EMAIL_FROM_NAME=NileCare Healthcare

# ============================================================================
# SMS CONFIGURATION (Sudan Providers)
# ============================================================================
SMS_PROVIDER=zain

ZAIN_SMS_API_KEY=your-zain-api-key
ZAIN_SMS_API_URL=https://api.zain.sd/sms
ZAIN_SMS_SENDER_ID=NileCare

MTN_SMS_API_KEY=your-mtn-api-key
MTN_SMS_API_URL=https://api.mtn.sd/sms
MTN_SMS_SENDER_ID=NileCare

SUDANI_SMS_API_KEY=your-sudani-api-key
SUDANI_SMS_API_URL=https://api.sudani.sd/sms
SUDANI_SMS_SENDER_ID=NileCare

# ============================================================================
# PUSH NOTIFICATION CONFIGURATION
# ============================================================================
FCM_SERVER_KEY=your-firebase-server-key
FCM_SENDER_ID=your-firebase-sender-id
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_notifications
DB_USER=nilecare_user
DB_PASSWORD=your-secure-database-password

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info
```

---

## 4️⃣ All Other Services (Template)

For **Gateway, Clinical, EHR, CDS, Medication, Lab, Billing, Appointment, Facility, Inventory, FHIR, HL7, Device Integration** services:

```bash
# ============================================================================
# SERVICE CONFIGURATION
# ============================================================================
NODE_ENV=development
PORT={service-specific-port}
CLIENT_URL=http://localhost:3000

# ============================================================================
# ALLOWED ORIGINS (for CORS)
# ============================================================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare_{service_name}
DB_USER=nilecare_user
DB_PASSWORD=your-secure-database-password

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================================================
# JWT CONFIGURATION
# ============================================================================
JWT_SECRET=your-jwt-secret-min-32-characters-here

# ============================================================================
# SERVICE URLS (for inter-service communication)
# ============================================================================
AUTH_SERVICE_URL=http://localhost:3001
CLINICAL_SERVICE_URL=http://localhost:4001
BUSINESS_SERVICE_URL=http://localhost:5001
DATA_SERVICE_URL=http://localhost:6001
NOTIFICATION_SERVICE_URL=http://localhost:3002

# ============================================================================
# KAFKA CONFIGURATION
# ============================================================================
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID={service-name}

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=info
```

---

## 🔒 Security Best Practices

### **Secret Generation**

```bash
# Generate SESSION_SECRET (32+ characters)
openssl rand -base64 32

# Generate PAYMENT_ENCRYPTION_KEY (64 hex characters)
openssl rand -hex 32

# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32

# Generate WEBHOOK_SECRET (32+ characters)
openssl rand -base64 32
```

### **Password Requirements**

- ✅ Minimum 16 characters
- ✅ Include uppercase, lowercase, numbers, special characters
- ✅ No dictionary words
- ✅ Different for each environment (dev, staging, production)

### **Secret Management**

1. **Development**: Use `.env` files (never commit!)
2. **Staging/Production**: Use:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Kubernetes Secrets

---

## 📊 Service Ports Reference

| Service | Port | Description |
|---------|------|-------------|
| **Gateway Service** | 3000 | API Gateway |
| **Auth Service** | 3001 | Authentication |
| **Notification Service** | 3002 | Notifications |
| **EHR Service** | 4001 | Electronic Health Records |
| **CDS Service** | 4002 | Clinical Decision Support |
| **Medication Service** | 4003 | Medication Management |
| **Lab Service** | 4004 | Laboratory |
| **Facility Service** | 5001 | Facility Management |
| **Appointment Service** | 5002 | Scheduling |
| **Billing Service** | 5003 | Billing & Claims |
| **Inventory Service** | 5004 | Inventory |
| **FHIR Service** | 6001 | FHIR API |
| **HL7 Service** | 6002 | HL7 Integration |
| **Device Integration** | 6003 | Medical Devices |
| **Payment Gateway** | 7001 | Payment Processing |

---

## ✅ Validation Checklist

Before starting services, verify:

- [ ] All `.env` files created
- [ ] All `REQUIRED` variables set
- [ ] Secrets are strong (32+ characters)
- [ ] Database credentials configured
- [ ] Payment provider keys configured (if applicable)
- [ ] Redis connection configured
- [ ] JWT secrets set and strong
- [ ] CORS origins properly configured
- [ ] Log levels appropriate for environment

---

## 🚨 Important Notes

1. **Never commit `.env` files** - they're in `.gitignore` for a reason
2. **Use different secrets** for dev, staging, and production
3. **Rotate secrets regularly** (quarterly recommended)
4. **Auth Service requires SESSION_SECRET** - service will not start without it
5. **Payment Gateway requires PAYMENT_ENCRYPTION_KEY** in specific format (64 hex chars)

---

## 🔗 Related Documentation

- `SECURITY_AUDIT_REPORT.md` - Complete security audit
- `SECURITY_IMPROVEMENTS_SUMMARY.md` - Quick reference
- `CODE_QUALITY_FIXES_COMPLETE.md` - Code quality improvements

---

**For support, contact the NileCare DevOps team.**

