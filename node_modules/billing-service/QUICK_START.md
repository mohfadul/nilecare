# ⚡ Billing Service - Quick Start Guide

**Get the service running in 10 minutes**

---

## 🚀 Quick Start (10 minutes)

### 1. Install Dependencies (2 min)

```bash
cd microservices/billing-service
npm install
```

### 2. Configure Environment (3 min)

Create `.env` file:

```env
NODE_ENV=development
PORT=5003

# Database (shared 'nilecare')
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Auth Service (MUST BE RUNNING!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your-key-here

# Payment Gateway (MUST BE RUNNING!)
PAYMENT_GATEWAY_URL=http://localhost:7030
PAYMENT_GATEWAY_API_KEY=your-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

**Generate API keys:**
```bash
# Generate Auth Service key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Payment Gateway key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Register keys:**
- Add billing service key to `auth-service/.env` → `SERVICE_API_KEYS`
- Add billing service key to `payment-gateway/.env` if needed

### 3. Setup Database (2 min)

```bash
# Load schema
mysql -u root -p nilecare < database/schema.sql

# Verify tables
mysql -u root -p nilecare -e "SHOW TABLES LIKE '%invoice%';"
```

### 4. Start Service (1 min)

```bash
npm run dev
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
✅  BILLING SERVICE STARTED SUCCESSFULLY
═══════════════════════════════════════════════════════════
📡  Service URL:       http://localhost:5003
🏥  Health Check:      http://localhost:5003/health
```

### 5. Test Service (2 min)

```bash
# Health check
curl http://localhost:5003/health

# Get auth token
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"TestPass123!"}' \
  | jq -r '.data.accessToken')

# Create test invoice
curl -X POST http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "test-uuid",
    "facilityId": "test-uuid",
    "invoiceType": "consultation",
    "invoiceDate": "2025-10-14",
    "dueDate": "2025-11-14",
    "lineItems": [{
      "itemType": "consultation",
      "itemName": "Test Consultation",
      "quantity": 1,
      "unitPrice": 100.00
    }]
  }'
```

---

## ✅ Prerequisites

**Required Services:**
- ✅ Auth Service (port 7020) - MUST be running
- ✅ Payment Gateway (port 7030) - MUST be running
- ✅ MySQL (port 3306) - MUST have `nilecare` database

**Check services:**
```bash
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7030/health  # Payment Gateway
mysql -u root -p nilecare -e "SELECT 1;"  # Database
```

---

## 🐛 Troubleshooting

### Service won't start

**Error:** `Missing required environment variables`
```bash
# Solution: Configure .env file
cp .env.example .env
# Edit with your values
```

**Error:** `Database connection failed`
```bash
# Solution: Check MySQL is running
mysql -u root -p nilecare -e "SELECT 1;"

# Load schema if tables missing
mysql -u root -p nilecare < database/schema.sql
```

**Error:** `AUTH_SERVICE_URL not configured`
```bash
# Solution: Add to .env
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<your-key>
```

### Authentication fails

**Error:** `401 Unauthorized`
```bash
# Solution 1: Verify Auth Service is running
curl http://localhost:7020/health

# Solution 2: Verify API key is registered
# Check auth-service/.env has your key in SERVICE_API_KEYS

# Solution 3: Restart Auth Service
cd microservices/auth-service
npm run dev
```

### Payment Gateway queries fail

**Error:** `Payment Gateway request failed`
```bash
# Solution 1: Verify Payment Gateway is running
curl http://localhost:7030/health

# Solution 2: Test direct query
curl -X GET http://localhost:7030/api/v1/payments \
  -H "X-Service-Key: $PAYMENT_GATEWAY_API_KEY"
```

---

## 📚 Next Steps

After service is running:

1. **Read Full Documentation:**
   - `README.md` - Complete overview
   - `API_DOCUMENTATION.md` - API reference
   - `DEPLOYMENT_GUIDE.md` - Production deployment

2. **Test Features:**
   - Create invoices
   - Create claims
   - Query payment status
   - Check audit logs

3. **Deploy:**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Deploy to staging first
   - Run integration tests
   - Deploy to production

---

## 🎯 Essential Endpoints

### Health Check
```bash
curl http://localhost:5003/health
```

### Create Invoice
```bash
curl -X POST http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"patientId":"uuid","facilityId":"uuid",...}'
```

### List Invoices
```bash
curl -X GET http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN"
```

### Sync Payment Status
```bash
curl -X POST http://localhost:5003/api/v1/invoices/{id}/sync-payment \
  -H "Authorization: Bearer $TOKEN"
```

---

**Quick Start Complete!** 🎉

For detailed information, see:
- `README.md` - Full documentation
- `API_DOCUMENTATION.md` - API reference
- `DEPLOYMENT_GUIDE.md` - Production deployment

