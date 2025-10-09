# 🚀 Test Suite Quick Reference

## One-Command Setup & Run

```bash
# Navigate to test directory
cd testing/integration

# Install dependencies (first time only)
npm install

# Check if services are running
npm run test:health

# Run all tests
npm test
```

## 📊 Test Commands

| Command | What It Does | Time |
|---------|-------------|------|
| `npm test` | Run all integration tests | ~3-4 min |
| `npm run test:health` | Check if services are running | ~5 sec |
| `npm run test:e2e` | API endpoint tests only | ~45 sec |
| `npm run test:db` | Database CRUD tests only | ~15 sec |
| `npm run test:auth` | Authentication tests only | ~30 sec |
| `npm run test:performance` | Performance tests only | ~60 sec |
| `npm run test:load` | Load/stress tests | ~4 min |
| `npm run test:all` | All tests + coverage report | ~4 min |
| `npm run test:watch` | Watch mode for development | - |

## 🎯 What Gets Tested

✅ **150+ Tests** covering:
- 40+ API endpoint tests → Every endpoint works, no 500 errors
- 25+ Database CRUD tests → All models can Create/Read/Update/Delete
- 30+ Authentication tests → Login/logout/tokens/RBAC all work
- 35+ Business logic tests → Healthcare workflows validated
- 15+ Performance tests → Response times under thresholds
- 5 Load test scenarios → System handles concurrent users

## 📁 File Structure

```
testing/
├── integration/
│   ├── __tests__/
│   │   ├── e2e/api-endpoints.test.ts          ← API tests
│   │   ├── database/crud-operations.test.ts   ← DB tests
│   │   ├── auth/authentication-flows.test.ts  ← Auth tests
│   │   ├── business-logic/healthcare-workflows.test.ts ← Logic tests
│   │   └── performance/response-times.test.ts ← Perf tests
│   ├── scripts/health-check.js                ← Service checker
│   ├── load-tests/basic-load.yml              ← Load tests
│   ├── package.json                           ← Dependencies
│   ├── .env.test                              ← Configuration
│   └── README.md                              ← Full docs
├── TESTING_GUIDE.md                           ← Complete guide
├── TEST_SUITE_COMPLETE.md                     ← Summary
└── QUICK_REFERENCE.md                         ← This file
```

## ⚙️ Configuration (.env.test)

```bash
# Services (update if using different ports)
API_GATEWAY_URL=http://localhost:3000

# Database (update for your setup)
POSTGRES_HOST=localhost
POSTGRES_DB=nilecare_test

# Test user credentials
TEST_ADMIN_EMAIL=admin@test.nilecare.com
TEST_ADMIN_PASSWORD=TestAdmin123!

# Performance thresholds (milliseconds)
API_RESPONSE_THRESHOLD=500
DB_QUERY_THRESHOLD=100
AUTH_FLOW_THRESHOLD=1000
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Services not healthy" | `npm run dev` in project root |
| "Database connection failed" | `docker-compose up -d` |
| "Authentication failed" | Check test user exists in DB |
| "Tests timeout" | Increase timeout in jest.config |
| "Port already in use" | Stop conflicting service or change port |

## ✅ Success Criteria

All tests should:
- ✅ Pass with 0 failures
- ✅ Complete in 3-4 minutes
- ✅ Show no 500 errors
- ✅ Meet all performance thresholds
- ✅ Handle all edge cases

## 📊 Performance Thresholds

| Operation | Target | Maximum |
|-----------|--------|---------|
| Health check | < 100ms | < 200ms |
| Login | < 1000ms | < 2000ms |
| API GET | < 500ms | < 1000ms |
| API POST | < 500ms | < 1000ms |
| DB query | < 100ms | < 200ms |

## 🎓 Key Features

1. **Real Tests** - Actual HTTP/DB operations, not mocks
2. **Comprehensive** - Every critical path covered
3. **Fast** - All tests in ~4 minutes
4. **Easy** - Simple npm commands
5. **Documented** - Clear guides and examples

## 📚 Documentation Links

- **Quick Start:** [`RUN_TESTS.md`](./integration/RUN_TESTS.md)
- **Full Guide:** [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)
- **Detailed Docs:** [`integration/README.md`](./integration/README.md)
- **Summary:** [`TEST_SUITE_COMPLETE.md`](./TEST_SUITE_COMPLETE.md)

## 🚀 Pre-Deployment

Before deploying:
```bash
cd testing/integration
npm run test:health    # ✅ Services running
npm run test:all       # ✅ All tests pass
# Review coverage report
```

## 💡 Tips

- Run `test:health` before running tests
- Use `test:watch` during development
- Check coverage report after `test:all`
- Update `.env.test` for your environment
- Add tests when adding features

---

**Ready to test?** `cd testing/integration && npm test`

**Tests prove your code ACTUALLY works! 🎯**

