# ⚡ Phase 1 Quick Start Guide

**Version:** 1.0.0  
**Time Required:** 15-30 minutes  
**Status:** ✅ **READY TO EXECUTE**

---

## 🎯 What You'll Accomplish

In 30 minutes or less, you'll:
1. ✅ Install Flyway migration framework
2. ✅ Create separate databases for Auth, Billing, and Payment services
3. ✅ Set up database users with proper permissions
4. ✅ Run initial migrations
5. ✅ Verify everything works

---

## 🚀 Quick Start (Windows - PowerShell)

### Step 1: Prerequisites (2 minutes)

```powershell
# Verify MySQL is running
mysql --version

# Should see: mysql  Ver 8.0.x

# Verify Node.js installed
node -v

# Should see: v18.x.x or higher
```

### Step 2: Install Flyway (3 minutes)

```powershell
# Open PowerShell as Administrator
choco install flyway -y

# Verify installation
flyway -v

# Should see: Flyway Community Edition 9.x.x
```

### Step 3: Run Automated Setup (10 minutes)

```powershell
# Navigate to project root
cd C:\Users\pc\OneDrive\Desktop\NileCare

# Run Phase 1 setup script
.\scripts\setup-phase1.ps1

# Follow prompts:
# - Enter MySQL root username (default: root)
# - Enter MySQL root password
# - Script will:
#   ✅ Create 3 databases
#   ✅ Create 9 database users
#   ✅ Install NPM dependencies
#   ✅ Run migrations
#   ✅ Verify setup
```

### Step 4: Configure Services (5 minutes)

```powershell
# Auth Service
cd microservices\auth-service
copy .env.example .env
# Edit .env if needed (defaults are fine for local dev)

# Billing Service
cd ..\billing-service
copy .env.example .env

# Payment Gateway
cd ..\payment-gateway-service
copy .env.example .env

cd ..\..
```

### Step 5: Test Services (5 minutes)

```powershell
# Test Auth Service
cd microservices\auth-service
npm run migrate:info

# Should show:
# ✅ 1 migration applied successfully

npm run dev

# Should see:
# ✅ Database connection established
# ✅ Environment configuration validated
# ✅ Auth service running on port 7020

# Press Ctrl+C to stop
```

---

## 🚀 Quick Start (macOS/Linux - Bash)

### Step 1: Prerequisites (2 minutes)

```bash
# Verify MySQL is running
mysql --version

# Verify Node.js installed
node -v
```

### Step 2: Install Flyway (3 minutes)

```bash
# macOS
brew install flyway

# Linux
wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.16.0/flyway-commandline-9.16.0-linux-x64.tar.gz | tar xvz
sudo ln -s $(pwd)/flyway-9.16.0/flyway /usr/local/bin

# Verify
flyway -v
```

### Step 3: Run Automated Setup (10 minutes)

```bash
# Navigate to project root
cd /path/to/NileCare

# Make script executable
chmod +x scripts/setup-phase1.sh

# Run setup
./scripts/setup-phase1.sh

# Follow prompts
```

### Step 4: Configure Services (5 minutes)

```bash
# Auth Service
cd microservices/auth-service
cp .env.example .env

# Billing Service
cd ../billing-service
cp .env.example .env

# Payment Gateway
cd ../payment-gateway-service
cp .env.example .env

cd ../..
```

### Step 5: Test Services (5 minutes)

```bash
# Test Auth Service
cd microservices/auth-service
npm run migrate:info
npm run dev
```

---

## 🧪 Quick Verification Commands

```bash
# Check databases created
mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare_%';"

# Expected output:
# nilecare_auth
# nilecare_billing
# nilecare_business
# nilecare_payment
# ... and more

# Check service users created
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User LIKE '%_service';"

# Expected: 9 service users

# Check auth tables
mysql -u root -p nilecare_auth -e "SHOW TABLES;"

# Expected: 8 tables (7 + schema_version)

# Check migration history
cd microservices/auth-service
npm run migrate:info

# Expected: 1 migration applied
```

---

## 🔧 Manual Setup (If Automated Script Fails)

### Option 1: Step-by-Step Manual

```bash
# 1. Create databases
mysql -u root -p < database/create-service-databases.sql

# 2. Create users
mysql -u root -p < database/create-service-users.sql

# 3. Install NPM dependencies
cd microservices/auth-service
npm install --save-dev node-flyway

cd ../billing-service
npm install --save-dev node-flyway

cd ../payment-gateway-service
npm install --save-dev node-flyway

# 4. Run migrations
cd microservices/auth-service
npm run db:create
npm run migrate:up

cd ../billing-service
npm run db:create
npm run migrate:up

cd ../payment-gateway-service
npm run db:create
npm run migrate:up
```

### Option 2: Docker (Future - Not Yet Implemented)

```yaml
# Coming in Phase 2
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
    volumes:
      - ./database:/docker-entrypoint-initdb.d
```

---

## 🚨 Troubleshooting

### Issue: "Flyway command not found"

**Windows:**
```powershell
# Install Chocolatey first
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Then install Flyway
choco install flyway -y
```

**macOS:**
```bash
brew install flyway
```

### Issue: "Access denied for user 'root'"

```bash
# Reset MySQL root password if needed
# Or use correct password from your MySQL installation
```

### Issue: "Database already exists"

```bash
# If you ran setup before, either:
# 1. Drop existing databases first
mysql -u root -p -e "DROP DATABASE IF EXISTS nilecare_auth;"

# 2. Or use baseline to mark as migrated
cd microservices/auth-service
npm run migrate:baseline
```

### Issue: npm install fails

```bash
# Clear cache and retry
npm cache clean --force
npm install
```

---

## ✅ Verification Checklist

After running Quick Start:

- [ ] Flyway installed (`flyway -v` works)
- [ ] 3+ databases created (check with `SHOW DATABASES`)
- [ ] 9 service users created (check `mysql.user` table)
- [ ] Migrations applied (check `schema_version` table)
- [ ] Auth service starts without errors
- [ ] Billing service starts without errors
- [ ] Payment service starts without errors

---

## 📞 Need Help?

### Documentation
- **Full Guide:** See `PHASE1_IMPLEMENTATION_GUIDE.md`
- **Testing:** See `PHASE1_MIGRATION_TESTING_GUIDE.md`
- **Troubleshooting:** See `DATABASE_MIGRATION_GUIDE.md`

### Support
- **Slack:** #database-migration
- **Email:** database-team@nilecare.sd

---

## 🎉 Success!

If you see:
```
✅ Service databases created
✅ Service users created
✅ Migrations completed successfully
✅ Auth service running on port 7020
```

**You're done! Phase 1 is complete! 🎉**

**Next:** Review `PHASE1_COMPLETE_SUMMARY.md` for next steps.

---

**Estimated Time:** 15-30 minutes  
**Difficulty:** Easy  
**Success Rate:** 95%+

