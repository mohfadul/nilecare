# 🔧 NileCare Environment Configuration Guide

**Last Updated:** October 15, 2025  
**Version:** 2.0.0

Complete guide for configuring environment variables across all NileCare services.

---

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Root Level Configuration](#root-level-configuration)
3. [Service-Specific Configuration](#service-specific-configuration)
4. [Security Best Practices](#security-best-practices)
5. [Production Configuration](#production-configuration)

---

## 🚀 Quick Setup

### Step 1: Generate Secrets

```bash
# Generate JWT secrets (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate service API keys (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Create .env Files

Create `.env` files in each service directory using the templates below.

### Step 3: Never Commit .env Files

Ensure `.env` is in your `.gitignore`:
```
.env
.env.*
!.env.example
```

---

## 🌍 Root Level Configuration

Create `.env` in project root:

```env
# NileCare Platform - Root Environment Configuration

# ===================================
# GLOBAL CONFIGURATION
# ===================================
NODE_ENV=development
LOG_LEVEL=info

# ===================================
# DATABASE CONFIGURATION
# ===================================

# MySQL (Primary Database)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=nilecare
MYSQL_USER=root
MYSQL_PASSWORD=

# PostgreSQL (Auth & Analytics)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=nilecare
POSTGRES_USER=nilecare_user
POSTGRES_PASSWORD=

# Redis (Caching & Sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ===================================
# SERVICE URLS (Development)
# ===================================
AUTH_SERVICE_URL=http://localhost:7020
MAIN_SERVICE_URL=http://localhost:7000
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040
PAYMENT_SERVICE_URL=http://localhost:7030

# ===================================
# FRONTEND CONFIGURATION
# ===================================
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# ===================================
# SECURITY (Generate Strong Secrets!)
# ===================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
```

---

## 🔐 Auth Service Configuration

**File:** `microservices/auth-service/.env`

```env
NODE_ENV=development
PORT=7020
SERVICE_NAME=auth-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT Secrets (⚠️ ONLY IN AUTH SERVICE!)
JWT_SECRET=generate-32-char-hex-key
JWT_REFRESH_SECRET=generate-32-char-hex-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=generate-32-char-hex-key
MFA_ENCRYPTION_KEY=generate-64-char-hex-key

# Service API Keys (comma-separated)
SERVICE_API_KEYS=key1,key2,key3,key4,key5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true
```

---

## 🏥 Main NileCare Service

**File:** `microservices/main-nilecare/.env`

```env
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Service URLs
AUTH_SERVICE_URL=http://localhost:7020
PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

# JWT (for backward compatibility)
JWT_SECRET=same-as-auth-service

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 💼 Business Service

**File:** `microservices/business/.env`

```env
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=generate-64-char-hex-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 📅 Appointment Service

**File:** `microservices/appointment-service/.env`

```env
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Auth Service Integration (⚠️ NO JWT_SECRET!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=generate-64-char-hex-key

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=nilecare@example.com

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Logging
LOG_LEVEL=info
LOG_AUTH=true
```

---

## 💳 Payment Gateway Service

**File:** `microservices/payment-gateway-service/.env`

```env
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=secure_password

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=generate-64-char-hex-key

# Payment Providers - Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Payment Providers - PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox

# Payment Providers - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_key

# Sudan Mobile Wallets (Optional)
ZAIN_CASH_MERCHANT_ID=your_id
ZAIN_CASH_API_KEY=your_key
MTN_MONEY_API_KEY=your_key
SUDANI_CASH_API_KEY=your_key

# Currency
DEFAULT_CURRENCY=SDG
SUPPORTED_CURRENCIES=SDG,USD,EUR

# Logging
LOG_LEVEL=info
```

---

## 🖥️ Web Dashboard (Frontend)

**File:** `clients/web-dashboard/.env`

```env
# API Endpoints
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_PAYMENT_SERVICE_URL=http://localhost:7030
VITE_APPOINTMENT_SERVICE_URL=http://localhost:7040
VITE_BUSINESS_SERVICE_URL=http://localhost:7010

# WebSocket (Optional)
VITE_WS_URL=ws://localhost:7000

# Environment
VITE_APP_ENV=development
```

---

## 🔒 Security Best Practices

### 1. Secret Generation

```bash
# JWT Secret (32 bytes = 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Service API Key (32 bytes = 64 hex characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MFA Encryption Key (64 bytes = 128 hex characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Secret Management

✅ **DO:**
- Use strong, random secrets (minimum 32 characters)
- Different secrets per environment (dev, staging, prod)
- Rotate secrets regularly (every 90 days)
- Use environment variables, never hardcode
- Use secret management tools in production (AWS Secrets Manager, HashiCorp Vault)

❌ **DON'T:**
- Commit `.env` files to version control
- Share secrets via email or chat
- Reuse secrets across services
- Use simple/guessable secrets
- Log secrets in application logs

### 3. Service API Keys

Each microservice needs a unique API key to communicate with Auth Service:

1. Generate a unique 64-character hex key per service
2. Add all keys to Auth Service `SERVICE_API_KEYS` (comma-separated)
3. Assign one key to each microservice's `AUTH_SERVICE_API_KEY`

**Example:**
```env
# Auth Service
SERVICE_API_KEYS=abc123...,def456...,ghi789...

# Business Service
AUTH_SERVICE_API_KEY=abc123...

# Appointment Service
AUTH_SERVICE_API_KEY=def456...

# Payment Service
AUTH_SERVICE_API_KEY=ghi789...
```

---

## 🚀 Production Configuration

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
DB_HOST=localhost
```

**Staging:**
```env
NODE_ENV=staging
LOG_LEVEL=info
DB_HOST=staging-db.internal
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=warn
DB_HOST=prod-db.internal
CORS_ORIGIN=https://nilecare.sd
```

### Production Security Checklist

- ✅ All secrets generated with cryptographically secure random
- ✅ JWT secrets minimum 64 characters
- ✅ Database passwords minimum 32 characters with special characters
- ✅ HTTPS enabled (`https://` in URLs)
- ✅ CORS configured for production domain only
- ✅ Redis password protected
- ✅ Database users have minimal required permissions
- ✅ Secrets stored in secret management system
- ✅ Environment variables not logged
- ✅ `.env` files never committed to version control

### Using Secret Management

**AWS Secrets Manager:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}

// Usage
const dbConfig = await getSecret('nilecare/database');
```

**HashiCorp Vault:**
```javascript
const vault = require('node-vault')();

async function getSecret(path) {
  const result = await vault.read(path);
  return result.data;
}

// Usage
const secrets = await getSecret('secret/nilecare/auth');
```

---

## 🔄 Environment Variable Priority

Order of precedence (highest to lowest):

1. **Docker secrets** (if using Docker Swarm)
2. **Kubernetes secrets** (if using K8s)
3. **Process environment variables** (`export VAR=value`)
4. **`.env` file** in service directory
5. **Default values** in code

---

## 📊 Service Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Auth Service | 7020 | HTTP |
| Main NileCare | 7000 | HTTP |
| Business Service | 7010 | HTTP |
| Appointment Service | 7040 | HTTP |
| Payment Gateway | 7030 | HTTP |
| Web Dashboard | 5173 | HTTP (dev) / 80 (prod) |
| MySQL | 3306 | TCP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |

---

## 🧪 Testing Configuration

Create `.env.test` for automated testing:

```env
NODE_ENV=test
DB_HOST=localhost
DB_NAME=nilecare_test
JWT_SECRET=test-secret-do-not-use-in-prod
REDIS_HOST=localhost
```

**Load in tests:**
```javascript
require('dotenv').config({ path: '.env.test' });
```

---

## 🆘 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "Environment variable not loading"
```javascript
// Ensure dotenv is loaded FIRST
require('dotenv').config();
const express = require('express');
```

### "CORS error in production"
```env
# Check CORS_ORIGIN matches frontend URL
CORS_ORIGIN=https://nilecare.sd
# NOT: http://localhost:5173
```

### "Auth Service can't validate tokens"
```env
# Ensure API key matches
# Auth Service:
SERVICE_API_KEYS=abc123...,def456...

# Other Service:
AUTH_SERVICE_API_KEY=abc123...
# Must be one of the keys listed in Auth Service
```

---

## 📚 Related Documentation

- [Quick Start Guide](./QUICKSTART.md) - Initial setup
- [Authentication Guide](./AUTHENTICATION.md) - Auth architecture
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

---

## 📞 Support

For configuration issues:
- 📧 Email: devops@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd
- 🔐 Security: security@nilecare.sd

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Status:** Production Ready


