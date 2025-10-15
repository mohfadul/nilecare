# 🚀 Quick Setup Guide - Authentication Integration

**Time Required:** 10 minutes  
**Difficulty:** Easy

---

## ✅ Configuration Complete!

I've generated secure API keys for all services. Here's how to set them up:

### Step 1: Generated API Keys

```
appointment-service:  29188e760a4166559cf35f8f60df08fdec190055397bace0e776ec803821230f
business-service:     93287584b9eba43a4e231750d63342723dd09b97a6fcad5bfbe364516e2971ec
payment-service:      913f40c10a524e0bc8afb2edf663c4e2c84e3b74ebe12469ce64c9e233df706a
main-service:         4b2f0c60f3f99d6aa50542eee14dc94c50a552ee5baf148e7978453a5380bc16
clinical-service:     008bcfc9aba6f9b957ec54ba421bf2f1546f314155bbf82eb4fb092bbb3d4e4e
```

---

## Step 2: Create .env Files

### Auth Service (.env)

Create `microservices/auth-service/.env`:

```env
NODE_ENV=development
PORT=7020

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

JWT_SECRET=nilecare-jwt-secret-change-in-production-min-32-characters-required
JWT_REFRESH_SECRET=nilecare-refresh-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

SESSION_SECRET=nilecare-session-secret-change-in-production-min-32-chars
MFA_ENCRYPTION_KEY=nilecare-mfa-encryption-key-change-in-production-64-chars

SERVICE_API_KEYS=29188e760a4166559cf35f8f60df08fdec190055397bace0e776ec803821230f,93287584b9eba43a4e231750d63342723dd09b97a6fcad5bfbe364516e2971ec,913f40c10a524e0bc8afb2edf663c4e2c84e3b74ebe12469ce64c9e233df706a,4b2f0c60f3f99d6aa50542eee14dc94c50a552ee5baf148e7978453a5380bc16,008bcfc9aba6f9b957ec54ba421bf2f1546f314155bbf82eb4fb092bbb3d4e4e

REDIS_HOST=localhost
REDIS_PORT=6379
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
```

### Appointment Service (.env)

Create `microservices/appointment-service/.env`:

```env
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=29188e760a4166559cf35f8f60df08fdec190055397bace0e776ec803821230f

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379

LOG_LEVEL=info
LOG_AUTH=true
```

### Business Service (.env)

Create `microservices/business/.env`:

```env
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=93287584b9eba43a4e231750d63342723dd09b97a6fcad5bfbe364516e2971ec

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
```

### Payment Gateway Service (.env)

Create `microservices/payment-gateway-service/.env`:

```env
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=913f40c10a524e0bc8afb2edf663c4e2c84e3b74ebe12469ce64c9e233df706a

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

LOG_LEVEL=info
LOG_AUTH=true
```

### Main NileCare Service (.env)

Create `microservices/main-nilecare/.env`:

```env
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare-service

AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=4b2f0c60f3f99d6aa50542eee14dc94c50a552ee5baf148e7978453a5380bc16

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
```

---

## Step 3: Start Services

**Terminal 1 - Auth Service (START THIS FIRST!):**
```powershell
cd microservices\auth-service
npm run dev
```

**Terminal 2 - Appointment Service:**
```powershell
cd microservices\appointment-service
npm run dev
```

**Terminal 3 - Business Service:**
```powershell
cd microservices\business
npm run dev
```

**Terminal 4 - Payment Gateway:**
```powershell
cd microservices\payment-gateway-service
npm run dev
```

**Terminal 5 - Main NileCare:**
```powershell
cd microservices\main-nilecare
npm run dev
```

---

## Step 4: Verify Setup

### Check Auth Service:
```powershell
Invoke-WebRequest http://localhost:7020/health
```

### Check Integration Endpoint:
```powershell
Invoke-WebRequest http://localhost:7020/api/v1/integration/health
```

### Login Test:
```powershell
Invoke-WebRequest -Uri http://localhost:7020/api/v1/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"doctor@nilecare.sd","password":"TestPass123!"}'
```

---

## ✅ Success Indicators

When everything is working:

- ✅ Auth Service responds to `/health`
- ✅ Integration endpoint responds to `/api/v1/integration/health`
- ✅ Login returns a JWT token
- ✅ Services log authentication attempts
- ✅ No "Cannot connect to Auth Service" errors

---

## 📚 Next Steps

1. **Read the integration guide**: `AUTHENTICATION_INTEGRATION_GUIDE.md`
2. **Review the architecture**: `AUTHENTICATION_INTEGRATION_SUMMARY.md`
3. **Run automated tests**: See `TEST_AUTH_INTEGRATION.sh` (for bash)

---

## 🐛 Troubleshooting

### "Cannot connect to Auth Service"
- Make sure Auth Service is running first
- Check AUTH_SERVICE_URL in service .env files

### "Invalid service credentials"
- Verify API keys match in both files
- Restart Auth Service after changing SERVICE_API_KEYS

### Service won't start
- Check .env file syntax (no spaces around = signs)
- Ensure all required variables are set
- Check for typos in variable names

---

## 🔒 Security Notes

⚠️ **These are DEVELOPMENT keys only!**

For production:
1. Generate new keys with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Use HTTPS for AUTH_SERVICE_URL
3. Store keys in a secrets manager (not in .env files)
4. Rotate keys quarterly

---

**Configuration Status:** ✅ COMPLETE  
**Ready to Start:** ✅ YES  
**Documentation:** ✅ COMPREHENSIVE

🎉 **You're all set!** Start the Auth Service first, then the other services.

