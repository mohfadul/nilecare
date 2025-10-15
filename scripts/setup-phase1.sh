#!/bin/bash

# ============================================================================
# NileCare Phase 1 Setup Script
# Version: 1.0.0
# Description: Automated setup for Phase 1 database migration
# Date: 2025-10-15
# ============================================================================

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       NileCare Phase 1: Database Migration Setup              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Check Prerequisites
# ============================================================================
echo "📋 Step 1: Checking prerequisites..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed${NC}"
    echo "Please install MySQL 8.0+ first"
    exit 1
fi
echo -e "${GREEN}✅ MySQL is installed${NC}"

# Check if Flyway is installed
if ! command -v flyway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Flyway is not installed${NC}"
    echo "Installing Flyway..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install flyway
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.16.0/flyway-commandline-9.16.0-linux-x64.tar.gz | tar xvz
        sudo ln -s $(pwd)/flyway-9.16.0/flyway /usr/local/bin
    fi
    echo -e "${GREEN}✅ Flyway installed${NC}"
else
    echo -e "${GREEN}✅ Flyway is installed${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js is installed ($(node -v))${NC}"

echo ""

# ============================================================================
# 2. Create Databases
# ============================================================================
echo "🗄️  Step 2: Creating service databases..."

read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

mysql -u root -p"$MYSQL_ROOT_PASSWORD" < database/create-service-databases.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service databases created${NC}"
else
    echo -e "${RED}❌ Failed to create databases${NC}"
    exit 1
fi

echo ""

# ============================================================================
# 3. Create Database Users
# ============================================================================
echo "👤 Step 3: Creating service database users..."

mysql -u root -p"$MYSQL_ROOT_PASSWORD" < database/create-service-users.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Service users created${NC}"
else
    echo -e "${RED}❌ Failed to create users${NC}"
    exit 1
fi

echo ""

# ============================================================================
# 4. Install NPM Dependencies
# ============================================================================
echo "📦 Step 4: Installing NPM dependencies..."

services=("auth-service" "billing-service" "payment-gateway-service")

for service in "${services[@]}"; do
    echo "Installing dependencies for $service..."
    cd "microservices/$service"
    npm install --save-dev node-flyway
    cd ../../
    echo -e "${GREEN}✅ Dependencies installed for $service${NC}"
done

echo ""

# ============================================================================
# 5. Run Migrations
# ============================================================================
echo "🚀 Step 5: Running database migrations..."

for service in "${services[@]}"; do
    echo "Running migrations for $service..."
    cd "microservices/$service"
    
    # Set environment variables for migration
    export DB_USER="${service//-/_}"
    export DB_PASSWORD="$(echo $service | sed 's/-/_/g' | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2)) "_Service_P@ssw0rd_2025!"}')"
    export ENVIRONMENT="development"
    export USER="$(whoami)"
    
    npm run migrate:up
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations completed for $service${NC}"
    else
        echo -e "${RED}❌ Migration failed for $service${NC}"
    fi
    
    cd ../../
done

echo ""

# ============================================================================
# 6. Verify Setup
# ============================================================================
echo "🔍 Step 6: Verifying setup..."

for service in "${services[@]}"; do
    cd "microservices/$service"
    npm run migrate:info
    cd ../../
done

echo ""

# ============================================================================
# Success!
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              🎉 Phase 1 Setup Complete! 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Databases created:"
echo "   • nilecare_auth"
echo "   • nilecare_billing"
echo "   • nilecare_payment"
echo ""
echo "✅ Service users created with permissions"
echo "✅ Migrations completed successfully"
echo ""
echo "📚 Next Steps:"
echo "   1. Update service .env files with new database names"
echo "   2. Test service connections"
echo "   3. Review PHASE1_IMPLEMENTATION_GUIDE.md"
echo ""
echo "🔐 Security Reminder:"
echo "   • Change all database passwords in production"
echo "   • Use secrets manager for credential storage"
echo "   • Review database/service-credentials.md"
echo ""

