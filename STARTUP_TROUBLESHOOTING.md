# 🔧 Startup Troubleshooting Guide

**Issue:** Services aren't responding / localhost refused to connect

---

## 🎯 Quick Fix - Most Common Issues

### Issue 1: MySQL Not Running

**Check if MySQL is running:**
```powershell
# For XAMPP users
Get-Process | Where-Object {$_.Name -like "*mysql*"}

# Or check XAMPP Control Panel
# Start → XAMPP Control Panel → Start MySQL
```

**Fix:** Start MySQL from XAMPP Control Panel

---

### Issue 2: Database Tables Don't Exist

The Auth Service requires specific tables. Create them:

```powershell
# Navigate to auth service
cd microservices\auth-service

# Create tables using MySQL command line
# Option 1: If MySQL is in PATH
mysql -u root -p nilecare < create-mysql-tables.sql

# Option 2: Using XAMPP MySQL
C:\xampp\mysql\bin\mysql.exe -u root nilecare < create-mysql-tables.sql

# Option 3: Using phpMyAdmin
# 1. Open http://localhost/phpmyadmin
# 2. Select 'nilecare' database (or create it if missing)
# 3. Go to SQL tab
# 4. Copy contents of create-mysql-tables.sql
# 5. Execute
```

**If database doesn't exist:**
```sql
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Issue 3: Dependencies Not Installed

```powershell
# Install dependencies for each service
cd microservices\auth-service
npm install

cd ..\appointment-service
npm install

cd ..\business
npm install

cd ..\payment-gateway-service
npm install

cd ..\main-nilecare
npm install

# Install shared modules
cd ..\..\shared
npm install
npm run build
```

---

### Issue 4: Database Connection Issues

**Check database configuration in `.env`:**

```powershell
# View current config
Get-Content microservices\auth-service\.env | Select-String "DB_"

# Should show:
# DB_HOST=localhost
# DB_NAME=nilecare
# DB_USER=root
# DB_PASSWORD=
```

**Test database connection manually:**
```powershell
# Using XAMPP MySQL
C:\xampp\mysql\bin\mysql.exe -u root -e "SHOW DATABASES;"

# Should list 'nilecare' database
```

---

## 🚀 Step-by-Step Startup Process

### Step 1: Ensure MySQL is Running

```powershell
# Start XAMPP Control Panel
# Click "Start" next to MySQL
# Wait for it to show "Running" (green highlight)
```

### Step 2: Create/Verify Database

```powershell
# Open MySQL command line (XAMPP Shell or MySQL Workbench)
mysql -u root

# In MySQL:
CREATE DATABASE IF NOT EXISTS nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nilecare;
SHOW TABLES;
# Should show auth_users, auth_refresh_tokens, etc.
# If no tables, run: source C:/Users/pc/OneDrive/Desktop/NileCare/microservices/auth-service/create-mysql-tables.sql
exit;
```

### Step 3: Install All Dependencies

```powershell
# From NileCare root directory
cd C:\Users\pc\OneDrive\Desktop\NileCare

# Install shared modules first
cd shared
npm install
npm run build

# Install auth service
cd ..\microservices\auth-service
npm install

# Install other services
cd ..\appointment-service
npm install

cd ..\business
npm install

cd ..\main-nilecare
npm install

cd ..\payment-gateway-service
npm install
```

### Step 4: Start Services Manually (One by One)

```powershell
# Terminal 1: Auth Service
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\auth-service
npm run dev
# Wait for: "🚀 Auth service running on port 7020"

# Terminal 2: Business Service
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\business
npm run dev

# Terminal 3: Appointment Service  
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\appointment-service
npm run dev

# Terminal 4: Main NileCare
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\main-nilecare
npm run dev

# Terminal 5: Payment Gateway
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\payment-gateway-service
npm run dev
```

### Step 5: Verify Each Service

```powershell
# Test each service health endpoint
Invoke-WebRequest http://localhost:7020/health  # Auth
Invoke-WebRequest http://localhost:7010/health  # Business
Invoke-WebRequest http://localhost:7040/health  # Appointment
Invoke-WebRequest http://localhost:7000/health  # Main
Invoke-WebRequest http://localhost:7030/health  # Payment
```

---

## 🔍 Debugging Specific Services

### Auth Service Debug

```powershell
cd microservices\auth-service

# Check if .env exists
Test-Path .env

# Verify critical environment variables
Get-Content .env | Select-String "SERVICE_API_KEYS"

# Try starting with verbose logging
$env:LOG_LEVEL="debug"
npm run dev
```

### Business Service Debug

```powershell
cd microservices\business

# Check configuration
Get-Content .env | Select-String "AUTH_SERVICE"

# Start service
npm run dev
```

---

## 📊 Service Status Check

Run this to see which services are actually running:

```powershell
Write-Host "`nChecking service status...`n" -ForegroundColor Cyan

$ports = @(7020, 7000, 7010, 7040, 7030)
$names = @("Auth", "Main", "Business", "Appointment", "Payment")

for ($i = 0; $i -lt $ports.Length; $i++) {
    $port = $ports[$i]
    $name = $names[$i]
    
    try {
        $response = Invoke-WebRequest "http://localhost:$port/health" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ $name Service (port $port): RUNNING" -ForegroundColor Green
    } catch {
        Write-Host "✗ $name Service (port $port): NOT RUNNING" -ForegroundColor Red
    }
}
```

---

## 🐛 Common Error Messages

### "Missing required environment variables"
**Solution:** Check `.env` file exists and has all required variables

### "Database schema validation failed"
**Solution:** Run `create-mysql-tables.sql` to create tables

### "ECONNREFUSED"
**Solution:** MySQL isn't running - start it in XAMPP

### "JWT_SECRET must be at least 32 characters"
**Solution:** The JWT_SECRET in .env is too short - use the provided one

### "contains default value"
**Solution:** This is OK for development, ignore this check

---

## ✅ Success Checklist

- [ ] MySQL is running (check XAMPP Control Panel)
- [ ] Database 'nilecare' exists
- [ ] Auth tables exist (auth_users, auth_refresh_tokens, etc.)
- [ ] `.env` files exist for all services
- [ ] SERVICE_API_KEYS configured in auth-service/.env
- [ ] AUTH_SERVICE_URL configured in other services
- [ ] AUTH_SERVICE_API_KEY configured in other services
- [ ] node_modules installed in all services
- [ ] shared module built (`cd shared && npm run build`)

---

## 🆘 Still Having Issues?

### Get Detailed Logs

Start each service manually to see error messages:

```powershell
# Auth Service
cd microservices\auth-service
npm run dev
# Read error messages in console
```

### Check Database Connection

```powershell
# Test MySQL connection
C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT VERSION();"

# Should show MySQL version
```

### Verify .env Files

```powershell
# Check all .env files exist
Get-ChildItem -Recurse -Filter ".env" | Select-Object FullName
```

---

**Next:** Fix the issues above, then try starting services one at a time

