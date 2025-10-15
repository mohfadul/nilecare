# 🔐 NileCare Authentication Service

**Version:** 2.0.0  
**Port:** 7020  
**Database:** MySQL  
**Status:** ✅ Production Ready

---

## 📋 Overview

The Authentication Service is the **centralized authentication and authorization hub** for the entire NileCare platform. All microservices delegate authentication decisions to this service, ensuring consistent security across the system.

### Key Responsibilities

- ✅ User authentication (login/logout)
- ✅ JWT token generation and validation
- ✅ Session management via Redis
- ✅ Role-Based Access Control (RBAC)
- ✅ Multi-Factor Authentication (MFA)
- ✅ OAuth2 & OpenID Connect support
- ✅ Service-to-service authentication via API keys
- ✅ Comprehensive security audit logging
- ✅ Password reset and account recovery

### Architecture Principle

```
⚠️ CRITICAL: Auth Service is the SINGLE SOURCE OF TRUTH
✓ No local JWT verification in other services
✓ All auth requests delegated via HTTP to this service
✓ Real-time validation ensures no stale permissions
```

---

## ✨ Features

### Authentication Methods
- **Email + Password**: Standard authentication
- **Multi-Factor Authentication (MFA)**: TOTP-based 2FA
- **OAuth2**: Google, Microsoft, GitHub integration
- **API Keys**: Service-to-service authentication
- **Refresh Tokens**: Secure token renewal

### Authorization
- **Role-Based Access Control (RBAC)**: 10+ predefined roles
- **Permission System**: Granular permissions (e.g., `patients:read`, `appointments:create`)
- **Real-Time Validation**: Immediate effect when permissions change
- **Hierarchical Roles**: Role inheritance support

### Security Features
- **Argon2 Password Hashing**: Industry-standard secure hashing
- **JWT with RS256**: Asymmetric encryption for tokens
- **Rate Limiting**: Brute-force protection
- **Session Management**: Redis-backed sessions
- **Audit Logging**: Complete authentication event tracking
- **Account Lockout**: Automatic lockout after failed attempts

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis 7+

### Installation

```bash
cd microservices/auth-service
npm install
```

### Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schema
mysql -u root -p nilecare < ../../database/mysql/schema/identity_management.sql
```

### Environment Configuration

Create `.env` file:

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
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-characters-required
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=your-session-secret-key-min-32-chars
MFA_ENCRYPTION_KEY=your-mfa-encryption-key-64-chars

# Service API Keys (comma-separated, 64-char hex each)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SERVICE_API_KEYS=key1,key2,key3,key4,key5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_secret
```

### Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Verify Installation

```bash
# Health check
curl http://localhost:7020/health

# Expected response:
# {"status":"healthy","service":"auth-service","timestamp":"..."}
```

---

## 📡 API Endpoints

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "doctor@nilecare.sd",
  "password": "TestPass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "userId": 1,
    "email": "doctor@nilecare.sd",
    "role": "doctor",
    "permissions": ["patients:read", "appointments:create"]
  }
}
```

#### POST /api/auth/logout
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### Token Validation (For Microservices)

#### POST /api/auth/validate
Validate JWT token and return user data.

**Headers:**
```
X-Service-API-Key: <service_api_key>
```

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": 1,
    "email": "doctor@nilecare.sd",
    "role": "doctor",
    "permissions": ["patients:read", "appointments:create"],
    "facilityId": 1
  }
}
```

### Multi-Factor Authentication

#### POST /api/auth/mfa/enable
Enable MFA for user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

#### POST /api/auth/mfa/verify
Verify MFA token during login.

**Request:**
```json
{
  "email": "doctor@nilecare.sd",
  "password": "TestPass123!",
  "mfaToken": "123456"
}
```

### User Management

#### GET /api/users
Get all users (admin only).

#### GET /api/users/:id
Get user by ID.

#### POST /api/users
Create new user.

#### PUT /api/users/:id
Update user.

#### DELETE /api/users/:id
Delete user (soft delete).

### Roles & Permissions

#### GET /api/roles
Get all roles.

#### POST /api/roles
Create new role.

#### POST /api/roles/:id/permissions
Assign permissions to role.

---

## 🗄️ Database Schema

### Tables

**users**
- Primary user accounts table
- Stores credentials, profile info, status

**roles**
- System roles (doctor, nurse, admin, etc.)

**permissions**
- Granular permissions

**role_permissions**
- Many-to-many relationship

**user_sessions**
- Active user sessions

**audit_logs**
- All authentication events

**mfa_secrets**
- MFA secret keys (encrypted)

### Key Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

---

## 🔧 Development

### Project Structure

```
auth-service/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.ts        # Entry point
├── migrations/         # Database migrations
├── .env                # Environment variables
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
└── README.md           # This file
```

### Available Scripts

```bash
# Development
npm run dev          # Start with hot reload

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled code

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Database
npm run migrate      # Run migrations
npm run seed         # Seed database

# Linting
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Specific test file
npm test -- auth.test.ts

# With coverage
npm run test:coverage
```

### Test Users

```javascript
// Test accounts in development
{
  email: "doctor@nilecare.sd",
  password: "TestPass123!",
  role: "doctor"
},
{
  email: "admin@nilecare.sd",
  password: "TestPass123!",
  role: "admin"
},
{
  email: "nurse@nilecare.sd",
  password: "TestPass123!",
  role: "nurse"
}
```

---

## 🚀 Deployment

### Docker Build

```bash
# Build image
docker build -t nilecare/auth-service:2.0.0 .

# Run container
docker run -d \
  -p 7020:7020 \
  --env-file .env.production \
  nilecare/auth-service:2.0.0
```

### Kubernetes Deployment

```bash
# Create secrets
kubectl create secret generic auth-secrets \
  --from-literal=jwt-secret='your_jwt_secret' \
  --from-literal=db-password='your_db_password'

# Deploy
kubectl apply -f k8s/auth-service-deployment.yaml

# Check status
kubectl get pods -l app=auth-service
```

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ **NEVER** commit `.env` files
- ✅ Use strong, random secrets (minimum 32 characters)
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Different secrets per environment

### Password Policy
- Minimum 8 characters
- Must include: uppercase, lowercase, number, special character
- Cannot contain common passwords
- Hashed with Argon2

### Rate Limiting
```typescript
// Default limits
login: 5 attempts per 15 minutes
register: 3 attempts per hour
password reset: 3 attempts per hour
```

---

## 📊 Monitoring

### Health Check

```bash
GET /health
Response: {"status":"healthy","service":"auth-service","timestamp":"..."}
```

### Metrics

```bash
GET /metrics
# Prometheus metrics
auth_login_total
auth_login_success_total
auth_login_failure_total
auth_token_validation_duration_seconds
```

### Logs

```bash
# View logs
tail -f logs/auth-service.log

# Error logs only
tail -f logs/error.log

# Audit logs
tail -f logs/audit.log
```

---

## 🐛 Troubleshooting

### Common Issues

**"Port 7020 already in use"**
```bash
# Find and kill process
lsof -ti:7020 | xargs kill -9
```

**"Cannot connect to MySQL"**
```bash
# Verify MySQL is running
mysql -u root -p

# Check credentials in .env
```

**"Redis connection refused"**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
sudo systemctl start redis-server
```

See [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) for more solutions.

---

## 📚 Related Documentation

- [Authentication Guide](../../AUTHENTICATION.md) - Complete integration guide
- [Quick Start](../../QUICKSTART.md) - System setup
- [Deployment Guide](../../DEPLOYMENT.md) - Production deployment
- [Main README](../../README.md) - System overview

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run `npm test` and `npm run lint`
5. Submit pull request

---

## 📞 Support

- 📧 Email: security@nilecare.sd
- 🔒 Security Issues: security@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Maintained by:** NileCare Security Team


