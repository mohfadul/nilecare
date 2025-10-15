# Business Service - Environment Configuration

This document describes all environment variables required by the NileCare Business Service.

## Quick Setup

Create a `.env` file in the `microservices/business/` directory with the following variables:

```env
# ============================================================================
# REQUIRED VARIABLES (Minimum configuration)
# ============================================================================
NODE_ENV=development
PORT=7010

DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# ============================================================================
# OPTIONAL VARIABLES (Recommended)
# ============================================================================
LOG_LEVEL=info
REDIS_HOST=localhost
REDIS_PORT=6379
ENABLE_API_DOCS=true
TZ=Africa/Khartoum
```

## Complete Configuration Reference

### Service Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Environment: `development`, `production`, `test` |
| `PORT` | Yes | `7010` | HTTP server port (per NileCare architecture) |
| `SERVICE_NAME` | No | `business-service` | Service identifier for logging |

### Database Configuration (MySQL)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | - | MySQL server hostname |
| `DB_PORT` | No | `3306` | MySQL server port |
| `DB_NAME` | Yes | - | Database name (`nilecare` - shared database) |
| `DB_USER` | Yes | - | Database username |
| `DB_PASSWORD` | No | `''` | Database password (empty for XAMPP default) |
| `DB_CONNECTION_LIMIT` | No | `20` | Max connections in pool |
| `DB_QUEUE_LIMIT` | No | `0` | Max queued requests (0 = unlimited) |

### Authentication & Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | **CRITICAL**: Must match auth-service secret |
| `JWT_EXPIRES_IN` | No | `24h` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token expiration |
| `SESSION_SECRET` | No | - | Session encryption key |

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLIENT_URL` | Yes | - | Web dashboard URL |
| `CORS_ORIGIN` | Yes | - | Allowed CORS origin (usually same as CLIENT_URL) |

### Microservices URLs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SERVICE_URL` | No | `http://localhost:7020` | Auth service endpoint |
| `MAIN_SERVICE_URL` | No | `http://localhost:7000` | Main NileCare service endpoint |
| `PAYMENT_SERVICE_URL` | No | `http://localhost:7030` | Payment gateway endpoint |

### Logging

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Logging level: `error`, `warn`, `info`, `debug` |
| `LOG_DIR` | No | `./logs` | Directory for log files |

### Redis Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_HOST` | No | `localhost` | Redis server hostname |
| `REDIS_PORT` | No | `6379` | Redis server port |
| `REDIS_PASSWORD` | No | - | Redis password (if required) |
| `REDIS_ENABLED` | No | `true` | Enable/disable Redis |

### Socket.IO

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOCKET_IO_CORS_ORIGIN` | No | Same as `CORS_ORIGIN` | Socket.IO CORS origin |

### Business Logic

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEFAULT_APPOINTMENT_DURATION` | No | `30` | Default appointment duration (minutes) |
| `WORKING_HOURS_START` | No | `8` | Start of working hours (24h format) |
| `WORKING_HOURS_END` | No | `18` | End of working hours (24h format) |
| `DEFAULT_CURRENCY` | No | `SDG` | Default currency (Sudanese Pound) |
| `INVOICE_PREFIX` | No | `INV` | Invoice number prefix |

### Timezone

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TZ` | No | `Africa/Khartoum` | Timezone (Sudan uses EAT/UTC+3) |

## Production Recommendations

When deploying to production (`NODE_ENV=production`):

1. **Security:**
   - Use strong, randomly generated `JWT_SECRET` (min 32 characters)
   - Use strong `SESSION_SECRET`
   - Never use default/example secrets

2. **Database:**
   - Use strong `DB_PASSWORD`
   - Enable SSL/TLS connections
   - Use connection pooling appropriately

3. **CORS:**
   - Set `CORS_ORIGIN` to your actual production domain
   - Avoid wildcards (`*`)

4. **Logging:**
   - Set `LOG_LEVEL=info` or `LOG_LEVEL=warn`
   - Configure log rotation
   - Send logs to centralized logging system

5. **Performance:**
   - Enable Redis for caching
   - Configure appropriate `DB_CONNECTION_LIMIT`
   - Enable compression

## Example Configurations

### Local Development (XAMPP)

```env
NODE_ENV=development
PORT=7010
DB_HOST=localhost
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=
JWT_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

### Docker Development

```env
NODE_ENV=development
PORT=7010
DB_HOST=mysql
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=nilecare_password
JWT_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=redis
```

### Production

```env
NODE_ENV=production
PORT=7010
DB_HOST=your-db-host.com
DB_NAME=nilecare
DB_USER=nilecare_prod_user
DB_PASSWORD=STRONG_PRODUCTION_PASSWORD
JWT_SECRET=STRONG_RANDOM_JWT_SECRET_MIN_32_CHARS
CLIENT_URL=https://dashboard.nilecare.sd
CORS_ORIGIN=https://dashboard.nilecare.sd
LOG_LEVEL=info
REDIS_HOST=redis.nilecare.sd
ENABLE_API_DOCS=false
TZ=Africa/Khartoum
```

## Validation

The service validates required environment variables on startup. Missing critical variables will prevent the service from starting with a clear error message.

Required variables checked on startup:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`

Note: `DB_PASSWORD` is optional to support XAMPP default configuration (empty password).

