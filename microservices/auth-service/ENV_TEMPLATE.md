# 🔧 Auth Service Environment Configuration Template

## Setup Instructions

### Step 1: Create .env File
```bash
# Copy this template to .env
cp ENV_TEMPLATE.md .env
# Then edit .env with your actual values
```

### Step 2: Generate Secure Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate MFA_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Update All Values Below

---

## Environment Variables

```bash
# =============================================================================
# DATABASE CONFIGURATION (MySQL 8.0)
# =============================================================================
# For Docker: Use 'mysql' as host. For XAMPP: Use 'localhost'
DB_HOST=mysql
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=nilecare_user
DB_PASSWORD=CHANGE_TO_SECURE_PASSWORD

# Root password (only for Docker MySQL container - different from DB_PASSWORD!)
DB_ROOT_PASSWORD=CHANGE_TO_DIFFERENT_SECURE_ROOT_PASSWORD

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
# CRITICAL: Use generated values from Step 2 above
JWT_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_MIN_32_CHARS
JWT_REFRESH_SECRET=CHANGE_THIS_TO_DIFFERENT_SECURE_RANDOM_STRING_MIN_32_CHARS

JWT_ISSUER=nilecare-auth
JWT_AUDIENCE=nilecare-api
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# =============================================================================
# SESSION CONFIGURATION
# =============================================================================
SESSION_SECRET=CHANGE_THIS_TO_SECURE_RANDOM_STRING_MIN_32_CHARS

# =============================================================================
# MFA ENCRYPTION
# =============================================================================
MFA_ENCRYPTION_KEY=CHANGE_THIS_TO_SECURE_HEX_STRING_64_CHARS

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=7020
NODE_ENV=development
LOG_LEVEL=debug

# =============================================================================
# CLIENT CONFIGURATION (CORS)
# =============================================================================
CLIENT_URL=http://localhost:5173

# =============================================================================
# OAUTH2/OIDC CONFIGURATION (Optional)
# =============================================================================
OAUTH2_AUTH_URL=
OAUTH2_TOKEN_URL=
OAUTH2_CLIENT_ID=
OAUTH2_CLIENT_SECRET=
OAUTH2_CALLBACK_URL=http://localhost:7020/auth/oauth2/callback
OAUTH2_SUCCESS_REDIRECT=http://localhost:5173/dashboard

OIDC_AUTH_URL=
OIDC_TOKEN_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_CALLBACK_URL=http://localhost:7020/auth/oidc/callback
OIDC_SUCCESS_REDIRECT=http://localhost:5173/dashboard

# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW_MS=300000

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
BCRYPT_ROUNDS=12
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION_MS=1800000

# =============================================================================
# EMAIL CONFIGURATION (For password reset, verification)
# =============================================================================
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@nilecare.sd

# =============================================================================
# MONITORING & OBSERVABILITY (Optional)
# =============================================================================
SENTRY_DSN=
APM_SERVER_URL=

# =============================================================================
# SERVICE-TO-SERVICE AUTHENTICATION
# =============================================================================
SERVICE_API_KEYS=
```

---

## Quick Start for Docker Development

Create a `.env` file with these values:

```bash
# Database (Docker - uses dedicated user, NOT root)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=nilecare_user
DB_PASSWORD=YourSecureAppPassword123!
DB_ROOT_PASSWORD=YourSecureRootPassword456!

# JWT Secrets (GENERATE YOUR OWN!)
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3b7c0a8f5f167f44f4964e6c998dee82
JWT_REFRESH_SECRET=b9g6g278g55g5075f7d009eef938221d4c8d1b9g6g278g55g5075f7d009eef93
SESSION_SECRET=c0h7h389h66h6186g8e110ffg049332e5d9e2c0h7h389h66h6186g8e110ffg04
MFA_ENCRYPTION_KEY=d1i8i490i77i7297h9f221ggh150443f6e0f3d1i8i490i77i7297h9f221ggh15

# Redis (optional in development)
REDIS_URL=redis://localhost:6379

# Server
PORT=7020
NODE_ENV=development
LOG_LEVEL=debug
CLIENT_URL=http://localhost:5173
```

⚠️ **WARNING:** The secrets above are EXAMPLES ONLY. Generate your own using the command in Step 2!

---

## Production Configuration Checklist

- [ ] All secrets generated using cryptographically secure random values
- [ ] `DB_PASSWORD` set to strong password
- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=info` or `warn`
- [ ] Redis URL configured and tested
- [ ] SMTP settings configured for email functionality
- [ ] `SERVICE_API_KEYS` generated for service-to-service auth
- [ ] No default or example values remain
- [ ] `.env` file added to `.gitignore`
- [ ] Secrets stored in secure vault (HashiCorp Vault, AWS Secrets Manager)

---

## Environment Variable Validation

The auth service validates all critical environment variables on startup:

✅ **Required in All Environments:**
- DB_HOST, DB_NAME, DB_USER
- JWT_SECRET, JWT_REFRESH_SECRET
- SESSION_SECRET
- MFA_ENCRYPTION_KEY

✅ **Required in Production Only:**
- DB_PASSWORD
- REDIS_URL

✅ **Validation Rules:**
- All secrets must be at least 32 characters
- No default values allowed (e.g., "CHANGE_THIS", "nilecare-jwt-secret")
- Service fails fast if validation fails

---

## Troubleshooting

### Error: "Missing critical env vars"
- Ensure .env file exists in auth-service directory
- Check all required variables are set
- Verify no typos in variable names

### Error: "JWT_SECRET must be at least 32 characters"
- Generate longer secret using the command above
- Ensure no spaces or newlines in the value

### Error: "contains default value"
- You're using an example/default secret
- Generate a new unique random string

### Database Connection Failed
```bash
# Test MySQL connection
mysql -u root -p -h localhost

# Create database if needed
mysql -u root -p -e "CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Load schema
mysql -u root -p nilecare < create-mysql-tables.sql
```

---

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use different secrets** for each environment (dev, staging, prod)
3. **Rotate secrets regularly** (every 90 days minimum)
4. **Store production secrets** in a secure vault
5. **Use strong passwords** for database (16+ characters)
6. **Enable Redis** in production for session management
7. **Monitor failed login attempts** and adjust rate limits as needed

---

## Integration with Other Services

Other NileCare microservices will need:

```bash
# In their .env files
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generate-service-key>
```

Add the service API key to this auth service's `SERVICE_API_KEYS`:
```bash
SERVICE_API_KEYS=key1,key2,key3
```

---

**Generated:** Auth Service Critical Fixes Phase 1  
**Version:** 1.0.0  
**Last Updated:** $(date)

