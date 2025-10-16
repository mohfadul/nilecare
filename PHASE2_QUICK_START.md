# ⚡ PHASE 2 QUICK START GUIDE

**Phase:** Backend Fixes & Standardization  
**Duration:** 4 weeks (Weeks 3-6)  
**Current Status:** 🟢 **READY TO START**

---

## 🎯 WHAT IS PHASE 2?

Fix critical backend architectural issues and standardize all services.

### Already Done ✅
- ✅ **Fix #1:** Response Wrapper (100%)
- ✅ **Fix #2:** Database Removal from Orchestrator (100%)

### To Do This Phase 🎯
- 🟡 **Fix #3:** Auth Delegation (Week 3)
- ⏳ **Fix #4:** Audit Columns (Week 4)
- ⏳ **Fix #5:** Email Verification (Week 4)
- ⏳ **Fix #6:** Webhook Security (Week 5)
- ⏳ **Fix #7:** Remove Hardcoded Secrets (Week 3)
- ⏳ **Fix #8:** Separate Appointment DB (Week 5)
- ⏳ **Fix #9:** API Documentation (Week 6)
- ⏳ **Fix #10:** Correlation IDs (Already done ✅)

---

## 🚀 START NOW (5 Minutes)

### Step 1: Read the Plan (2 min)

📖 **[PHASE2_EXECUTION_PLAN.md](./PHASE2_EXECUTION_PLAN.md)** - Complete 4-week plan

### Step 2: Check Current Status (1 min)

```bash
cd C:\Users\pc\OneDrive\Desktop\NileCare

# See what's done
cat ✅_FIX_2_COMPLETE_DATABASE_REMOVAL.md

# See progress
cat BACKEND_FIXES_PROGRESS_TRACKER.md
```

### Step 3: Start Fix #3 (2 min)

```bash
# Create feature branch
git checkout -b fix/auth-delegation

# Start with Billing Service
cd microservices/billing-service
code .
```

---

## 📋 TODAY'S TASK: FIX #3 - AUTH DELEGATION

### What to Do (Day 1)

**Goal:** Remove local JWT validation from Billing Service

**Steps:**

1. **Review Current Implementation** (15 min)
   ```bash
   cd microservices/billing-service
   
   # Find auth middleware
   code src/middleware/auth.middleware.ts
   
   # Check if it's doing local JWT validation
   # Look for: jwt.verify(), jsonwebtoken, token validation
   ```

2. **Install Shared Middleware** (5 min)
   ```bash
   # If @nilecare/shared doesn't exist, create it first
   cd ../../shared
   npm init -y
   npm install express jsonwebtoken axios
   
   # Install in billing service
   cd ../microservices/billing-service
   npm install ../../shared
   ```

3. **Replace Local Auth with Shared** (30 min)
   ```typescript
   // OLD (Remove this):
   // src/middleware/auth.middleware.ts
   import jwt from 'jsonwebtoken';
   
   export function authMiddleware(req, res, next) {
     const token = req.headers.authorization?.split(' ')[1];
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     req.user = decoded;
     next();
   }
   
   // NEW (Use this):
   import { authMiddleware } from '@nilecare/shared/middleware';
   
   // In routes/index.ts
   router.use(authMiddleware);
   ```

4. **Test** (10 min)
   ```bash
   # Start Auth Service
   cd microservices/auth-service
   npm run dev
   
   # Start Billing Service
   cd ../billing-service
   npm run dev
   
   # Test
   curl -X POST http://localhost:7020/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password"}'
   
   # Get token from response, then:
   curl -X GET http://localhost:7050/api/v1/invoices \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Should work!
   ```

5. **Commit** (5 min)
   ```bash
   git add .
   git commit -m "fix(billing): delegate auth to Auth Service"
   git push origin fix/auth-delegation
   ```

**Time:** ~1 hour total

---

## 📅 THIS WEEK (WEEK 3)

### Monday-Tuesday: Fix #3 Auth Delegation
- ✅ Billing Service
- ⏳ Payment Gateway
- ⏳ Clinical Service
- ⏳ Test all services

### Wednesday-Friday: Fix #7 Remove Secrets
- ⏳ Audit all services for hardcoded values
- ⏳ Create .env.example files
- ⏳ Add startup validation
- ⏳ Update all services

**End of Week Goal:** 40% → 60% complete

---

## 🎯 QUICK WINS

### Easy Tasks (Can do in 1 hour)

1. **Create .env.example** for a service
   ```bash
   cd microservices/auth-service
   cp .env .env.example
   # Remove actual secrets, add placeholders
   ```

2. **Add startup validation** to a service
   ```typescript
   // src/index.ts
   import { validateEnv } from './config/validation';
   validateEnv(); // Add this line
   ```

3. **Document an API endpoint** with Swagger
   ```typescript
   /**
    * @swagger
    * /api/v1/invoices:
    *   get:
    *     summary: Get all invoices
    *     tags: [Billing]
    */
   router.get('/invoices', getInvoices);
   ```

---

## 📚 KEY DOCUMENTS

### Must Read (30 min total)
1. **[PHASE2_EXECUTION_PLAN.md](./PHASE2_EXECUTION_PLAN.md)** - Complete plan (15 min)
2. **[✅_FIX_2_COMPLETE_DATABASE_REMOVAL.md](./✅_FIX_2_COMPLETE_DATABASE_REMOVAL.md)** - What's done (10 min)
3. **[BACKEND_FIXES_PROGRESS_TRACKER.md](./BACKEND_FIXES_PROGRESS_TRACKER.md)** - Progress tracker (5 min)

### Reference
- **[ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)** - System architecture
- **[SERVICE_COMMUNICATION_PATTERNS.md](./SERVICE_COMMUNICATION_PATTERNS.md)** - How services talk
- **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** - Development guide

---

## 🛠️ DEVELOPMENT SETUP

### If Not Already Set Up

```bash
# 1. Start infrastructure
docker-compose up -d mysql postgres redis

# 2. Start Auth Service (needed by all)
cd microservices/auth-service
npm install
npm run dev

# 3. Start service you're working on
cd ../billing-service
npm install
npm run dev
```

### Verify Services Running

```bash
# Check Auth Service
curl http://localhost:7020/health

# Check Billing Service
curl http://localhost:7050/health
```

---

## ✅ DAILY CHECKLIST

### Every Morning
- [ ] Pull latest code: `git pull origin development`
- [ ] Check Slack for updates
- [ ] Review today's tasks in Phase 2 plan
- [ ] Start Docker services if needed

### Every Evening
- [ ] Commit your work
- [ ] Update progress tracker
- [ ] Post update in Slack #backend
- [ ] Plan tomorrow's tasks

---

## 🚨 GETTING STUCK?

### Common Issues

**Issue:** Service won't start
```bash
# Check if port is in use
netstat -ano | findstr :7050

# Kill process
taskkill /PID <PID> /F

# Restart service
npm run dev
```

**Issue:** Auth validation failing
```bash
# Check Auth Service is running
curl http://localhost:7020/health

# Check token is valid
curl http://localhost:7020/api/v1/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Issue:** Database connection error
```bash
# Check MySQL is running
docker ps | grep mysql

# Check connection string
echo $DB_HOST $DB_PORT $DB_NAME
```

### Get Help
- **Slack:** `#backend` channel
- **Docs:** Check `TROUBLESHOOTING.md`
- **Lead:** Ask your team lead
- **Pair:** Request pairing session

---

## 📊 TRACK YOUR PROGRESS

### Update Progress Tracker

```bash
# After completing a task, update:
code BACKEND_FIXES_PROGRESS_TRACKER.md

# Change status:
⏳ **PENDING** → 🟡 **IN PROGRESS** → ✅ **COMPLETED**
```

### Create Completion Document

```bash
# When you finish a fix:
code ✅_FIX_3_COMPLETE_AUTH_DELEGATION.md

# Document:
- What you did
- How it works now
- Test results
- Migration guide
```

---

## 🎉 CELEBRATE WINS

### After Each Fix
- Demo to team
- Update documentation
- Share in Slack
- Take a break!

### End of Week
- Team demo Friday afternoon
- Retrospective
- Plan next week

---

## 🚀 READY? LET'S GO!

```bash
# You got this! Start with:
cd microservices/billing-service
code src/middleware/auth.middleware.ts

# Make it happen! 💪
```

---

**Document Status:** ✅ Ready to Use  
**Last Updated:** October 16, 2025  
**Next Review:** End of Week 3

**🏁 START FIX #3 NOW! 🏁**

