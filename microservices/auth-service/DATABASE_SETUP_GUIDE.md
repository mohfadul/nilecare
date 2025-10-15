# 🗄️ NileCare Auth Service - Database Configuration Guide

## 📋 Overview

This guide explains the **secure database setup** for the NileCare Authentication Service, following best practices for role-based access control and credential management.

---

## 🔐 Security Architecture

### **Principle of Least Privilege**

The auth service uses a **dedicated, non-root database user** with limited permissions:

- **Root User (`root`)**: Administrative access only, not used by the application
- **Application User (`nilecare_user`)**: Limited to `nilecare_auth` database only

---

## 🐳 Docker Configuration

### **docker-compose.yml Configuration**

```yaml
mysql:
  image: mysql:8.0
  environment:
    # Root password (for administrative tasks only)
    MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    
    # Application database
    MYSQL_DATABASE: nilecare_auth
    
    # Application user (non-root) with limited privileges
    MYSQL_USER: nilecare_user
    MYSQL_PASSWORD: ${DB_PASSWORD}
```

### **Key Points:**

✅ **Separate Passwords**: Root and application user have different passwords  
✅ **No Hardcoded Values**: All credentials come from `.env` file  
✅ **Required Variables**: Docker Compose fails fast if secrets are missing  
✅ **Automatic User Creation**: MySQL creates `nilecare_user` on first startup  

---

## 📁 Environment Variables

### **.env File Structure**

```bash
# Application database credentials (used by auth-service)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=nilecare_auth
DB_USER=nilecare_user
DB_PASSWORD=NileCare2025SecureAppPassword!

# Root credentials (for container initialization only)
DB_ROOT_PASSWORD=NileCare2025SecureRootPassword!
```

### **Variable Validation**

The `docker-compose.yml` uses Docker's built-in validation:

```yaml
- DB_PASSWORD=${DB_PASSWORD:?Error: DB_PASSWORD is required}
- JWT_SECRET=${JWT_SECRET:?Error: JWT_SECRET is required}
```

If any required variable is missing, Docker Compose will **fail with a clear error message**.

---

## 🚀 Startup Process

### **What Happens When MySQL Starts?**

1. **Container Initialization** (first run only)
   - MySQL reads `MYSQL_ROOT_PASSWORD` and sets root password
   - MySQL reads `MYSQL_DATABASE` and creates `nilecare_auth` database
   - MySQL reads `MYSQL_USER` and `MYSQL_PASSWORD` and creates user
   - MySQL grants `nilecare_user` full access to `nilecare_auth` database

2. **Schema Initialization**
   - Scripts in `/docker-entrypoint-initdb.d/` run in alphabetical order:
     - `01-schema.sql` → Creates all tables
     - `migrations/*.sql` → Additional migrations

3. **Health Check**
   - MySQL container reports healthy when it responds to ping
   - Auth service waits for healthy MySQL before starting

---

## 📊 Database Schema

### **Tables Created Automatically**

| Table | Purpose |
|-------|---------|
| `auth_users` | User accounts, credentials, MFA settings |
| `auth_refresh_tokens` | JWT refresh tokens |
| `auth_devices` | Trusted devices for MFA |
| `auth_roles` | Role definitions and permissions |
| `auth_permissions` | Granular permission definitions |
| `auth_audit_logs` | Security audit trail |
| `auth_login_attempts` | Login history for security monitoring |

### **Default Roles**

The system creates 5 default roles on first run:

- **admin**: System Administrator (`*` - all permissions)
- **doctor**: Healthcare Provider
- **nurse**: Nursing Staff
- **patient**: Patient
- **receptionist**: Front Desk

---

## 🔍 Connection Logging

### **Application Logs**

When the auth service connects successfully, you'll see:

```
✅ MySQL Database connection established successfully {
  "host": "mysql",
  "port": 3306,
  "database": "nilecare_auth",
  "user": "nilecare_user",
  "timestamp": "2025-10-14T08:00:00.000Z",
  "environment": "development"
}

📊 Database connection verified {
  "database": "nilecare_auth",
  "user": "nilecare_user@%",
  "mysqlVersion": "8.0.35"
}
```

### **Connection Failure Logs**

If connection fails, you'll see detailed error information:

```
❌ Failed to connect to MySQL database {
  "host": "mysql",
  "port": 3306,
  "database": "nilecare_auth",
  "user": "nilecare_user",
  "error": "Access denied for user 'nilecare_user'@'172.18.0.3'",
  "code": "ER_ACCESS_DENIED_ERROR",
  "timestamp": "2025-10-14T08:00:00.000Z"
}
```

---

## 🧪 Testing the Setup

### **1. Start the Services**

```bash
cd microservices/auth-service
docker-compose up -d
```

### **2. Check Container Logs**

```bash
# MySQL initialization logs
docker logs nilecare-mysql

# Auth service connection logs
docker logs nilecare-auth-service
```

### **3. Verify Database User**

```bash
# Connect to MySQL container
docker exec -it nilecare-mysql mysql -u root -p

# Check users
SELECT user, host FROM mysql.user WHERE user='nilecare_user';

# Check databases
SHOW DATABASES;

# Check permissions
SHOW GRANTS FOR 'nilecare_user'@'%';
```

Expected output:
```sql
+--------------------------------------------+
| Grants for nilecare_user@%                 |
+--------------------------------------------+
| GRANT USAGE ON *.* TO `nilecare_user`@`%`  |
| GRANT ALL PRIVILEGES ON `nilecare_auth`.*  |
+--------------------------------------------+
```

### **4. Verify Tables**

```bash
docker exec -it nilecare-mysql mysql -u nilecare_user -p nilecare_auth

# List tables
SHOW TABLES;

# Check default roles
SELECT id, name, description FROM auth_roles;
```

---

## 🔒 Security Checklist

- [ ] ✅ Root password is different from application password
- [ ] ✅ Application user (`nilecare_user`) has limited privileges
- [ ] ✅ No passwords are hardcoded in code or Docker files
- [ ] ✅ All secrets are in `.env` file (not committed to git)
- [ ] ✅ Database is only accessible from Docker network
- [ ] ✅ Connection uses `mysql_native_password` authentication
- [ ] ✅ Character set is `utf8mb4` for full Unicode support
- [ ] ✅ Health checks verify database availability

---

## 🐛 Troubleshooting

### **Error: "MYSQL_USER="root" is invalid"**

**Cause**: You cannot set `MYSQL_USER` to `root`  
**Fix**: Use a different username (e.g., `nilecare_user`)

```bash
# In .env file
DB_USER=nilecare_user  # ✅ Correct
# DB_USER=root         # ❌ Invalid
```

---

### **Error: "DB_PASSWORD is required"**

**Cause**: Missing environment variable  
**Fix**: Ensure `.env` file exists and contains `DB_PASSWORD`

```bash
# Check if .env exists
ls -la .env

# Verify it contains DB_PASSWORD
cat .env | grep DB_PASSWORD
```

---

### **Error: "Access denied for user"**

**Cause**: Password mismatch between `.env` and database  
**Fix**: Reset the database volume

```bash
# Stop containers
docker-compose down

# Remove MySQL volume (WARNING: This deletes all data!)
docker volume rm auth-service_mysql-data

# Restart with correct password
docker-compose up -d
```

---

### **Error: "Database does not exist"**

**Cause**: Database not created during initialization  
**Fix**: Check MySQL logs for errors

```bash
# View MySQL initialization logs
docker logs nilecare-mysql 2>&1 | grep -i error

# Manually create database if needed
docker exec -it nilecare-mysql mysql -u root -p
CREATE DATABASE nilecare_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### **Port 3306 Already in Use**

**Cause**: Local MySQL is running  
**Fix**: Either stop local MySQL or change port

```bash
# Option 1: Stop local MySQL (Windows)
net stop mysql

# Option 2: Change Docker port in docker-compose.yml
ports:
  - "3307:3306"  # Use port 3307 on host

# Update .env
DB_PORT=3307
```

---

## 📝 Integration with Other Microservices

### **Business Service Configuration**

```yaml
# microservices/business/docker-compose.yml
services:
  business-service:
    environment:
      - AUTH_SERVICE_URL=http://nilecare-auth-service:7020
      - DB_HOST=mysql
      - DB_NAME=nilecare_business
      - DB_USER=nilecare_business_user
      - DB_PASSWORD=${DB_PASSWORD}
```

### **Shared MySQL Container**

All microservices can share the same MySQL container but use **different databases and users**:

```sql
-- Auth service
CREATE DATABASE nilecare_auth;
CREATE USER 'nilecare_user'@'%' IDENTIFIED BY 'password1';
GRANT ALL ON nilecare_auth.* TO 'nilecare_user'@'%';

-- Business service
CREATE DATABASE nilecare_business;
CREATE USER 'nilecare_business_user'@'%' IDENTIFIED BY 'password2';
GRANT ALL ON nilecare_business.* TO 'nilecare_business_user'@'%';

-- Appointment service
CREATE DATABASE nilecare_appointments;
CREATE USER 'nilecare_appt_user'@'%' IDENTIFIED BY 'password3';
GRANT ALL ON nilecare_appointments.* TO 'nilecare_appt_user'@'%';
```

---

## 🎯 Best Practices Summary

1. **Separate Credentials**: Never use root user for application access
2. **Environment Variables**: All secrets in `.env`, never in code
3. **Validation**: Use Docker Compose's `${VAR:?Error}` syntax
4. **Logging**: Log connection details (but NOT passwords!)
5. **Health Checks**: Always verify database is ready before app starts
6. **Character Encoding**: Use `utf8mb4` for proper Unicode support
7. **Connection Pooling**: Configure appropriate pool size for load
8. **Monitoring**: Track connection errors and performance metrics

---

## 📚 References

- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [MySQL User Management](https://dev.mysql.com/doc/refman/8.0/en/user-account-management.html)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [NileCare Auth Service README](./README_AUDIT_COMPLETE.md)

---

**Last Updated**: October 14, 2025  
**Version**: 1.0.0  
**Maintainer**: NileCare Development Team

