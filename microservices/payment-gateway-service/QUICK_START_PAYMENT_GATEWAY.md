# 🚀 Payment Gateway Quick Start Guide

**Service:** Payment Gateway Service  
**Port:** 7030  
**Architecture:** Phase 2/3 Integrated

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd microservices/payment-gateway-service
npm install
```

### Step 2: Configure Environment
The `.env` file is already created. Review and update if needed:
```bash
# Located at: microservices/payment-gateway-service/.env
# Already configured with:
# - Auth service integration
# - Database settings
# - Redis configuration
# - Payment encryption keys
# - Provider API keys
```

### Step 3: Start the Service
```bash
npm run dev
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
💳  PAYMENT GATEWAY SERVICE STARTED
═══════════════════════════════════════════════════════════
📡  Service URL:       http://localhost:7030
🏥  Health Check:      http://localhost:7030/health

🔐  Authentication:    Delegated to auth-service:7020
📊  Logging:           Centralized via @nilecare/logger
🛡️  Error Handling:    Standardized via @nilecare/error-handler

💰  Payment Providers:
   ✅ Bank of Khartoum, Faisal Islamic, Omdurman National
   ✅ Zain Cash, MTN Money, Sudani Cash, Bankak
   ✅ Visa, Mastercard, Stripe
   ✅ Cash, Cheque, Bank Transfer

✅ Payment Gateway Ready!
═══════════════════════════════════════════════════════════
```

---

## 🧪 Test the Service

### 1. Health Check
```bash
curl http://localhost:7030/health
```

**Expected:**
```json
{
  "status": "ok",
  "service": "payment-gateway-service",
  "version": "2.0.0",
  "timestamp": "2025-10-15T..."
}
```

### 2. Detailed Health Check
```bash
curl http://localhost:7030/health/detailed
```

### 3. Service Info
```bash
curl http://localhost:7030/
```

**Expected:**
```json
{
  "service": "NileCare Payment Gateway Service",
  "version": "2.0.0",
  "status": "running",
  "port": 7030,
  "architecture": {
    "phase1": "Centralized authentication via auth-service",
    "phase2": "Shared packages (logger, config, errors)",
    "phase3": "Observability ready (metrics, tracing)"
  },
  "providers": {
    "sudanese": ["Bank of Khartoum", "Faisal Islamic", "Omdurman National"],
    "mobileWallets": ["Zain Cash", "MTN Money", "Sudani Cash", "Bankak"],
    "international": ["Visa", "Mastercard", "Stripe"],
    "traditional": ["Cash", "Cheque", "Bank Transfer"]
  }
}
```

---

## 💰 Test Payment Flow

### Prerequisites:
1. ✅ Auth service running (port 7020)
2. ✅ Database running (MySQL on port 3306)
3. ✅ Orchestrator running (port 7000)
4. ✅ Valid user token (from auth service)

### Flow 1: Cash Payment (Simplest)

```bash
# Get auth token first
TOKEN=$(curl -s -X POST http://localhost:7000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.com","password":"Admin@2024"}' \
  | jq -r '.token')

# Initiate cash payment
curl -X POST http://localhost:7000/api/v1/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "inv_test_001",
    "patientId": "pat_test_001",
    "facilityId": "fac_test_001",
    "providerName": "cash",
    "amount": 500.00,
    "currency": "SDG",
    "paymentMethodDetails": {
      "denominationBreakdown": {
        "500": 1
      },
      "receivedBy": "Cashier-001"
    }
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "paymentId": "pay_...",
#     "status": "awaiting_verification",
#     "transactionId": "TXN-...",
#     "merchantReference": "MR-...",
#     "requiresManualVerification": true
#   }
# }

# Verify payment (finance role required)
curl -X POST http://localhost:7000/api/v1/payments/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_...",
    "verificationMethod": "cash_receipt",
    "verifiedBy": "user_finance",
    "verificationNotes": "Cash received and counted"
  }'
```

### Flow 2: Zain Cash (Mobile Wallet)

```bash
# Initiate Zain Cash payment
curl -X POST http://localhost:7000/api/v1/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "inv_test_002",
    "patientId": "pat_test_001",
    "facilityId": "fac_test_001",
    "providerName": "zain_cash",
    "amount": 1000.00,
    "currency": "SDG",
    "phoneNumber": "+249912345678"
  }'

# Response includes payment URL:
# {
#   "success": true,
#   "data": {
#     "paymentId": "pay_...",
#     "paymentUrl": "https://zaincash.sd/payment/...",
#     "qrCode": "data:image/png;base64,...",
#     "expiresAt": "2025-10-15T11:00:00Z"
#   }
# }

# Customer completes payment on their phone
# Webhook automatically verifies payment

# Check payment status
curl http://localhost:7000/api/v1/payments/pay_... \
  -H "Authorization: Bearer $TOKEN"
```

### Flow 3: List Payments

```bash
# Get all payments
curl http://localhost:7000/api/v1/payments \
  -H "Authorization: Bearer $TOKEN"

# Filter by facility
curl "http://localhost:7000/api/v1/payments?facilityId=fac_test_001" \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl "http://localhost:7000/api/v1/payments?status=confirmed" \
  -H "Authorization: Bearer $TOKEN"

# Payment statistics (finance role)
curl http://localhost:7000/api/v1/payments/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Flow 4: Refund

```bash
# Request refund (admin role required)
curl -X POST http://localhost:7000/api/v1/refunds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_...",
    "refundAmount": 500.00,
    "refundReason": "partial_refund",
    "refundReasonDetails": "Service cancelled by patient",
    "requestedBy": "admin_user"
  }'

# Check refund status
curl http://localhost:7000/api/v1/refunds/ref_... \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Troubleshooting

### Issue: "Service cannot start with invalid configuration"

**Solution:**
```bash
# Check .env file exists
ls -la microservices/payment-gateway-service/.env

# Verify all required vars are set
cat microservices/payment-gateway-service/.env | grep AUTH_SERVICE_URL
cat microservices/payment-gateway-service/.env | grep AUTH_SERVICE_API_KEY
cat microservices/payment-gateway-service/.env | grep PAYMENT_ENCRYPTION_KEY
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare_payment_system'"

# Create database if missing
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nilecare_payment_system"
```

### Issue: "Auth service not available"

**Solution:**
```bash
# Start auth service first
cd microservices/auth-service
npm run dev

# Verify it's running
curl http://localhost:7020/health
```

### Issue: "Redis connection failed"

**Solution:**
```bash
# Redis is optional for rate limiting
# Service will work without it, but with reduced functionality

# If you want Redis:
# - Start via docker-compose.phase3.yml
# - Or install Redis locally
```

---

## 📊 Monitoring

### Health Endpoints:

```bash
# Basic health
curl http://localhost:7030/health

# Readiness (checks all dependencies)
curl http://localhost:7030/health/ready

# Detailed metrics
curl http://localhost:7030/health/detailed
```

### Service Discovery:

The payment gateway is registered in the orchestrator's service registry:
```typescript
{
  'payment-service': 'http://localhost:7030'
}
```

Health checks run every 30 seconds.

---

## 🎯 Integration Checklist

- [x] Service starts successfully
- [x] Health checks pass
- [x] Auth service integration working
- [x] Database connection established
- [x] Routes accessible via orchestrator
- [x] Caching working
- [x] Error handling standardized
- [x] Logging centralized
- [x] Documentation complete

---

## 🎊 Success Criteria

### ✅ Service is ready when:
1. ✅ Service starts on port 7030
2. ✅ `/health` returns 200
3. ✅ `/health/ready` shows all dependencies connected
4. ✅ Auth service delegate working
5. ✅ Can initiate payments via orchestrator
6. ✅ Can verify payments
7. ✅ Can process refunds
8. ✅ Audit logging working

### 🎊 All Criteria Met!

**The Payment Gateway Service is fully operational and integrated!** 💳✨

---

## 📞 Support

**Documentation:**
- Integration Guide: `INTEGRATION_COMPLETE.md`
- Architecture: `🎯_PAYMENT_GATEWAY_MATURITY_PLAN.md`
- Main README: `README_ALL_PHASES_COMPLETE.md`

**Logs:**
- Service logs: `microservices/payment-gateway-service/logs/`
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

**API Documentation:**
- Provider configurations: `src/services/providers/`
- DTOs: `src/dtos/`
- Entities: `src/entities/`


