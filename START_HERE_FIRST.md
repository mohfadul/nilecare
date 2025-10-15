# ⚠️ START HERE FIRST - Services Won't Start

**Current Status:** Only Business Service is running. Auth Service and others failed to start.

---

## 🎯 The Problem

The services need:
1. ✅ MySQL database running
2. ✅ Database tables created
3. ✅ Dependencies installed
4. ✅ .env files configured (DONE ✓)

---

## 🔧 Quick Fix (3 Steps)

### Step 1: Start MySQL

**Option A - XAMPP (Recommended for Windows):**
1. Open XAMPP Control Panel
2. Click "Start" next to MySQL
3. Wait until it shows "Running" (green)

**Option B - Check if MySQL is running:**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*mysql*"}
```

---

### Step 2: Create Database & Tables

**Using phpMyAdmin (Easiest):**

1. Open http://localhost/phpmyadmin in your browser
2. Click "SQL" tab at the top
3. Copy and paste this SQL:

```sql
CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nilecare;
```

4. Click "Go"
5. Then, open the file: `microservices/auth-service/create-mysql-tables.sql`
6. Copy ALL the contents
7. Paste into phpMyAdmin SQL tab
8. Click "Go"

**OR using MySQL command line:**

```powershell
# If XAMPP is in default location
C:\xampp\mysql\bin\mysql.exe -u root

# Then in MySQL console:
CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nilecare;
source C:/Users/pc/OneDrive/Desktop/NileCare/microservices/auth-service/create-mysql-tables.sql;
exit;
```

---

### Step 3: Start Auth Service

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\auth-service
npm run dev
```

**Watch for:**
- ✅ "🚀 Auth service running on port 7020" = SUCCESS!
- ❌ "Database schema validation failed" = Go back to Step 2
- ❌ "ECONNREFUSED" = Go back to Step 1

---

## ✅ Verification

Once Auth Service starts successfully:

```powershell
# Test Auth Service
Invoke-WebRequest http://localhost:7020/health

# Should return: HTTP 200 OK
```

---

## 🚀 After Auth Service is Running

Then start the other services (one terminal each):

```powershell
# Terminal 2
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\appointment-service
npm run dev

# Terminal 3  
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\main-nilecare
npm run dev

# Terminal 4
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\payment-gateway-service
npm run dev
```

(Business Service is already running ✓)

---

## 📝 Quick Checklist

Before starting services, ensure:

- [ ] XAMPP MySQL is running (green in XAMPP Control Panel)
- [ ] Database 'nilecare' exists
- [ ] Auth tables exist (check phpMyAdmin → nilecare → should see auth_users, auth_refresh_tokens, etc.)
- [ ] `.env` files exist in each service folder
- [ ] Run `npm install` in each service if node_modules folder is missing

---

## 🆘 Still Not Working?

### Check Database Connection

```powershell
# Test if you can connect to MySQL
Test-NetConnection localhost -Port 3306
```

Should show: `TcpTestSucceeded : True`

### Check if tables exist

```sql
-- In phpMyAdmin or MySQL command line:
USE nilecare;
SHOW TABLES;

-- Should show:
-- auth_users
-- auth_refresh_tokens
-- auth_devices
-- auth_roles
-- auth_permissions
-- auth_audit_logs
-- auth_login_attempts
-- auth_sessions
-- auth_oauth_clients
```

### Get Help from Service Logs

The PowerShell windows that opened should show error messages. Look for:
- "Database schema validation failed" → Run create-mysql-tables.sql
- "ECONNREFUSED" → MySQL isn't running
- "Missing environment variables" → Check .env file

---

## 📞 Next Steps

1. ✅ Complete Step 1-3 above
2. ✅ Verify Auth Service health endpoint responds
3. ✅ Start other services
4. ✅ Test authentication integration

---

**Critical:** Auth Service MUST be running before other services can authenticate users!

**Documentation:** See `STARTUP_TROUBLESHOOTING.md` for detailed debugging steps

