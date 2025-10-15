#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# NileCare Authentication Integration Setup Script
# ═══════════════════════════════════════════════════════════════════════════
#
# This script configures all microservices with proper authentication settings.
# It generates secure API keys and creates .env files for each service.
#
# Usage: bash setup-auth-integration.sh
#
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  NileCare Authentication Integration Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Generate API keys
echo -e "${YELLOW}Generating secure API keys...${NC}"
APPOINTMENT_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
BUSINESS_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
PAYMENT_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MAIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CLINICAL_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo -e "${GREEN}✓ Generated 5 unique API keys${NC}"
echo ""

# Create Auth Service .env
echo -e "${YELLOW}Configuring Auth Service...${NC}"
cat > microservices/auth-service/.env << EOF
NODE_ENV=development
PORT=7020

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# JWT Secrets (change in production!)
JWT_SECRET=nilecare-jwt-secret-change-in-production-min-32-characters-required
JWT_REFRESH_SECRET=nilecare-refresh-secret-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Session & MFA
SESSION_SECRET=nilecare-session-secret-change-in-production-min-32-chars
MFA_ENCRYPTION_KEY=nilecare-mfa-encryption-key-change-in-production-64-chars

# Service API Keys
SERVICE_API_KEYS=${APPOINTMENT_KEY},${BUSINESS_KEY},${PAYMENT_KEY},${MAIN_KEY},${CLINICAL_KEY}

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true
EOF

echo -e "${GREEN}✓ Auth Service configured${NC}"

# Create Appointment Service .env
echo -e "${YELLOW}Configuring Appointment Service...${NC}"
cat > microservices/appointment-service/.env << EOF
NODE_ENV=development
PORT=7040
SERVICE_NAME=appointment-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=${APPOINTMENT_KEY}

# Database
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

# Logging
LOG_LEVEL=info
LOG_AUTH=true
EOF

echo -e "${GREEN}✓ Appointment Service configured${NC}"

# Create Business Service .env
echo -e "${YELLOW}Configuring Business Service...${NC}"
cat > microservices/business/.env << EOF
NODE_ENV=development
PORT=7010
SERVICE_NAME=business-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=${BUSINESS_KEY}

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CLIENT_URL=http://localhost:5173

# Multi-tenancy
MULTI_TENANT_ENABLED=false
DEFAULT_ORGANIZATION_ID=default-org

# Logging
LOG_LEVEL=info
LOG_AUTH=true
EOF

echo -e "${GREEN}✓ Business Service configured${NC}"

# Create Payment Gateway .env
echo -e "${YELLOW}Configuring Payment Gateway Service...${NC}"
cat > microservices/payment-gateway-service/.env << EOF
NODE_ENV=development
PORT=7030
SERVICE_NAME=payment-gateway-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=${PAYMENT_KEY}

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

# Logging
LOG_LEVEL=info
LOG_AUTH=true
EOF

echo -e "${GREEN}✓ Payment Gateway Service configured${NC}"

# Create Main NileCare .env
echo -e "${YELLOW}Configuring Main NileCare Service...${NC}"
cat > microservices/main-nilecare/.env << EOF
NODE_ENV=development
PORT=7000
SERVICE_NAME=main-nilecare-service

# Authentication
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=${MAIN_KEY}

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nilecare
DB_USER=root
DB_PASSWORD=

# Service URLs
PAYMENT_SERVICE_URL=http://localhost:7030
BUSINESS_SERVICE_URL=http://localhost:7010
APPOINTMENT_SERVICE_URL=http://localhost:7040

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_AUTH=true
EOF

echo -e "${GREEN}✓ Main NileCare Service configured${NC}"

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Configuration Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Services configured:"
echo "  ✓ auth-service (port 7020)"
echo "  ✓ appointment-service (port 7040)"
echo "  ✓ business-service (port 7010)"
echo "  ✓ payment-gateway-service (port 7030)"
echo "  ✓ main-nilecare-service (port 7000)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Start Auth Service first:"
echo "     cd microservices/auth-service && npm run dev"
echo ""
echo "  2. Start other services in new terminals:"
echo "     cd microservices/appointment-service && npm run dev"
echo "     cd microservices/business && npm run dev"
echo "     cd microservices/payment-gateway-service && npm run dev"
echo "     cd microservices/main-nilecare && npm run dev"
echo ""
echo "  3. Run integration tests:"
echo "     bash TEST_AUTH_INTEGRATION.sh"
echo ""
echo -e "${GREEN}🎉 Ready to start services!${NC}"

