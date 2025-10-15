# 🔧 NileCare Troubleshooting Guide

**Last Updated:** October 15, 2025  
**Version:** 2.0.0

Common issues and their solutions for the NileCare Healthcare Platform.

---

## 📋 Table of Contents

1. [Service Startup Issues](#service-startup-issues)
2. [Authentication Problems](#authentication-problems)
3. [Database Connectivity](#database-connectivity)
4. [API Errors](#api-errors)
5. [Performance Issues](#performance-issues)
6. [Frontend Problems](#frontend-problems)
7. [Docker/Kubernetes Issues](#dockerkubernetes-issues)
8. [Network & Connectivity](#network--connectivity)

---

## 🚀 Service Startup Issues

### ❌ "Port already in use" Error

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::7020
```

**Solutions:**

**Windows:**
```powershell
# Find process using the port
netstat -ano | findstr :7020

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:7020 | xargs kill -9

# Or use fuser
fuser -k 7020/tcp
```

---

### ❌ "Cannot find module" Errors

**Symptoms:**
```
Error: Cannot find module 'express'
Error: Cannot find module '@nilecare/shared'
```

**Solutions:**

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# For shared modules
cd shared
npm install
npm run build
cd ..

# Link shared modules
cd microservices/auth-service
npm link ../../shared
```

---

### ❌ Services Start in Wrong Order

**Symptoms:**
- Other services fail because Auth Service isn't ready
- "Connection refused to http://localhost:7020" errors

**Solution:**

```bash
# ALWAYS start Auth Service FIRST
cd microservices/auth-service && npm run dev

# Wait for "Auth Service running on port 7020" message

# Then start other services
cd microservices/main-nilecare && npm run dev
cd microservices/business && npm run dev
cd microservices/appointment-service && npm run dev
```

**Docker Compose Solution:**

```yaml
# Use depends_on with health checks
services:
  auth-service:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7020/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  business-service:
    depends_on:
      auth-service:
        condition: service_healthy
```

---

## 🔐 Authentication Problems

### ❌ "Authentication failed" on All Requests

**Symptoms:**
- All API requests return 401 Unauthorized
- Login works but subsequent requests fail

**Diagnostic Steps:**

```bash
# 1. Verify Auth Service is running
curl http://localhost:7020/health

# 2. Test login
curl -X POST http://localhost:7020/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@nilecare.sd","password":"TestPass123!"}'

# 3. Test token validation
curl -X POST http://localhost:7020/api/auth/validate \
  -H "Content-Type: application/json" \
  -H "X-Service-API-Key: your_api_key" \
  -d '{"token":"your_jwt_token"}'
```

**Common Causes & Solutions:**

**1. API Key Mismatch**
```bash
# Check Auth Service .env
SERVICE_API_KEYS=key1,key2,key3

# Must match in other services
AUTH_SERVICE_API_KEY=key1
```

**2. Auth Service URL Wrong**
```bash
# Correct format
AUTH_SERVICE_URL=http://localhost:7020
# NOT: http://localhost:7020/
# NOT: https://localhost:7020
```

**3. Redis Not Running**
```bash
# Check Redis
redis-cli ping
# Should return: PONG

# If not running
sudo systemctl start redis-server  # Linux
brew services start redis          # Mac
```

---

### ❌ "Token expired" Errors

**Symptoms:**
- Users get logged out frequently
- "Token expired" errors in logs

**Solutions:**

**1. Increase Token Expiration (Auth Service .env)**
```env
JWT_EXPIRES_IN=24h          # Access token (was: 15m)
JWT_REFRESH_EXPIRES_IN=7d   # Refresh token (was: 1d)
```

**2. Implement Token Refresh Logic (Frontend)**
```typescript
// Refresh token before it expires
async function refreshToken() {
  const response = await axios.post('/api/auth/refresh', {
    refreshToken: localStorage.getItem('refreshToken')
  });
  
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('refreshToken', response.data.refreshToken);
}

// Call every 23 hours
setInterval(refreshToken, 23 * 60 * 60 * 1000);
```

---

### ❌ "Invalid API key" Error

**Symptoms:**
```
Error: Invalid service API key
Status: 403 Forbidden
```

**Solution:**

```bash
# 1. Generate new API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Add to Auth Service .env
SERVICE_API_KEYS=existing_keys,new_generated_key

# 3. Add to microservice .env
AUTH_SERVICE_API_KEY=new_generated_key

# 4. Restart both services
```

---

## 💾 Database Connectivity

### ❌ "Access denied for user" Error

**Symptoms:**
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**Solutions:**

**1. Verify MySQL Credentials**
```bash
# Test connection
mysql -u root -p
# Enter password when prompted

# If successful, update .env
DB_USER=root
DB_PASSWORD=your_actual_password
```

**2. Grant Proper Privileges**
```sql
-- Login to MySQL as root
mysql -u root -p

-- Grant privileges
GRANT ALL PRIVILEGES ON nilecare.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

### ❌ "Database does not exist" Error

**Symptoms:**
```
Error: ER_BAD_DB_ERROR: Unknown database 'nilecare'
```

**Solution:**

```bash
# Create database
mysql -u root -p
CREATE DATABASE nilecare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schemas
mysql -u root -p nilecare < database/mysql/schema/identity_management.sql
mysql -u root -p nilecare < database/mysql/schema/clinical_data.sql
mysql -u root -p nilecare < database/mysql/schema/payment_system.sql
mysql -u root -p nilecare < database/mysql/schema/appointment_service.sql
```

---

### ❌ "Too many connections" Error

**Symptoms:**
```
Error: ER_TOO_MANY_USER_CONNECTIONS: Too many connections
```

**Solution:**

**1. Increase MySQL max_connections**
```sql
-- Temporary fix
SET GLOBAL max_connections = 500;

-- Permanent fix (my.cnf or my.ini)
[mysqld]
max_connections = 500
```

**2. Fix Connection Pool Leaks**
```typescript
// Always release connections
const connection = await pool.getConnection();
try {
  // Your database operations
  await connection.query('SELECT * FROM users');
} finally {
  connection.release(); // IMPORTANT!
}
```

---

### ❌ PostgreSQL Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# 1. Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # Mac

# 2. Start PostgreSQL
sudo systemctl start postgresql   # Linux
brew services start postgresql    # Mac

# 3. Verify port
sudo netstat -plnt | grep postgres

# 4. Check pg_hba.conf for connection rules
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line:
# host    nilecare    nilecare_user    127.0.0.1/32    md5

# 5. Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 🌐 API Errors

### ❌ 404 Not Found on Valid Routes

**Symptoms:**
- Endpoints that should exist return 404
- API works locally but not on server

**Solutions:**

**1. Check Route Registration**
```typescript
// In main server file, ensure routes are registered
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
```

**2. Verify API Gateway Configuration**
```javascript
// In API gateway
const routes = {
  '/api/auth': 'http://localhost:7020',
  '/api/patients': 'http://localhost:7000',
  '/api/appointments': 'http://localhost:7040'
};
```

**3. Check Nginx Configuration**
```nginx
location /api/auth {
    proxy_pass http://localhost:7020;
}
```

---

### ❌ CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
No 'Access-Control-Allow-Origin' header present
```

**Solutions:**

**Backend (Express):**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**.env File:**
```env
CORS_ORIGIN=http://localhost:5173
# For multiple origins:
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://nilecare.sd
```

---

### ❌ 500 Internal Server Error

**Symptoms:**
- Generic 500 errors
- No specific error message

**Diagnostic Steps:**

```bash
# 1. Check service logs
cd microservices/auth-service
npm run dev
# Watch console for error details

# 2. Enable detailed logging
# In .env
LOG_LEVEL=debug
LOG_AUTH=true

# 3. Check error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);  // Log the full error
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

---

## ⚡ Performance Issues

### ❌ Slow API Response Times

**Symptoms:**
- API requests take > 2 seconds
- Dashboard feels sluggish

**Solutions:**

**1. Add Database Indexes**
```sql
-- Common indexes for NileCare
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_users_email ON users(email);
```

**2. Enable Redis Caching**
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379
});

// Cache frequently accessed data
async function getPatient(id: number) {
  // Try cache first
  const cached = await redis.get(`patient:${id}`);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const patient = await db.query('SELECT * FROM patients WHERE id = ?', [id]);
  
  // Cache for 5 minutes
  await redis.setex(`patient:${id}`, 300, JSON.stringify(patient));
  
  return patient;
}
```

**3. Optimize Database Queries**
```typescript
// BAD - N+1 Query Problem
const appointments = await db.query('SELECT * FROM appointments');
for (const apt of appointments) {
  apt.patient = await db.query('SELECT * FROM patients WHERE id = ?', [apt.patient_id]);
}

// GOOD - Join Query
const appointments = await db.query(`
  SELECT a.*, p.* 
  FROM appointments a
  LEFT JOIN patients p ON a.patient_id = p.id
`);
```

---

### ❌ High Memory Usage

**Symptoms:**
- Services crash with "Out of memory" errors
- Server becomes unresponsive

**Solutions:**

**1. Increase Node.js Memory Limit**
```bash
# In package.json
{
  "scripts": {
    "start": "node --max-old-space-size=4096 dist/index.js"
  }
}
```

**2. Fix Memory Leaks**
```typescript
// BAD - Memory leak
const cache = {};
function cacheData(key, value) {
  cache[key] = value; // Never cleared!
}

// GOOD - Use Redis or LRU cache
import LRU from 'lru-cache';
const cache = new LRU({ max: 500, maxAge: 1000 * 60 * 60 });
```

**3. Enable Connection Pooling**
```typescript
// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10  // Limit concurrent connections
});
```

---

## 🖥️ Frontend Problems

### ❌ "Network Error" or "Failed to Fetch"

**Symptoms:**
- Frontend can't connect to backend
- All API calls fail

**Solutions:**

**1. Verify API URLs (.env)**
```env
VITE_API_URL=http://localhost:7000
VITE_AUTH_SERVICE_URL=http://localhost:7020

# NOT https when running locally
# NOT missing http://
```

**2. Check Backend is Running**
```bash
curl http://localhost:7000/health
curl http://localhost:7020/health
```

**3. Check Proxy Configuration (vite.config.ts)**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true
      }
    }
  }
});
```

---

### ❌ "Unexpected token < in JSON"

**Symptoms:**
- API returns HTML instead of JSON
- Error parsing response

**Cause:**
- Server is returning error page (404/500) as HTML

**Solution:**

```typescript
// Add proper error handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    }
    return Promise.reject(error);
  }
);
```

---

## 🐳 Docker/Kubernetes Issues

### ❌ "Cannot connect to Docker daemon"

**Symptoms:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solutions:**

```bash
# Start Docker daemon
sudo systemctl start docker  # Linux
open -a Docker              # Mac

# Check status
sudo systemctl status docker

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

---

### ❌ Docker Containers Exit Immediately

**Symptoms:**
- `docker-compose up` shows services starting then stopping
- `docker ps` shows no running containers

**Diagnostic Steps:**

```bash
# View logs
docker-compose logs auth-service
docker-compose logs business-service

# Run container interactively to see errors
docker run -it nilecare/auth-service:2.0.0 /bin/sh

# Check environment variables
docker-compose exec auth-service env
```

---

### ❌ Kubernetes Pods in CrashLoopBackOff

**Symptoms:**
```
NAME                              READY   STATUS             RESTARTS
auth-service-xxx-yyy              0/1     CrashLoopBackOff   5
```

**Solutions:**

```bash
# View pod logs
kubectl logs auth-service-xxx-yyy

# View previous logs (if pod restarted)
kubectl logs auth-service-xxx-yyy --previous

# Describe pod for events
kubectl describe pod auth-service-xxx-yyy

# Common fixes:
# 1. Check secrets are created
kubectl get secrets

# 2. Check config maps
kubectl get configmaps

# 3. Verify environment variables
kubectl exec -it auth-service-xxx-yyy -- env
```

---

## 🌐 Network & Connectivity

### ❌ "Connection timeout" Errors

**Symptoms:**
- Services can connect sometimes but timeout frequently
- Intermittent connection issues

**Solutions:**

**1. Increase Timeout Values**
```typescript
// Axios timeout
const client = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL,
  timeout: 10000  // 10 seconds (was: 5000)
});
```

**2. Check Firewall Rules**
```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow from 10.0.0.0/8 to any port 7020

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=7020/tcp
sudo firewall-cmd --reload
```

**3. Verify DNS Resolution**
```bash
# Test DNS
nslookup auth-service
ping auth-service

# Use IP address if DNS fails
AUTH_SERVICE_URL=http://192.168.1.10:7020
```

---

## 📞 Getting Help

If you've tried these solutions and still have issues:

### 1. Gather Information

```bash
# System info
node --version
npm --version
mysql --version
redis-cli --version

# Service status
curl http://localhost:7020/health
curl http://localhost:7000/health
curl http://localhost:7010/health
```

### 2. Check Logs

```bash
# Service logs
tail -f microservices/auth-service/logs/error.log
tail -f microservices/business/logs/error.log

# System logs
journalctl -u mysql -n 100
journalctl -u redis -n 100
```

### 3. Contact Support

- 📧 Email: support@nilecare.sd
- 💬 GitHub Issues: [Report an issue](https://github.com/your-org/nilecare/issues)
- 📖 Documentation: https://docs.nilecare.sd
- 🆘 Emergency Hotline: +249-XXX-XXXX

---

## 📚 Related Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Main README](./README.md)

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0


