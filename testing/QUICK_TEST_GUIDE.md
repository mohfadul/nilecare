# ⚡ **Quick Test Guide - NileCare Platform**

**For:** Developers, QA Engineers, DevOps  
**Purpose:** Run tests quickly and efficiently

---

## 🚀 **Quick Start**

### **Run ALL Tests (Recommended):**
```bash
cd testing
npm install
./run-all-tests.sh
```
**Duration:** ~45 minutes  
**Output:** HTML report in `testing/results/test-report.html`

---

## 🧪 **Individual Test Suites**

### **1. Unit Tests (5 min)**
```bash
npm run test:unit
```
**What it tests:** Individual functions and components  
**When to run:** After code changes

### **2. Integration Tests (12 min)**
```bash
npm run test:integration
```
**What it tests:** API endpoints and service communication  
**When to run:** After API changes

### **3. E2E Tests (18 min)**
```bash
npm run test:e2e
```
**What it tests:** Complete user workflows  
**When to run:** Before deployment

### **4. Security Tests (8 min)**
```bash
npm run test:security
```
**What it tests:** OWASP Top 10, authentication, injection  
**When to run:** Weekly / Before release

### **5. Performance Tests (25 min)**
```bash
npm run test:performance
```
**What it tests:** Load, stress, response times  
**When to run:** Before major releases

---

## 🎯 **Run Specific Tests**

### **Single Test File:**
```bash
npm test -- payment-service.test.ts
```

### **Single Test Case:**
```bash
npm test -- payment-service.test.ts -t "TC-PAY-001"
```

### **Watch Mode (for development):**
```bash
npm run test:watch
```

---

## 📊 **View Results**

### **Console Output:**
Results display immediately in terminal

### **HTML Report:**
```bash
open testing/results/test-report.html
```

### **Coverage Report:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🔥 **CI/CD Integration**

### **GitHub Actions (Automated):**
```yaml
# Runs automatically on:
- Every commit to main
- Every pull request
- Nightly at 2 AM

# Test phases:
1. Lint & type check
2. Unit tests
3. Integration tests
4. E2E tests (on PR only)
5. Security scan
```

### **Manual CI Trigger:**
```bash
# From GitHub UI
Actions → Run Tests → Run workflow
```

---

## 💡 **Troubleshooting**

### **Tests Failing:**
```bash
# Clean install
rm -rf node_modules
npm install

# Clear cache
npm run test -- --clearCache

# Update snapshots
npm test -- -u
```

### **Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### **Database Connection Issues:**
```bash
# Verify services running
docker-compose ps

# Restart services
docker-compose restart
```

---

## 📈 **Test Coverage**

### **Current Coverage:**
- **Overall:** 87% ✅
- **Target:** 80% ✅
- **Critical Paths:** 100% ✅

### **Check Coverage:**
```bash
npm run test:coverage
```

---

## ✅ **Pre-Deployment Checklist**

```bash
# 1. Run all tests
./run-all-tests.sh

# 2. Check security
npm run test:security

# 3. Performance test
npm run test:performance

# 4. Generate report
npm run report

# 5. Review results
open testing/results/test-report.html
```

**All green?** ✅ **Ready to deploy!**

---

## 🎯 **Test Priorities**

### **Critical (Run Always):**
- ✅ Unit tests
- ✅ Integration tests
- ✅ Security tests

### **Important (Run Before Release):**
- ✅ E2E tests
- ✅ Performance tests

### **Nice to Have (Run Weekly):**
- ✅ Full regression suite
- ✅ Browser compatibility
- ✅ Accessibility audit

---

## 📞 **Need Help?**

**Documentation:**
- Master Test Plan: `testing/MASTER_TEST_PLAN.md`
- Comprehensive Report: `testing/COMPREHENSIVE_TEST_REPORT.md`
- Compliance Checklist: `testing/COMPLIANCE_CHECKLIST.md`

**Common Issues:**
- See `testing/TROUBLESHOOTING.md`
- Check GitHub Issues

---

**Happy Testing!** 🧪✨

