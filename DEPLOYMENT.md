# 🚀 NileCare Production Deployment Guide

**Last Updated:** October 15, 2025  
**Version:** 2.0.0

Complete guide for deploying NileCare to production environments.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Environment Configuration](#environment-configuration)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Security Hardening](#security-hardening)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Team trained on deployment process

---

## 🏗 Infrastructure Requirements

### Minimum Production Specifications

#### Application Servers (per service)
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 1 Gbps

#### Database Servers

**MySQL (Primary Database)**
- **CPU**: 4 cores
- **RAM**: 16 GB
- **Storage**: 100 GB SSD (RAID 10 recommended)

**PostgreSQL (Auth & Analytics)**
- **CPU**: 2 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD

**Redis (Caching)**
- **CPU**: 2 cores
- **RAM**: 8 GB (depends on session volume)
- **Storage**: 10 GB

#### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (Nginx)                   │
│                  SSL Termination + Caching                  │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│  App    │    │  App    │    │  App    │
│ Server  │    │ Server  │    │ Server  │
│   #1    │    │   #2    │    │   #3    │
└────┬────┘    └────┬────┘    └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│ MySQL   │    │ Redis   │    │ PostgreSQL│
│ Primary │    │ Cluster │    │ Server  │
│ +Replica│    │         │    │         │
└─────────┘    └─────────┘    └─────────┘
```

---

## 💾 Database Setup

### MySQL Production Setup

```sql
-- Create production database with proper settings
CREATE DATABASE nilecare 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create dedicated user with limited privileges
CREATE USER 'nilecare_app'@'%' IDENTIFIED BY 'strong_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON nilecare.* TO 'nilecare_app'@'%';
FLUSH PRIVILEGES;

-- Import schemas
USE nilecare;
SOURCE /path/to/database/mysql/schema/identity_management.sql;
SOURCE /path/to/database/mysql/schema/clinical_data.sql;
SOURCE /path/to/database/mysql/schema/payment_system.sql;
SOURCE /path/to/database/mysql/schema/appointment_service.sql;
```

### MySQL Configuration (`my.cnf`)

```ini
[mysqld]
# Performance
max_connections = 500
innodb_buffer_pool_size = 8G
innodb_log_file_size = 512M

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Binary Logging (for replication)
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
expire_logs_days = 7

# Slow Query Log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

### PostgreSQL Production Setup

```sql
-- Create database
CREATE DATABASE nilecare 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='en_US.UTF-8' 
  LC_CTYPE='en_US.UTF-8';

-- Create user
CREATE USER nilecare_auth WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE nilecare TO nilecare_auth;

-- Import schema
\c nilecare
\i /path/to/database/postgresql/schema/healthcare_analytics.sql;
```

### Redis Production Setup

```bash
# Install Redis
apt-get update
apt-get install redis-server

# Configure Redis (/etc/redis/redis.conf)
maxmemory 8gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Enable authentication
requirepass your_redis_password

# Start Redis
systemctl enable redis-server
systemctl start redis-server
```

---

## 🐳 Docker Deployment

### Build Production Images

```bash
# Build all services
docker build -t nilecare/auth-service:2.0.0 -f microservices/auth-service/Dockerfile .
docker build -t nilecare/main-service:2.0.0 -f microservices/main-nilecare/Dockerfile .
docker build -t nilecare/business-service:2.0.0 -f microservices/business/Dockerfile .
docker build -t nilecare/appointment-service:2.0.0 -f microservices/appointment-service/Dockerfile .
docker build -t nilecare/payment-service:2.0.0 -f microservices/payment-gateway-service/Dockerfile .
docker build -t nilecare/web-dashboard:2.0.0 -f clients/web-dashboard/Dockerfile .

# Push to registry
docker push nilecare/auth-service:2.0.0
docker push nilecare/main-service:2.0.0
docker push nilecare/business-service:2.0.0
docker push nilecare/appointment-service:2.0.0
docker push nilecare/payment-service:2.0.0
docker push nilecare/web-dashboard:2.0.0
```

### Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: nilecare
    volumes:
      - mysql-data:/var/lib/mysql
      - ./database/mysql/schema:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    restart: unless-stopped
    networks:
      - nilecare-network

  postgresql:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: nilecare
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - nilecare-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - nilecare-network

  auth-service:
    image: nilecare/auth-service:2.0.0
    environment:
      NODE_ENV: production
      PORT: 7020
      DB_HOST: mysql
      REDIS_HOST: redis
    env_file:
      - ./microservices/auth-service/.env.production
    ports:
      - "7020:7020"
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    networks:
      - nilecare-network

  main-service:
    image: nilecare/main-service:2.0.0
    environment:
      NODE_ENV: production
      PORT: 7000
      DB_HOST: mysql
      AUTH_SERVICE_URL: http://auth-service:7020
    env_file:
      - ./microservices/main-nilecare/.env.production
    ports:
      - "7000:7000"
    depends_on:
      - mysql
      - auth-service
    restart: unless-stopped
    networks:
      - nilecare-network

  business-service:
    image: nilecare/business-service:2.0.0
    environment:
      NODE_ENV: production
      PORT: 7010
      DB_HOST: mysql
      AUTH_SERVICE_URL: http://auth-service:7020
    env_file:
      - ./microservices/business/.env.production
    ports:
      - "7010:7010"
    depends_on:
      - mysql
      - redis
      - auth-service
    restart: unless-stopped
    networks:
      - nilecare-network

  appointment-service:
    image: nilecare/appointment-service:2.0.0
    environment:
      NODE_ENV: production
      PORT: 7040
      DB_HOST: mysql
      AUTH_SERVICE_URL: http://auth-service:7020
    env_file:
      - ./microservices/appointment-service/.env.production
    ports:
      - "7040:7040"
    depends_on:
      - mysql
      - redis
      - auth-service
    restart: unless-stopped
    networks:
      - nilecare-network

  payment-service:
    image: nilecare/payment-service:2.0.0
    environment:
      NODE_ENV: production
      PORT: 7030
      DB_HOST: postgresql
      AUTH_SERVICE_URL: http://auth-service:7020
    env_file:
      - ./microservices/payment-gateway-service/.env.production
    ports:
      - "7030:7030"
    depends_on:
      - postgresql
      - auth-service
    restart: unless-stopped
    networks:
      - nilecare-network

  web-dashboard:
    image: nilecare/web-dashboard:2.0.0
    ports:
      - "80:80"
    restart: unless-stopped
    networks:
      - nilecare-network

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "443:443"
    depends_on:
      - auth-service
      - main-service
      - business-service
      - appointment-service
      - payment-service
    restart: unless-stopped
    networks:
      - nilecare-network

volumes:
  mysql-data:
  postgres-data:
  redis-data:

networks:
  nilecare-network:
    driver: bridge
```

### Deploy with Docker Compose

```bash
# Create production environment files
cp .env.example .env.production

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale business-service=3
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Create Namespace

```bash
kubectl create namespace nilecare
kubectl config set-context --current --namespace=nilecare
```

### Deploy Secrets

```bash
# Create secret for database credentials
kubectl create secret generic mysql-credentials \
  --from-literal=root-password='your_root_password' \
  --from-literal=app-password='your_app_password'

kubectl create secret generic postgres-credentials \
  --from-literal=password='your_postgres_password'

# Create secret for JWT and API keys
kubectl create secret generic auth-secrets \
  --from-literal=jwt-secret='your_jwt_secret_min_32_chars' \
  --from-literal=jwt-refresh-secret='your_refresh_secret' \
  --from-literal=session-secret='your_session_secret' \
  --from-literal=mfa-encryption-key='your_mfa_key'
```

### Apply Kubernetes Manifests

```bash
# Deploy databases
kubectl apply -f infrastructure/kubernetes/mysql-deployment.yaml
kubectl apply -f infrastructure/kubernetes/postgresql-deployment.yaml
kubectl apply -f infrastructure/kubernetes/redis-deployment.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/auth-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/main-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/business-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/appointment-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/payment-service-deployment.yaml

# Deploy ingress
kubectl apply -f infrastructure/kubernetes/ingress.yaml

# Check deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

### Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: business-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: business-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
kubectl apply -f hpa.yaml
```

---

## 🔒 SSL/TLS Configuration

### Obtain SSL Certificates

#### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d api.nilecare.sd -d nilecare.sd
```

#### Option 2: Purchase Commercial Certificate

Follow your certificate provider's instructions.

### Nginx SSL Configuration

```nginx
# /etc/nginx/sites-available/nilecare
server {
    listen 80;
    server_name nilecare.sd www.nilecare.sd;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nilecare.sd www.nilecare.sd;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/nilecare.sd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nilecare.sd/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to services
    location /api/auth {
        proxy_pass http://localhost:7020;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:7000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 Monitoring & Logging

### Prometheus + Grafana

```bash
# Install Prometheus
docker run -d -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Install Grafana
docker run -d -p 3000:3000 grafana/grafana
```

### Logging with ELK Stack

```bash
# Docker Compose for ELK
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.10.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"

  kibana:
    image: kibana:8.10.0
    ports:
      - "5601:5601"
```

---

## 💾 Backup & Recovery

### Automated MySQL Backups

```bash
#!/bin/bash
# backup-mysql.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/nilecare_$DATE.sql.gz"

# Create backup
mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  nilecare | gzip > $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "nilecare_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Schedule Backups (Cron)

```bash
# Add to crontab
crontab -e

# Run backup daily at 2 AM
0 2 * * * /path/to/backup-mysql.sh
```

### Restore from Backup

```bash
# Decompress and restore
gunzip < nilecare_20251015.sql.gz | mysql -u root -p nilecare
```

---

## 🔐 Security Hardening

### 1. Firewall Configuration (UFW)

```bash
# Enable firewall
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow database access only from app servers
ufw allow from 10.0.1.0/24 to any port 3306
ufw allow from 10.0.1.0/24 to any port 5432

# Check status
ufw status
```

### 2. Fail2Ban Configuration

```bash
# Install Fail2Ban
apt-get install fail2ban

# Configure /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
```

### 3. Secure Environment Variables

```bash
# Never commit .env files
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Use secret management tools
# - HashiCorp Vault
# - AWS Secrets Manager
# - Azure Key Vault
```

### 4. Regular Security Updates

```bash
# Enable automatic security updates (Ubuntu)
apt-get install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# Check all services
curl https://api.nilecare.sd/health
curl https://api.nilecare.sd/api/auth/health
curl https://api.nilecare.sd/api/appointments/health
```

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 https://api.nilecare.sd/api/patients
```

### Security Scan

```bash
# SSL Labs Test
# Visit: https://www.ssllabs.com/ssltest/

# OWASP ZAP Scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://nilecare.sd
```

---

## 🔄 Zero-Downtime Deployment

### Blue-Green Deployment Strategy

```bash
# Deploy to green environment
kubectl set image deployment/business-service business-service=nilecare/business-service:2.1.0

# Wait for rollout
kubectl rollout status deployment/business-service

# If issues occur, rollback
kubectl rollout undo deployment/business-service
```

---

## 📞 Support

For deployment support:

- 📧 Email: devops@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd/deployment
- 🆘 Emergency Hotline: +249-XXX-XXXX

---

**Deployment Checklist Complete ✅**


