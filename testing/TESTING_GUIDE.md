# 🧪 NileCare Testing Guide

## Overview

This comprehensive testing suite validates that the NileCare platform **ACTUALLY WORKS**, not just looks like it works. It tests real connections, real business logic, and real performance.

## 📍 Test Suite Location

```
testing/
├── integration/          # Main integration test suite
│   ├── __tests__/       # All test files
│   ├── scripts/         # Helper scripts
│   ├── load-tests/      # Load testing configs
│   └── README.md        # Detailed documentation
└── TESTING_GUIDE.md     # This file
```

## 🎯 What Gets Tested

### 1. End-to-End Connections ✅
Every single API endpoint is tested to ensure it:
- Returns appropriate status codes (200, 201, 400, 401, 404)
- **NEVER returns 500** (server errors)
- Handles authentication correctly
- Validates input properly
- Returns expected data structures

**Tests:** `__tests__/e2e/api-endpoints.test.ts`

### 2. Database CRUD Operations ✅
All database models are tested for:
- **Create:** Insert new records successfully
- **Read:** Retrieve records with proper filtering
- **Update:** Modify existing records
- **Delete:** Remove records and verify deletion
- **Transactions:** Handle multi-step operations
- **Query Performance:** Execute within thresholds

**Tests:** `__tests__/database/crud-operations.test.ts`

### 3. Authentication & Authorization ✅
Complete authentication flows tested:
- User registration (with validation)
- Login/logout flows
- Token generation and validation
- Token refresh mechanisms
- Role-based access control (RBAC)
- Session management
- Password reset flows
- Security headers and CORS

**Tests:** `__tests__/auth/authentication-flows.test.ts`

### 4. Business Logic Validation ✅
Healthcare-specific workflows tested:
- **Patient Management:**
  - Registration with medical history
  - Age calculation
  - Duplicate prevention
  - Phone number validation (Sudan format)
  
- **Appointment Scheduling:**
  - Double-booking prevention
  - Past date validation
  - Duration validation
  - Cancellation handling
  
- **Lab Orders:**
  - Test type validation
  - Status transitions
  - Priority handling (urgent vs normal)
  
- **Prescriptions:**
  - Dosage format validation
  - Drug interaction checking
  - Duration validation
  
- **Payment Processing:**
  - Amount calculation
  - Multi-currency support
  - Negative amount rejection
  - Refund handling

**Tests:** `__tests__/business-logic/healthcare-workflows.test.ts`

### 5. Performance & Load Testing ✅
System performance validated:
- **Response Times:**
  - Health checks: < 100ms
  - Authentication: < 1000ms
  - API requests: < 500ms
  - Database queries: < 100ms

- **Concurrent Requests:**
  - 20 concurrent GET requests
  - 10 concurrent POST requests
  - Mixed request types
  
- **Memory Leak Detection:**
  - Repeated API calls don't accumulate memory
  - Database connections are properly released
  
- **Load Testing:**
  - Sustained load (5 req/sec for 10 seconds)
  - Peak load handling
  - Cache effectiveness

**Tests:** `__tests__/performance/response-times.test.ts` + `load-tests/`

### 6. Edge Cases & Error Handling ✅
Comprehensive edge case testing:
- Very long inputs (500+ characters)
- Special characters and SQL injection attempts
- Arabic text handling
- Concurrent race conditions
- Null and undefined values
- Invalid JSON
- Missing authentication
- Malformed requests

## 🚀 Quick Start

### 1. Navigate to Test Directory
```bash
cd testing/integration
```

### 2. Setup Environment
```bash
# Windows
.\scripts\setup-test-env.ps1

# Linux/Mac
chmod +x scripts/setup-test-env.sh
./scripts/setup-test-env.sh
```

### 3. Start Services
```bash
# In project root
npm run dev

# Or use Docker
docker-compose up -d
```

### 4. Run Tests
```bash
# Check services are running
npm run test:health

# Run all tests
npm test

# Run specific test suites
npm run test:e2e          # API endpoint tests
npm run test:db           # Database tests
npm run test:auth         # Authentication tests
npm run test:performance  # Performance tests
npm run test:load         # Load tests
```

## 📊 Understanding Results

### Success Criteria
All tests should pass with:
- ✅ 0 failed tests
- ✅ All API endpoints return appropriate status codes
- ✅ No 500 errors anywhere
- ✅ Response times within thresholds
- ✅ All CRUD operations work
- ✅ Authentication flows complete
- ✅ Business logic validates correctly

### Example Output
```
PASS  __tests__/e2e/api-endpoints.test.ts (45.234s)
  E2E API Endpoint Tests
    Authentication Service Endpoints
      ✓ POST /api/auth/login - should return 200 or 401, not 500 (145ms)
      ✓ POST /api/auth/register - should return 201, 400, or 409, not 500 (98ms)
      ✓ GET /api/auth/me - should return 200 or 401, not 500 (67ms)
    Patient Management Endpoints
      ✓ GET /api/patients - should return 200 or 401, not 500 (89ms)
      ✓ POST /api/patients - should return 201, 400, or 401, not 500 (156ms)
      ✓ GET /api/patients/:id - should return 200, 404, or 401, not 500 (78ms)

Performance Metrics:
  Login - Avg: 145ms, Max: 198ms ✅
  Patient list - Avg: 89ms, Max: 124ms ✅
  
Test Suites: 5 passed, 5 total
Tests:       127 passed, 127 total
Time:        2m 15s
```

## 🔧 Configuration

### Environment Variables (`.env.test`)
```bash
# Service URLs
API_GATEWAY_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
# ... other services

# Database
POSTGRES_HOST=localhost
POSTGRES_DB=nilecare_test
MONGO_URI=mongodb://localhost:27017/nilecare_test
REDIS_URL=redis://localhost:6379

# Test Users
TEST_ADMIN_EMAIL=admin@test.nilecare.com
TEST_ADMIN_PASSWORD=TestAdmin123!

# Performance Thresholds
API_RESPONSE_THRESHOLD=500  # milliseconds
DB_QUERY_THRESHOLD=100      # milliseconds
AUTH_FLOW_THRESHOLD=1000    # milliseconds
```

### Adjusting Thresholds
If your environment is slower, adjust thresholds in `.env.test`:
```bash
# For slower systems
API_RESPONSE_THRESHOLD=1000
DB_QUERY_THRESHOLD=200
AUTH_FLOW_THRESHOLD=2000
```

## 🐛 Troubleshooting

### Services Not Running
```bash
❌ Some services are not healthy
```
**Fix:** `npm run dev` in project root

### Database Connection Failed
```bash
error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix:** `docker-compose up -d postgres`

### Authentication Errors
```bash
401 Unauthorized in tests
```
**Fix:** Check test user exists, verify credentials in `.env.test`

### Slow Tests / Timeouts
```bash
Timeout of 30000ms exceeded
```
**Fix:**
- Increase timeout in `jest.config`
- Check system resources
- Verify database indexes exist

### Port Already in Use
```bash
Error: listen EADDRINUSE :::3000
```
**Fix:** Stop conflicting services or change ports in `.env.test`

## 📈 Performance Benchmarks

Expected results on a modern development machine:

| Test Type | Count | Duration | Pass Criteria |
|-----------|-------|----------|---------------|
| API Endpoint Tests | 40+ | ~45s | 100% pass |
| Database CRUD Tests | 25+ | ~15s | 100% pass |
| Auth Flow Tests | 30+ | ~30s | 100% pass |
| Business Logic Tests | 35+ | ~40s | 100% pass |
| Performance Tests | 15+ | ~60s | All within thresholds |
| **Total** | **~150** | **~3-4 min** | **0 failures** |

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd testing/integration
          npm install
      
      - name: Run tests
        run: |
          cd testing/integration
          npm test
```

## 📝 Adding New Tests

### 1. Create Test File
```typescript
// __tests__/your-feature/feature.test.ts
import { TEST_CONFIG } from '../setup';
import axios from 'axios';

describe('Your Feature', () => {
  let apiClient = axios.create({
    baseURL: TEST_CONFIG.apiGatewayUrl,
  });

  test('should work correctly', async () => {
    const response = await apiClient.get('/api/your-endpoint');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('expectedField');
  });
});
```

### 2. Test Real Behavior
- Don't mock unless absolutely necessary
- Test actual HTTP requests
- Verify database state
- Check for edge cases
- Measure performance

### 3. Follow Naming Convention
- `feature.test.ts` - Main feature tests
- `feature-edge-cases.test.ts` - Edge case tests
- `feature-performance.test.ts` - Performance tests

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All integration tests pass (0 failures)
- [ ] No 500 errors in any endpoint
- [ ] All response times within thresholds
- [ ] Database queries optimized
- [ ] Authentication flows work correctly
- [ ] Business logic validates properly
- [ ] Load tests show acceptable performance
- [ ] No memory leaks detected
- [ ] Edge cases handled gracefully
- [ ] Coverage above 60%

## 📚 Additional Resources

- [Detailed Test Documentation](./integration/README.md)
- [Quick Start Guide](./integration/RUN_TESTS.md)
- [Jest Documentation](https://jestjs.io/)
- [Artillery Load Testing](https://www.artillery.io/)

## 🤝 Contributing

When adding features:
1. Write integration tests first (TDD)
2. Ensure tests prove functionality works
3. Test edge cases and error conditions
4. Measure performance impact
5. Update documentation

---

## Summary

This test suite ensures:
- ✅ **Endpoints work** - Returns correct status codes
- ✅ **Database works** - CRUD operations succeed
- ✅ **Auth works** - Complete flows validated
- ✅ **Logic works** - Business rules enforced
- ✅ **Performance acceptable** - Fast response times
- ✅ **System stable** - No memory leaks

**Run tests before every deployment to ensure the platform ACTUALLY WORKS!**

