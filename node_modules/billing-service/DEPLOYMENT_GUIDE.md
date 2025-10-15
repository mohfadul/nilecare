# 🚀 Billing Service Deployment Guide

**Service:** NileCare Billing Service  
**Version:** 1.0.0  
**Port:** 5003

---

## 📋 Pre-Deployment Checklist

- [ ] Auth Service is running and accessible (port 7020)
- [ ] Payment Gateway is running and accessible (port 7030)
- [ ] MySQL database is running with `nilecare` database created
- [ ] Database schema has been loaded (`database/schema.sql`)
- [ ] Service API keys have been generated
- [ ] API keys are registered with Auth Service
- [ ] Environment variables are configured
- [ ] All dependencies are installed
- [ ] Service builds successfully (`npm run build`)

---

## 🔧 Step 1: Database Setup

### Create Tables

```bash
# Connect to MySQL
mysql -u root -p

# Create database if not exists
CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit;

# Load billing schema
mysql -u root -p nilecare < microservices/billing-service/database/schema.sql
```

### Verify Tables

```bash
mysql -u root -p nilecare -e "
  SELECT TABLE_NAME, TABLE_ROWS 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = 'nilecare' 
    AND TABLE_NAME IN (
      'invoices', 'invoice_line_items', 'billing_accounts',
      'insurance_claims', 'billing_audit_log'
    );
"
```

**Expected Output:**
```
+----------------------------+------------+
| TABLE_NAME                 | TABLE_ROWS |
+----------------------------+------------+
| invoices                   |          0 |
| invoice_line_items         |          0 |
| billing_accounts           |          0 |
| insurance_claims           |          0 |
| billing_audit_log          |          0 |
+----------------------------+------------+
```

---

## 🔑 Step 2: Generate Service API Keys

```bash
# Generate Auth Service API key
node -e "console.log('AUTH_SERVICE_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate Payment Gateway API key
node -e "console.log('PAYMENT_GATEWAY_API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (optional)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate webhook secret (optional)
node -e "console.log('WEBHOOK_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Save these keys securely!**

---

## 📝 Step 3: Configure Environment

Create `.env` file in `microservices/billing-service/`:

```env
# ============================================================================
# PRODUCTION CONFIGURATION
# ============================================================================

NODE_ENV=production
PORT=5003
SERVICE_NAME=billing-service
LOG_LEVEL=info

# ============================================================================
# DATABASE (SHARED 'nilecare' database)
# ============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=<strong-password>
DB_CONNECTION_POOL_MAX=20

# ============================================================================
# AUTH SERVICE (REQUIRED)
# ============================================================================
AUTH_SERVICE_URL=http://auth-service:7020
AUTH_SERVICE_API_KEY=<generated-key-from-step-2>

# ⚠️ Register this key in Auth Service .env:
# SERVICE_API_KEYS=...,<this-key>,...

# ============================================================================
# PAYMENT GATEWAY (REQUIRED)
# ============================================================================
PAYMENT_GATEWAY_URL=http://payment-gateway:7030
PAYMENT_GATEWAY_API_KEY=<generated-key-from-step-2>

# ============================================================================
# CORS
# ============================================================================
ALLOWED_ORIGINS=https://dashboard.nilecare.sd
CLIENT_URL=https://dashboard.nilecare.sd

# ============================================================================
# RATE LIMITING
# ============================================================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# BILLING CONFIGURATION
# ============================================================================
DEFAULT_CURRENCY=SDG
DEFAULT_PAYMENT_TERMS=Net 30
DEFAULT_GRACE_PERIOD_DAYS=7
DEFAULT_LATE_FEE_PERCENTAGE=2.00

# ============================================================================
# SCHEDULED TASKS
# ============================================================================
OVERDUE_CHECK_CRON_SCHEDULE=0 2 * * *
LATE_FEE_CRON_SCHEDULE=0 0 * * *

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_AUTO_LATE_FEES=false
ENABLE_AUTO_REMINDERS=true
ENABLE_AUDIT_LOGGING=true

# ============================================================================
# OPTIONAL: EMAIL (for invoices)
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=billing@nilecare.sd
SMTP_PASSWORD=<app-password>
EMAIL_FROM=billing@nilecare.sd

# ============================================================================
# OPTIONAL: ENCRYPTION
# ============================================================================
ENCRYPTION_KEY=<64-char-hex-key>
```

---

## 🔗 Step 4: Register with Auth Service

**Add Billing Service API key to Auth Service:**

1. Open Auth Service `.env` file:
   ```bash
   cd microservices/auth-service
   nano .env
   ```

2. Add billing service key to `SERVICE_API_KEYS`:
   ```env
   SERVICE_API_KEYS=business_key_abc,payment_key_def,<billing-service-key>
   ```

3. Restart Auth Service:
   ```bash
   npm run dev
   # OR
   docker restart nilecare-auth-service
   ```

---

## 🏗️ Step 5: Build and Deploy

### Local Development

```bash
cd microservices/billing-service

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Docker Deployment

```bash
cd microservices/billing-service

# Build Docker image
docker build -t nilecare/billing-service:1.0.0 .

# Run container
docker run -d \
  --name nilecare-billing-service \
  --network nilecare-network \
  -p 5003:5003 \
  --env-file .env \
  nilecare/billing-service:1.0.0

# Check logs
docker logs nilecare-billing-service -f

# Check status
docker ps | grep billing-service
```

### Docker Compose

Add to `docker-compose.yml`:

```yaml
billing-service:
  build:
    context: ./microservices/billing-service
    dockerfile: Dockerfile
  container_name: nilecare-billing-service
  ports:
    - "5003:5003"
  environment:
    - NODE_ENV=production
    - PORT=5003
    - DB_HOST=mysql
    - DB_NAME=nilecare
    - AUTH_SERVICE_URL=http://auth-service:7020
    - PAYMENT_GATEWAY_URL=http://payment-gateway:7030
  env_file:
    - ./microservices/billing-service/.env
  depends_on:
    - mysql
    - auth-service
    - payment-gateway
  networks:
    - nilecare-network
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5003/health"]
    interval: 30s
    timeout: 3s
    retries: 3
    start_period: 40s
```

Then deploy:
```bash
docker-compose up -d billing-service
```

---

## ✅ Step 6: Verify Deployment

### Test Health Endpoints

```bash
# Liveness
curl http://localhost:5003/health
# Expected: {"status":"healthy",...}

# Readiness
curl http://localhost:5003/health/ready
# Expected: {"status":"ready","checks":{"database":"connected","paymentGateway":"accessible"}}

# Service info
curl http://localhost:5003/
# Expected: Service metadata
```

### Test Authentication

```bash
# 1. Get token from Auth Service
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"TestPass123!"}' \
  | jq -r '.data.accessToken')

# 2. Test authenticated endpoint
curl -X GET http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"success":true,"data":[...]}
```

### Test Database Connectivity

```bash
mysql -u root -p nilecare -e "
  SELECT COUNT(*) as count FROM invoices;
  SELECT COUNT(*) as count FROM billing_accounts;
  SELECT COUNT(*) as count FROM insurance_claims;
"
```

### Test Integration with Payment Gateway

```bash
# Create invoice
INVOICE_ID=$(curl -X POST http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "test-patient-uuid",
    "facilityId": "test-facility-uuid",
    "invoiceType": "consultation",
    "invoiceDate": "2025-10-14",
    "dueDate": "2025-11-14",
    "lineItems": [{
      "itemType": "consultation",
      "itemName": "Test Consultation",
      "quantity": 1,
      "unitPrice": 100.00
    }]
  }' | jq -r '.data.id')

# Sync payment status (should query Payment Gateway)
curl -X POST http://localhost:5003/api/v1/invoices/$INVOICE_ID/sync-payment \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Step 7: Monitor Initial Operation

### Check Logs

```bash
# Application logs
tail -f microservices/billing-service/logs/combined.log

# Error logs
tail -f microservices/billing-service/logs/error.log

# Audit logs
tail -f microservices/billing-service/logs/audit.log

# Docker logs
docker logs nilecare-billing-service -f
```

### Monitor Audit Trail

```bash
mysql -u root -p nilecare -e "
  SELECT 
    action, 
    resource_type, 
    user_id, 
    result, 
    COUNT(*) as count 
  FROM billing_audit_log 
  GROUP BY action, resource_type, user_id, result 
  ORDER BY COUNT(*) DESC 
  LIMIT 20;
"
```

### Monitor Performance

```bash
# Watch request rate and response times
tail -f logs/combined.log | grep "duration"

# Check Prometheus metrics
watch -n 5 'curl -s http://localhost:5003/metrics'
```

---

## 🔒 Security Checklist

- [x] All endpoints require authentication
- [x] Token validation via Auth Service
- [x] Permission-based access control
- [x] Rate limiting enabled
- [x] SQL injection prevention (parameterized queries)
- [x] Input validation (Joi schemas)
- [x] Audit logging enabled
- [x] Error masking (no internal details exposed)
- [x] CORS configured
- [x] Helmet security headers
- [ ] HTTPS enabled (configure reverse proxy)
- [ ] API key rotation policy defined
- [ ] Regular security audits scheduled

---

## 🐛 Troubleshooting

### Service won't start

**Check configuration:**
```bash
# Verify environment variables
cat .env | grep -v "^#" | grep -v "^$"

# Check required services
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7030/health  # Payment Gateway
```

**Check logs:**
```bash
tail -f logs/error.log
```

### Authentication fails

**Problem:** `401 Unauthorized` on all requests

**Solution:**
```bash
# 1. Verify Auth Service is running
curl http://localhost:7020/health

# 2. Verify API key is configured
echo $AUTH_SERVICE_API_KEY

# 3. Verify key is registered in Auth Service
# Check auth-service/.env: SERVICE_API_KEYS should include this key

# 4. Restart Auth Service after adding key
cd microservices/auth-service
npm run dev
```

### Payment Gateway integration fails

**Problem:** `500 Internal Error` when syncing payment status

**Solution:**
```bash
# 1. Verify Payment Gateway is running
curl http://localhost:7030/health

# 2. Test direct query
curl -X GET http://localhost:7030/api/v1/payments \
  -H "X-Service-Key: $PAYMENT_GATEWAY_API_KEY"

# 3. Check logs for API errors
tail -f logs/error.log | grep "Payment Gateway"
```

### Database errors

**Problem:** `Database operation failed`

**Solution:**
```bash
# 1. Verify database connection
mysql -u root -p nilecare -e "SELECT 1;"

# 2. Verify schema is loaded
mysql -u root -p nilecare -e "SHOW TABLES LIKE '%invoice%';"

# 3. Check missing tables
mysql -u root -p nilecare < database/schema.sql

# 4. Restart service
npm run dev
```

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# 1. Stop new service
docker stop nilecare-billing-service

# 2. Start previous version
docker start nilecare-billing-service-previous

# 3. Verify health
curl http://localhost:5003/health

# 4. Check logs
docker logs nilecare-billing-service-previous -f

# 5. Database rollback (if schema changed)
mysql -u root -p nilecare < database/rollback-v1.0.0.sql
```

---

## 📈 Post-Deployment Monitoring

### First 24 Hours

**Monitor these metrics:**

1. **Request Rate**
   ```bash
   tail -f logs/combined.log | grep "Incoming request" | wc -l
   ```

2. **Error Rate**
   ```bash
   tail -f logs/error.log | wc -l
   ```

3. **Authentication Failures**
   ```bash
   grep "Authentication error" logs/combined.log | wc -l
   ```

4. **Database Performance**
   ```bash
   mysql -u root -p nilecare -e "
     SHOW STATUS LIKE 'Threads_connected';
     SHOW STATUS LIKE 'Slow_queries';
   "
   ```

5. **Audit Log Growth**
   ```bash
   mysql -u root -p nilecare -e "
     SELECT COUNT(*) as total_actions FROM billing_audit_log;
     SELECT action, COUNT(*) as count 
     FROM billing_audit_log 
     GROUP BY action 
     ORDER BY count DESC 
     LIMIT 10;
   "
   ```

---

## 🎯 Success Criteria

**Deployment is successful if:**

- ✅ Health check returns `200 OK`
- ✅ Readiness check shows all dependencies connected
- ✅ Service responds to authenticated requests
- ✅ Can create invoices successfully
- ✅ Can query Payment Gateway for payment status
- ✅ Audit logs are being written to database
- ✅ No errors in logs for 1 hour
- ✅ Response times < 500ms (95th percentile)

---

## 📊 Rollout Strategy

### Recommended Approach

**Phase 1: Development (Week 1)**
- Deploy to dev environment
- Integration testing with Auth Service
- Integration testing with Payment Gateway
- Load sample data and test workflows

**Phase 2: Staging (Week 2)**
- Deploy to staging with production-like data
- User acceptance testing
- Performance testing (load test)
- Security audit

**Phase 3: Production (Week 3)**
- Deploy to production during maintenance window
- Monitor for 48 hours
- Gradual traffic migration (if using multiple instances)
- Full cutover after validation

---

## 🔔 Alerts Configuration

### Critical Alerts

Set up alerts for:

1. **Service Down**
   ```
   Alert if: Health check fails for 2 consecutive minutes
   Action: Page on-call engineer
   ```

2. **High Error Rate**
   ```
   Alert if: Error rate > 5% for 5 minutes
   Action: Notify team
   ```

3. **Database Connection Lost**
   ```
   Alert if: Readiness check fails (database: disconnected)
   Action: Page DBA
   ```

4. **Payment Gateway Unreachable**
   ```
   Alert if: Readiness check fails (paymentGateway: unreachable)
   Action: Notify team
   ```

---

## 📚 Additional Resources

- **README**: Service overview and quick start
- **ARCHITECTURE_ANALYSIS**: Service boundaries and integration
- **API_DOCUMENTATION**: Complete API reference
- **Database Schema**: `database/schema.sql`
- **Environment Template**: `.env.example`

---

## 🎉 Deployment Complete!

After successful deployment:

1. ✅ Update service status in monitoring dashboard
2. ✅ Notify team of successful deployment
3. ✅ Document any issues encountered
4. ✅ Schedule post-deployment review (48 hours)
5. ✅ Update runbook with any new learnings

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** October 14, 2025  
**Status:** ✅ Production Ready

