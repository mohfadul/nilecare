# 🚀 Quick Start: Running NileCare Tests

## Step 1: Install Dependencies

```bash
cd testing/integration
npm install
```

## Step 2: Configure Environment

Create or update `.env.test`:
```bash
# Service URLs (update if different)
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
CLINICAL_SERVICE_URL=http://localhost:3002
BUSINESS_SERVICE_URL=http://localhost:3003
DATA_SERVICE_URL=http://localhost:3004

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nilecare_test
POSTGRES_USER=nilecare_test
POSTGRES_PASSWORD=test_password

MONGO_URI=mongodb://localhost:27017/nilecare_test
REDIS_URL=redis://localhost:6379

# Test Users
TEST_ADMIN_EMAIL=admin@test.nilecare.com
TEST_ADMIN_PASSWORD=TestAdmin123!
```

## Step 3: Start Services

### Option A: Using Docker (Recommended)
```bash
cd ../../  # Go to project root
docker-compose up -d
```

### Option B: Manual Start
```bash
# Terminal 1: Backend services
cd ../../  # Go to project root
npm run dev

# Terminal 2: Frontend
cd clients/web-dashboard
npm run dev

# Terminal 3: Database
docker-compose up -d postgres mongodb redis
```

## Step 4: Verify Services Are Running

```bash
npm run test:health
```

You should see:
```
✅ UP API Gateway (http://localhost:3000)
✅ UP Auth Service (http://localhost:3001)
✅ UP Clinical Service (http://localhost:3002)
...
✅ All services are healthy! Ready to run tests.
```

## Step 5: Run Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites

```bash
# API endpoint tests (fastest)
npm run test:e2e

# Database tests
npm run test:db

# Authentication tests
npm run test:auth

# Business logic tests
npm test -- --testPathPattern=business-logic

# Performance tests (slowest)
npm run test:performance

# Load tests
npm run test:load
```

## Step 6: View Results

Tests will output:
- ✅ Passed tests in green
- ❌ Failed tests in red
- Performance metrics
- Coverage statistics

### Example Output:
```
PASS  __tests__/e2e/api-endpoints.test.ts
  ✓ POST /api/auth/login - should return 200 or 401, not 500 (145ms)
  ✓ GET /api/patients - should return 200 or 401, not 500 (89ms)
  ✓ POST /api/appointments - should return 201, 400, or 401, not 500 (156ms)

Performance Metrics:
  Login - Avg: 145ms, Max: 198ms
  Patient list - Avg: 89ms, Max: 124ms

Test Suites: 1 passed, 1 total
Tests:       42 passed, 42 total
Time:        45.234s
```

## Troubleshooting

### "Services Not Healthy"
```bash
# Check if services are running
docker ps  # or
netstat -an | findstr "3000 3001 3002"

# Restart services
docker-compose restart
```

### "Database Connection Failed"
```bash
# Check database is running
docker ps | grep postgres

# Restart database
docker-compose restart postgres

# Check connection
psql -h localhost -U nilecare_test -d nilecare_test
```

### "Authentication Failed"
- Ensure test users exist in database
- Verify credentials in `.env.test`
- Check auth service logs

### "Tests Timeout"
- Increase timeout in `jest.config` if services are slow
- Check system resources (CPU/Memory)
- Reduce concurrent test execution

## What Gets Tested?

✅ **ALL API Endpoints** - Every endpoint tested for proper status codes  
✅ **Database Operations** - CRUD operations on all models  
✅ **Authentication** - Login, logout, token validation, RBAC  
✅ **Business Logic** - Patient registration, appointments, prescriptions, payments  
✅ **Performance** - Response times, concurrent requests, query optimization  
✅ **Memory Leaks** - Connection pools, memory usage  
✅ **Edge Cases** - Invalid inputs, special characters, boundary conditions  

## Next Steps

- Review failed tests in detail
- Check coverage report: `coverage/lcov-report/index.html`
- Add tests for new features
- Run tests before committing code

## Need Help?

1. Check logs: `docker-compose logs [service-name]`
2. Review test output for specific errors
3. Ensure all dependencies are installed
4. Verify environment variables are correct
5. Check firewall/network settings

---

**Ready to deploy?** All tests should pass with 0 failures before deploying to production!

