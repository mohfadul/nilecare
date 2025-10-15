# 🚀 NileCare Quick Start Guide

**Last Updated:** October 15, 2025  
**Version:** 2.0.0

Get NileCare up and running in **15 minutes**!

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/nilecare.git
cd nilecare

# Install shared dependencies
cd shared && npm install && npm run build && cd ..

# Install all microservices
cd microservices/auth-service && npm install && cd ../..
cd microservices/main-nilecare && npm install && cd ../..
cd microservices/business && npm install && cd ../..
cd microservices/appointment-service && npm install && cd ../..
cd microservices/payment-gateway-service && npm install && cd ../..

# Install frontend
cd clients/web-dashboard && npm install && cd ../..
```

### Step 2: Setup Databases

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schemas
mysql -u root -p nilecare < database/mysql/schema/identity_management.sql
mysql -u root -p nilecare < database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < database/mysql/schema/payment_system.sql
mysql -u root -p nilecare < database/mysql/schema/appointment_service.sql

# Seed sample data (optional)
mysql -u root -p nilecare < database/SEED_DATABASE.sql

# Create PostgreSQL database (for auth service)
psql -U postgres
CREATE DATABASE nilecare;
\q

# Import PostgreSQL schema
psql -U postgres -d nilecare < database/postgresql/schema/healthcare_analytics.sql
```

### Step 3: Configure Environment Variables

#### Auth Service (Port 7020) - **MUST START FIRST!**

Create `microservices/auth-service/.env`:

```env
NODE_ENV=development
PORT=7020

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT Secrets (ONLY in Auth Service!)
JWT_SECRET=nilecare-jwt-secret-change-in-production-min-32-characters-required
JWT_REFRESH_SECRET=nilecare-refresh-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=nilecare-session-secret-change-in-production-min-32-chars
MFA_ENCRYPTION_KEY=nilecare-mfa-encryption-key-change-in-production-64-chars

# Service API Keys (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SERVICE_API_KEYS=key1,key2,key3,key4,key5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
LOG_AUTH=true
```

#### Main NileCare Service (Port 7000)

Create `microservices/main-nilecare/.env`:

```env
NODE_ENV=development
PORT=7000

# MySQL Database
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

# CORS
CORS_ORIGIN=http://localhost:5173

LOG_LEVEL=info
```

#### Business Service (Port 7010)

Create `microservices/business/.env`:

```env
NODE_ENV=development
PORT=7010

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generate-64-char-hex-key>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173

LOG_LEVEL=info
```

#### Appointment Service (Port 7040)

Create `microservices/appointment-service/.env`:

```env
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Auth Service Integration (NO JWT_SECRET here!)
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generate-64-char-hex-key>

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:7001

LOG_LEVEL=info
LOG_AUTH=true
```

#### Payment Gateway Service (Port 7030)

Create `microservices/payment-gateway-service/.env`:

```env
NODE_ENV=development
PORT=7030

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generate-64-char-hex-key>

# Payment Providers (Sudan)
STRIPE_API_KEY=sk_test_your_key
PAYPAL_CLIENT_ID=your_client_id
FLUTTERWAVE_PUBLIC_KEY=your_public_key

LOG_LEVEL=info
```

#### Web Dashboard

Create `clients/web-dashboard/.env`:

```env
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020
VITE_PAYMENT_SERVICE_URL=http://localhost:7030
VITE_APPOINTMENT_SERVICE_URL=http://localhost:7040
```

> **💡 Tip:** See `QUICK_SETUP_GUIDE.md` for pre-generated API keys

### Step 4: Start Services

**IMPORTANT:** Auth Service must start first!

```bash
# Terminal 1 - Auth Service (MUST START FIRST!)
cd microservices/auth-service
npm run dev

# Wait for "Auth Service running on port 7020" message

# Terminal 2 - Main NileCare
cd microservices/main-nilecare
npm run dev

# Terminal 3 - Business Service
cd microservices/business
npm run dev

# Terminal 4 - Appointment Service
cd microservices/appointment-service
npm run dev

# Terminal 5 - Payment Gateway (optional)
cd microservices/payment-gateway-service
npm run dev

# Terminal 6 - Web Dashboard
cd clients/web-dashboard
npm run dev
```

### Step 5: Verify Installation

Open your browser and visit:

- **Web Dashboard:** http://localhost:5173
- **Auth Service:** http://localhost:7020/health
- **Main Service:** http://localhost:7000/health
- **Business Service:** http://localhost:7010/health
- **Appointment Service:** http://localhost:7040/health

---

## 👤 Default Login Credentials

```
Doctor:
  Email: doctor@nilecare.sd
  Password: TestPass123!

Admin:
  Email: admin@nilecare.sd
  Password: TestPass123!

Nurse:
  Email: nurse@nilecare.sd
  Password: TestPass123!
```

---

## 🐳 Docker Quick Start (Alternative)

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ✅ Health Check

Verify all services are running:

```bash
# Quick health check script
curl http://localhost:7020/health  # Auth Service
curl http://localhost:7000/health  # Main NileCare
curl http://localhost:7010/health  # Business Service
curl http://localhost:7040/health  # Appointment Service
curl http://localhost:7030/health  # Payment Gateway
```

All should return: `{"status": "healthy", "service": "...", "timestamp": "..."}`

---

## 🔧 Common Issues

### Port Already in Use
```bash
# Find and kill process using port 7020
lsof -ti:7020 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :7020   # Windows
```

### Database Connection Error
- Verify MySQL/PostgreSQL is running
- Check database credentials in `.env` files
- Ensure databases are created

### Auth Service Not Starting
- Check port 7020 is available
- Verify MySQL connection
- Check Redis is running: `redis-cli ping`

### Services Can't Connect to Auth Service
- Ensure Auth Service is running first
- Verify `AUTH_SERVICE_URL=http://localhost:7020` in other services
- Check API keys match between services

---

## 📚 Next Steps

- 📖 Read the full [README.md](./README.md) for detailed documentation
- 🔐 Review [AUTHENTICATION.md](./AUTHENTICATION.md) for auth architecture
- 🚀 Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- 🛠️ See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- 📊 Explore service-specific READMEs in `microservices/[service-name]/README.md`

---

## 🆘 Need Help?

- 📧 Email: support@nilecare.sd
- 🌐 Documentation: https://docs.nilecare.sd
- 💬 GitHub Issues: [Report an issue](https://github.com/your-org/nilecare/issues)

---

**Made with ❤️ for Sudan Healthcare**

