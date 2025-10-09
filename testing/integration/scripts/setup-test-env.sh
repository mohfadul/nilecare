#!/bin/bash

# Setup Test Environment Script
# Prepares the test environment for running integration tests

set -e

echo "🔧 Setting up NileCare Test Environment..."
echo ""

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "📝 Creating .env.test file..."
    cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test

# Service URLs
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
CLINICAL_SERVICE_URL=http://localhost:3002
BUSINESS_SERVICE_URL=http://localhost:3003
DATA_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nilecare_test
POSTGRES_USER=nilecare_test
POSTGRES_PASSWORD=test_password

MONGO_URI=mongodb://localhost:27017/nilecare_test
REDIS_URL=redis://localhost:6379

# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.nilecare.com
TEST_ADMIN_PASSWORD=TestAdmin123!
TEST_DOCTOR_EMAIL=doctor@test.nilecare.com
TEST_DOCTOR_PASSWORD=TestDoctor123!
TEST_PATIENT_EMAIL=patient@test.nilecare.com
TEST_PATIENT_PASSWORD=TestPatient123!

# Performance Test Thresholds (ms)
API_RESPONSE_THRESHOLD=500
DB_QUERY_THRESHOLD=100
AUTH_FLOW_THRESHOLD=1000
EOF
    echo "✅ Created .env.test"
else
    echo "✅ .env.test already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Create test database if it doesn't exist
echo ""
echo "🗄️  Checking database..."
if command -v psql &> /dev/null; then
    PGPASSWORD=postgres psql -h localhost -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'nilecare_test'" | grep -q 1 || \
    PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE nilecare_test;" 2>/dev/null || \
    echo "⚠️  Could not create test database. Please create it manually."
    echo "✅ Database checked"
else
    echo "⚠️  psql not found. Please ensure PostgreSQL is installed."
fi

echo ""
echo "🏥 Running health check..."
node scripts/health-check.js || echo "⚠️  Some services are not running. Start them with: npm run dev"

echo ""
echo "✅ Test environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure all services are running: npm run dev (in project root)"
echo "  2. Run health check: npm run test:health"
echo "  3. Run tests: npm test"
echo ""

