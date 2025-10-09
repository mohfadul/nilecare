# NileCare Integration Test Suite

Comprehensive end-to-end testing suite that validates the entire NileCare healthcare platform.

## 🎯 What This Test Suite Validates

### 1. **End-to-End Connections**
- ✅ Every API endpoint returns appropriate status codes (200/201/404, not 500)
- ✅ Database models can Create, Read, Update, Delete successfully
- ✅ External API integrations work correctly
- ✅ Authentication flows complete successfully

### 2. **Business Logic**
- ✅ Core healthcare functionality works as specified
- ✅ Edge cases are handled properly
- ✅ Error conditions are tested thoroughly
- ✅ Data validation works correctly

### 3. **Performance**
- ✅ Response times under acceptable limits
- ✅ No memory leaks in critical paths
- ✅ Database queries are optimized
- ✅ System handles concurrent requests

## 📋 Prerequisites

Before running tests, ensure:

1. **Services are running:**
   ```bash
   # Backend services
   npm run dev  # In project root
   
   # Frontend
   cd clients/web-dashboard && npm run dev
   
   # Database
   docker-compose up -d
   ```

2. **Environment variables configured:**
   - Copy `.env.test` and update with your local configuration
   - Ensure test database is set up and accessible

3. **Dependencies installed:**
   ```bash
   cd testing/integration
   npm install
   ```

## 🚀 Running Tests

### Check Service Health
Before running tests, verify all services are up:
```bash
npm run test:health
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites

**End-to-End API Tests:**
```bash
npm run test:e2e
```

**Database CRUD Tests:**
```bash
npm run test:db
```

**Authentication Flow Tests:**
```bash
npm run test:auth
```

**Performance Tests:**
```bash
npm run test:performance
```

**Load Tests:**
```bash
npm run test:load
```

**With Coverage:**
```bash
npm run test:all
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## 📊 Test Structure

```
testing/integration/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── e2e/
│   │   └── api-endpoints.test.ts   # E2E API endpoint tests
│   ├── database/
│   │   └── crud-operations.test.ts # Database CRUD tests
│   ├── auth/
│   │   └── authentication-flows.test.ts # Auth flow tests
│   ├── business-logic/
│   │   └── healthcare-workflows.test.ts # Business logic tests
│   └── performance/
│       └── response-times.test.ts  # Performance tests
├── scripts/
│   └── health-check.js            # Service health checker
├── load-tests/
│   ├── basic-load.yml             # Artillery load test config
│   └── load-test-processor.js     # Load test helpers
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 Test Examples

### API Endpoint Test
```typescript
test('GET /api/patients - should return 200 or 401, not 500', async () => {
  const response = await apiClient.get('/api/patients', {
    headers: headers(),
  });

  expect([200, 401, 403]).toContain(response.status);
  expect(response.status).not.toBe(500);
});
```

### Database CRUD Test
```typescript
test('CREATE - should insert a new patient record', async () => {
  const result = await pgPool.query(
    `INSERT INTO patients (first_name, last_name, email)
     VALUES ($1, $2, $3) RETURNING *`,
    ['Ahmed', 'Hassan', 'ahmed@test.com']
  );

  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].first_name).toBe('Ahmed');
});
```

### Performance Test
```typescript
test('Patient list should respond under 500ms', async () => {
  const startTime = Date.now();
  await apiClient.get('/api/patients?limit=20');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(500);
});
```

## 🔍 Understanding Test Results

### Success Indicators
- ✅ All endpoints return appropriate status codes
- ✅ No 500 errors (server errors)
- ✅ Response times within thresholds
- ✅ Database operations complete successfully
- ✅ Authentication flows work end-to-end

### Common Issues

**Services Not Running:**
```
❌ Some services are not healthy
```
**Solution:** Run `npm run dev` in project root

**Database Connection Failed:**
```
error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Start database with `docker-compose up -d`

**Authentication Failed:**
```
Test user credentials not working
```
**Solution:** Update `.env.test` with valid test user credentials

**Timeout Errors:**
```
Timeout of 30000ms exceeded
```
**Solution:** Check if services are overloaded or need more resources

## 📈 Performance Benchmarks

Expected performance thresholds:

| Operation | Target | Maximum |
|-----------|--------|---------|
| Health check | < 100ms | < 200ms |
| Authentication | < 1000ms | < 2000ms |
| API GET request | < 500ms | < 1000ms |
| API POST request | < 500ms | < 1000ms |
| Database query | < 100ms | < 200ms |
| Database transaction | < 200ms | < 500ms |

## 🧪 Writing New Tests

### 1. Create Test File
```typescript
// __tests__/your-feature/your-test.test.ts
import { TEST_CONFIG } from '../setup';

describe('Your Feature', () => {
  test('should do something', async () => {
    // Your test code
  });
});
```

### 2. Follow Test Structure
- **Arrange:** Set up test data
- **Act:** Execute the operation
- **Assert:** Verify the results

### 3. Test Real Behavior
- Don't mock unless necessary
- Test actual API responses
- Verify database state changes
- Check for edge cases

### 4. Performance Aware
```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
expect(duration).toBeLessThan(threshold);
```

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="your test name"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Coverage Reports

Generate coverage report:
```bash
npm run test:all
```

View coverage report:
```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Integration Tests
  run: |
    npm run test:health
    npm run test:all
  env:
    API_GATEWAY_URL: ${{ secrets.API_GATEWAY_URL }}
    POSTGRES_HOST: localhost
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [Artillery Load Testing](https://www.artillery.io/docs)
- [NileCare API Documentation](../../README.md)

## 🤝 Contributing

When adding new features, please:
1. Add corresponding integration tests
2. Ensure all tests pass
3. Maintain >60% coverage
4. Document any new test utilities

## 📞 Support

If tests fail:
1. Check service health: `npm run test:health`
2. Review test logs for specific errors
3. Verify environment configuration
4. Check database connectivity
5. Ensure all dependencies are installed

## ✅ Test Checklist

Before deploying to production, ensure:

- [ ] All integration tests pass
- [ ] No 500 errors in any endpoint
- [ ] Performance tests meet thresholds
- [ ] Database queries are optimized
- [ ] Authentication flows work correctly
- [ ] Load tests show acceptable performance
- [ ] No memory leaks detected
- [ ] Edge cases are handled
- [ ] Error messages are user-friendly
- [ ] Coverage is above 60%

---

**Last Updated:** $(date)
**Maintained by:** NileCare Development Team

