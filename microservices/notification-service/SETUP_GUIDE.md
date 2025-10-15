# 🔧 Notification Service - Setup Guide

**Version:** 1.0.0  
**Status:** Development  
**Last Updated:** October 15, 2025

---

## 📋 Prerequisites

Before setting up the Notification Service, ensure you have:

### Required Software

- ✅ Node.js >= 18.0.0
- ✅ npm >= 9.0.0 or yarn >= 1.22.0
- ✅ PostgreSQL >= 13 OR MySQL >= 8.0
- ✅ Redis >= 6.0
- ✅ TypeScript >= 5.0

### Required Accounts & Credentials

- ✅ SMTP server or SendGrid API key (for emails)
- ✅ Twilio account (for SMS)
- ✅ Firebase project (for push notifications)
- ✅ Auth Service running on port 7020
- ✅ Service API key from Auth Service

---

## 🚀 Quick Start (Once Implementation is Complete)

```bash
# 1. Navigate to service directory
cd microservices/notification-service

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env with your credentials
nano .env  # or use your preferred editor

# 5. Create database and schema
npm run db:setup

# 6. Build TypeScript
npm run build

# 7. Start in development mode
npm run dev
```

---

## 🔐 Environment Configuration

### Create .env File

Create a file named `.env` in the `microservices/notification-service/` directory with the following content:

```env
# ═══════════════════════════════════════════════════════════════
# Notification Service - Environment Configuration
# ═══════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────
# SERVICE CONFIGURATION
# ───────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3002
SERVICE_NAME=notification-service
SERVICE_VERSION=1.0.0

# ───────────────────────────────────────────────────────────────
# DATABASE CONFIGURATION (PostgreSQL or MySQL)
# ───────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare_notifications
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password_here
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL=false

# ───────────────────────────────────────────────────────────────
# REDIS CONFIGURATION (for Bull queues and caching)
# ───────────────────────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# ───────────────────────────────────────────────────────────────
# AUTHENTICATION (Centralized via Auth Service)
# ───────────────────────────────────────────────────────────────
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=your_service_api_key_here
# Generate secure key: openssl rand -base64 32

# ───────────────────────────────────────────────────────────────
# CORS & CLIENT CONFIGURATION
# ───────────────────────────────────────────────────────────────
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:7001

# ───────────────────────────────────────────────────────────────
# EMAIL CONFIGURATION (Nodemailer - SMTP)
# ───────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=NileCare Healthcare
SMTP_FROM_EMAIL=noreply@nilecare.com

# Alternative: SendGrid
# SENDGRID_API_KEY=your_sendgrid_api_key

# ───────────────────────────────────────────────────────────────
# SMS CONFIGURATION (Twilio)
# ───────────────────────────────────────────────────────────────
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=

# Alternative: Africa's Talking (for Sudan)
# AFRICASTALKING_API_KEY=your_api_key
# AFRICASTALKING_USERNAME=your_username

# ───────────────────────────────────────────────────────────────
# PUSH NOTIFICATION CONFIGURATION
# ───────────────────────────────────────────────────────────────

# Firebase Cloud Messaging (FCM)
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Apple Push Notification (APN)
APN_ENABLED=false
APN_KEY_ID=your_apn_key_id
APN_TEAM_ID=your_team_id
APN_BUNDLE_ID=com.nilecare.app
APN_PRODUCTION=false
APN_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8

# ───────────────────────────────────────────────────────────────
# WEBSOCKET CONFIGURATION
# ───────────────────────────────────────────────────────────────
WEBSOCKET_ENABLED=true
WEBSOCKET_PATH=/socket.io
WEBSOCKET_PING_TIMEOUT=5000
WEBSOCKET_PING_INTERVAL=25000

# ───────────────────────────────────────────────────────────────
# QUEUE CONFIGURATION (Bull)
# ───────────────────────────────────────────────────────────────
QUEUE_ENABLED=true
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRY_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=5000

# ───────────────────────────────────────────────────────────────
# NOTIFICATION LIMITS & THROTTLING
# ───────────────────────────────────────────────────────────────
MAX_NOTIFICATIONS_PER_USER_PER_HOUR=50
MAX_NOTIFICATIONS_PER_USER_PER_DAY=200
MAX_BULK_SEND_SIZE=1000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# ───────────────────────────────────────────────────────────────
# SCHEDULED NOTIFICATIONS (Cron)
# ───────────────────────────────────────────────────────────────
ENABLE_SCHEDULED_NOTIFICATIONS=true
SCHEDULED_NOTIFICATIONS_CRON=*/5 * * * *  # Every 5 minutes
RETRY_FAILED_NOTIFICATIONS_CRON=0 */6 * * *  # Every 6 hours
CLEANUP_OLD_NOTIFICATIONS_CRON=0 2 * * *  # Daily at 2 AM
OLD_NOTIFICATION_RETENTION_DAYS=90

# ───────────────────────────────────────────────────────────────
# LOGGING CONFIGURATION
# ───────────────────────────────────────────────────────────────
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7
LOG_COLORIZE=true

# ───────────────────────────────────────────────────────────────
# MONITORING & METRICS
# ───────────────────────────────────────────────────────────────
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# ───────────────────────────────────────────────────────────────
# SECURITY CONFIGURATION
# ───────────────────────────────────────────────────────────────
ENABLE_HELMET=true
ENABLE_CORS=true
ENABLE_RATE_LIMITING=true
ENABLE_COMPRESSION=true

# ───────────────────────────────────────────────────────────────
# TEMPLATE CONFIGURATION
# ───────────────────────────────────────────────────────────────
TEMPLATE_ENGINE=handlebars  # handlebars or mustache
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_TTL=3600  # seconds

# ───────────────────────────────────────────────────────────────
# EVENT SYSTEM (Kafka - Optional)
# ───────────────────────────────────────────────────────────────
KAFKA_ENABLED=false
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-service-group
KAFKA_TOPICS=appointments,lab-results,prescriptions,billing

# ───────────────────────────────────────────────────────────────
# FEATURE FLAGS
# ───────────────────────────────────────────────────────────────
FEATURE_EMAIL_ENABLED=true
FEATURE_SMS_ENABLED=true
FEATURE_PUSH_ENABLED=true
FEATURE_WEBSOCKET_ENABLED=true
FEATURE_TEMPLATE_VERSIONING=false
FEATURE_AB_TESTING=false
FEATURE_ANALYTICS=false

# ───────────────────────────────────────────────────────────────
# DEVELOPMENT & DEBUGGING
# ───────────────────────────────────────────────────────────────
DEBUG=notification:*
SWAGGER_ENABLED=true
MOCK_EXTERNAL_SERVICES=false  # For testing without real email/SMS

# ───────────────────────────────────────────────────────────────
# TIMEZONE
# ───────────────────────────────────────────────────────────────
TZ=Africa/Khartoum  # EAT (UTC+3) for Sudan
```

---

## 📧 Email Configuration

### Option 1: Gmail SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password  # NOT your Gmail password!
SMTP_FROM_NAME=NileCare Healthcare
SMTP_FROM_EMAIL=noreply@nilecare.com
```

**Steps to get Gmail App Password:**
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords → Generate
4. Use generated password in `SMTP_PASSWORD`

### Option 2: SendGrid

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM_NAME=NileCare Healthcare
SMTP_FROM_EMAIL=verified@yourdomain.com
```

### Option 3: Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false  # true for port 465, false for others
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=your_smtp_password
```

---

## 📱 SMS Configuration

### Twilio Setup

1. **Create Twilio Account:** https://www.twilio.com/try-twilio
2. **Get Credentials:**
   - Account SID: Dashboard → Account Info
   - Auth Token: Dashboard → Account Info
   - Phone Number: Phone Numbers → Buy a Number

3. **Configure Environment:**
```env
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12345678901
```

### Africa's Talking (Alternative for Sudan)

```env
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
```

---

## 🔔 Push Notification Configuration

### Firebase Cloud Messaging (FCM)

1. **Create Firebase Project:** https://console.firebase.google.com/
2. **Generate Service Account Key:**
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Download JSON file

3. **Extract Credentials:**
```env
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=1234567890
```

### Apple Push Notification (APN)

1. **Get APNs Key:** Apple Developer Portal → Keys
2. **Configure:**
```env
APN_ENABLED=true
APN_KEY_ID=XXXXXXXXXX
APN_TEAM_ID=YYYYYYYYYY
APN_BUNDLE_ID=com.nilecare.app
APN_PRODUCTION=false
APN_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
```

---

## 🗄️ Database Setup

### PostgreSQL

```bash
# 1. Create database
createdb nilecare_notifications

# 2. Create user
createuser -P nilecare_user  # Enter password when prompted

# 3. Grant permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE nilecare_notifications TO nilecare_user;"

# 4. Run schema
psql -U nilecare_user -d nilecare_notifications -f database/schema.sql
```

### MySQL

```bash
# 1. Login to MySQL
mysql -u root -p

# 2. Create database and user
CREATE DATABASE nilecare_notifications;
CREATE USER 'nilecare_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON nilecare_notifications.* TO 'nilecare_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Run schema
mysql -u nilecare_user -p nilecare_notifications < database/schema.sql
```

---

## 🔴 Redis Setup

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download from: https://github.com/tporadowski/redis/releases

### Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password
REDIS_DB=0
```

### Test Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## 🔐 Authentication Service Integration

### Prerequisites

1. Auth Service must be running on port 7020
2. Service API key must be generated and configured in both services

### Get Service API Key

```bash
# From Auth Service
openssl rand -base64 32
```

### Configure

```env
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generated-key>
SERVICE_NAME=notification-service
```

### Verify Integration

```bash
# Test token validation endpoint
curl -X POST http://localhost:7020/api/v1/integration/validate-token \
  -H "X-Service-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"token": "user-jwt-token"}'
```

---

## 🧪 Testing Configuration

### Verify Environment

```bash
# Check all required environment variables
npm run check:env
```

### Test Email

```bash
# Send test email
npm run test:email
```

### Test SMS

```bash
# Send test SMS
npm run test:sms
```

### Test Push Notification

```bash
# Send test push
npm run test:push
```

### Test WebSocket

```bash
# Test WebSocket connection
npm run test:websocket
```

---

## 🐳 Docker Configuration

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  notification-service:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - AUTH_SERVICE_URL=http://auth-service:7020
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
      - auth-service
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: nilecare_notifications
      POSTGRES_USER: nilecare_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres-data:
```

### Start with Docker

```bash
docker-compose up -d
```

---

## 📊 Monitoring Setup

### Health Check Endpoints

```bash
# Basic health
curl http://localhost:3002/health

# Readiness probe (checks DB)
curl http://localhost:3002/health/ready

# Startup probe
curl http://localhost:3002/health/startup

# Prometheus metrics
curl http://localhost:3002/metrics
```

### Expected Response

```json
{
  "status": "healthy",
  "service": "notification-service",
  "timestamp": "2025-10-15T10:00:00.000Z",
  "version": "1.0.0",
  "features": {
    "websocket": true,
    "email": true,
    "sms": true,
    "push": true,
    "templates": true,
    "deliveryTracking": true
  }
}
```

---

## 🔧 Troubleshooting

### Service Won't Start

**Check:**
1. All environment variables are set
2. Database is accessible
3. Redis is running
4. Auth Service is running on port 7020
5. Port 3002 is not in use

```bash
# Check port
lsof -i :3002

# Check logs
tail -f logs/error.log
```

### Email Not Sending

**Check:**
1. SMTP credentials are correct
2. Firewall allows outbound port 587
3. Email provider allows SMTP
4. Test with: `npm run test:email`

### SMS Not Sending

**Check:**
1. Twilio credentials are correct
2. Phone number is verified (Twilio trial)
3. Recipient number format: +[country][number]
4. Test with: `npm run test:sms`

### Push Notifications Not Delivered

**Check:**
1. Firebase credentials are correct
2. Device token is valid
3. App has notification permissions
4. Test with: `npm run test:push`

### WebSocket Not Connecting

**Check:**
1. CORS settings allow client origin
2. Socket.IO client version matches server
3. Authentication token is valid
4. Test with: `npm run test:websocket`

---

## 📚 Additional Resources

- **Full Audit Report:** `NOTIFICATION_SERVICE_AUDIT_REPORT.md`
- **Quick Overview:** `AUDIT_SUMMARY_VISUAL.md`
- **API Documentation:** `API_DOCUMENTATION.md` (to be created)
- **Architecture Guide:** `ARCHITECTURE.md` (to be created)
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md` (to be created)

---

## 🆘 Support

For issues or questions:

1. Check the audit reports
2. Review logs: `logs/error.log`, `logs/combined.log`
3. Test health endpoint: `http://localhost:3002/health`
4. Verify environment variables
5. Check dependencies: `npm list`

---

**Last Updated:** October 15, 2025  
**Status:** Development Setup Guide

