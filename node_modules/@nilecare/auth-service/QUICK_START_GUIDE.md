# 🚀 Auth Service - Quick Start Guide

## Prerequisites Checklist

- [ ] MySQL 8.0 running on localhost:3306
- [ ] Node.js 18+ installed
- [ ] Redis 7+ installed (optional for development)

---

## 🎯 Step 1: Generate Secure Secrets (2 minutes)

Open terminal and run these commands:

```bash
# Navigate to auth service
cd microservices/auth-service

# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate MFA_ENCRYPTION_KEY
node -e "console.log('MFA_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Copy these outputs!** You'll need them in Step 3.

---

## 🗄️ Step 2: Set Up Database (3 minutes)

### Option A: Using MySQL Command Line

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Load schema
mysql -u root -p nilecare < create-mysql-tables.sql

# Verify tables created
mysql -u root -p nilecare -e "SHOW TABLES LIKE 'auth_%';"
```

Expected output: 7 tables

### Option B: Using XAMPP phpMyAdmin

1. Open http://localhost/phpmyadmin
2. Click "New" to create database
3. Name: `nilecare`
4. Collation: `utf8mb4_unicode_ci`
5. Click "SQL" tab
6. Copy-paste contents of `create-mysql-tables.sql`
7. Click "Go"

---

## ⚙️ Step 3: Configure Environment (3 minutes)

Create a `.env` file in `microservices/auth-service/`:

```bash
# Database Configuration (XAMPP defaults)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Paste the secrets you generated in Step 1
JWT_SECRET=<your-generated-secret-here>
JWT_REFRESH_SECRET=<your-generated-secret-here>
SESSION_SECRET=<your-generated-secret-here>
MFA_ENCRYPTION_KEY=<your-generated-secret-here>

# Redis (optional in development)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=7020
NODE_ENV=development
LOG_LEVEL=debug
CLIENT_URL=http://localhost:5173
```

**Save the file as `.env`**

---

## 📦 Step 4: Install Dependencies (2 minutes)

```bash
# In auth-service directory
npm install
```

Expected: ~300 packages installed

---

## 🚀 Step 5: Start the Service (1 minute)

```bash
npm run dev
```

### Expected Output (Success):

```
✅ Environment validation passed
🔍 Validating database schema...
✅ Database schema validation passed
✅ Database ready
✅ Redis connected successfully
🚀 Auth service running on port 7020
📚 API Documentation: http://localhost:7020/api-docs
💚 Health check: http://localhost:7020/health
🔐 Features: JWT, RBAC, MFA, OAuth2, OpenID Connect, Session Management
🗄️  Database: MySQL (nilecare)
📦 Redis: Connected
```

### Possible Errors:

**Error: "Missing critical env vars"**
```
❌ Missing required environment variables: JWT_SECRET, JWT_REFRESH_SECRET
💡 Copy ENV_TEMPLATE.md to .env and update all values
```
**Solution:** Check your .env file has all required variables

**Error: "JWT_SECRET must be at least 32 characters"**
```
Error: JWT_SECRET must be at least 32 characters long
```
**Solution:** Generate a longer secret using the command in Step 1

**Error: "Required table 'auth_users' does not exist"**
```
❌ Required table 'auth_users' does not exist.
Run: mysql -u root -p nilecare < create-mysql-tables.sql
```
**Solution:** Run the SQL migration as instructed

**Error: "Failed to connect to MySQL database"**
```
❌ Failed to connect to MySQL database: Error: connect ECONNREFUSED
```
**Solution:** Start MySQL/XAMPP

---

## ✅ Step 6: Verify Everything Works (5 minutes)

### Test 1: Health Check
```bash
curl http://localhost:7020/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2025-10-13T...",
  "features": {
    "jwt": true,
    "rbac": true,
    "mfa": true
  }
}
```

### Test 2: Readiness Check
```bash
curl http://localhost:7020/health/ready
```

Expected response:
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "redis": true,
    "overall": true
  }
}
```

### Test 3: Register a User
```bash
curl -X POST http://localhost:7020/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@nilecare.sd",
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@nilecare.sd",
    "username": "testuser",
    "role": "patient"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 4: Login
```bash
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@nilecare.sd",
    "password": "Test123!@#"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@nilecare.sd",
    "username": "testuser",
    "role": "patient"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test 5: Get Current User
```bash
# Replace <TOKEN> with the accessToken from login response
curl http://localhost:7020/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "test@nilecare.sd",
    "username": "testuser",
    "role": "patient",
    "mfaEnabled": false,
    "emailVerified": false
  }
}
```

### Test 6: Check Logs

```bash
# Check combined logs
tail -f logs/combined.log

# Check error logs
tail -f logs/error.log
```

Look for:
- ✅ "User registered successfully"
- ✅ "User logged in successfully"
- ✅ No error messages

---

## 🐛 Troubleshooting

### Service Won't Start

**Check Node.js version:**
```bash
node --version
# Should be v18.0.0 or higher
```

**Check npm dependencies:**
```bash
npm list --depth=0
# Should show ~50 packages
```

**Check logs:**
```bash
cat logs/error.log
```

### Database Connection Issues

**Test MySQL connection:**
```bash
mysql -u root -p -h localhost
```

**Check if database exists:**
```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare';"
```

**Check if tables exist:**
```bash
mysql -u root -p nilecare -e "SHOW TABLES LIKE 'auth_%';"
```

**Check MySQL is running:**
```bash
# Windows (XAMPP)
netstat -an | findstr :3306

# Linux/Mac
netstat -an | grep 3306
```

### Redis Issues (Optional)

**Redis not installed?**
```bash
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine

# Linux/Mac:
brew install redis  # Mac
sudo apt-get install redis  # Linux
```

**Service works without Redis in development!**  
Redis is only required in production.

### API Test Failures

**401 Unauthorized:**
- Token might be expired (15 min expiry)
- Token might be invalid
- Try logging in again

**400 Bad Request:**
- Check request body format
- Ensure Content-Type: application/json header
- Validate password meets requirements (8+ chars, uppercase, lowercase, number, special)

**500 Internal Server Error:**
- Check logs: `tail -f logs/error.log`
- Database connection might be lost
- Check environment variables

---

## 🎉 Success Checklist

After following this guide, you should have:

- [x] Service starts without errors
- [x] Health checks return 200 OK
- [x] Database schema validated
- [x] Can register new users
- [x] Can login with correct credentials
- [x] JWT tokens are generated
- [x] Refresh token rotation works
- [x] Rate limiting is active
- [x] Logs are being written

---

## 📚 Next Steps

### For Developers
1. Read `AUTH_SERVICE_PRODUCTION_READINESS_AUDIT.md` for full audit results
2. Check `ENV_TEMPLATE.md` for all configuration options
3. Explore API at http://localhost:7020/api-docs

### For Integration
1. Use `POST /api/v1/auth/login` to authenticate
2. Include JWT in `Authorization: Bearer <token>` header
3. Tokens expire in 15 minutes - use refresh token endpoint

### For Testing
1. Create test users with different roles
2. Test permission-based access
3. Enable MFA for your account
4. Test password reset flow

---

## 🆘 Getting Help

**View Logs:**
```bash
# Combined logs
cat logs/combined.log

# Error logs only
cat logs/error.log

# Watch logs in real-time
tail -f logs/combined.log
```

**Check Service Status:**
```bash
# Health
curl -v http://localhost:7020/health

# Readiness
curl -v http://localhost:7020/health/ready

# Metrics
curl http://localhost:7020/metrics
```

**Database Verification:**
```bash
# Count users
mysql -u root -p nilecare -e "SELECT COUNT(*) FROM auth_users;"

# List roles
mysql -u root -p nilecare -e "SELECT name, permissions FROM auth_roles;"

# Check recent logins
mysql -u root -p nilecare -e "SELECT email, last_login FROM auth_users ORDER BY last_login DESC LIMIT 5;"
```

---

## 🎯 You're All Set!

Your Auth Service is now:
- ✅ Secure (SQL injection fixed, no hardcoded secrets)
- ✅ Validated (environment and schema checks)
- ✅ MySQL ready (all services converted)
- ✅ Production configured (docker-compose updated)

**Time to complete:** ~15 minutes  
**Current status:** ✅ **READY FOR DEVELOPMENT**

---

**Questions?** Check the full audit report: `AUTH_SERVICE_PRODUCTION_READINESS_AUDIT.md`

**Ready for Production?** Complete Phase 2 recommendations in the audit report.

---

*NileCare Authentication Service - Secured and Validated* ✅

