# 🚀 HOW TO START THE ENTIRE NILECARE PLATFORM

**Quick Guide:** Start all services and see your platform in action!

---

## ⚡ QUICK START (RECOMMENDED)

### Option 1: Start Core Services Only (Fastest)

```powershell
# Run this script to start essential services
.\start-main-services.ps1

# Wait 30-60 seconds for services to start

# Then start frontend in another window
.\start-frontend.ps1

# Wait 10-15 seconds

# Open browser: http://localhost:5173 or http://localhost:3000
```

**This starts:**
- Main-NileCare (Orchestrator) - Port 7000
- Auth Service - Port 7020
- Clinical Service - Port 3004
- Appointment Service - Port 7040
- Billing Service - Port 7050
- **Frontend** - Port 5173 or 3000

**Time:** 1 minute to start, platform ready to use!

---

## 🔧 Option 2: Start ALL Microservices (Full Platform)

```powershell
# Run this script to start all 17 microservices
.\start-all-services.ps1

# Wait 1-2 minutes for all services to start

# Then start frontend
.\start-frontend.ps1

# Open browser: http://localhost:5173 or http://localhost:3000
```

**This starts ALL 17 services:**
1. Main-NileCare (7000) - Orchestrator ⭐ CRITICAL
2. Auth Service (7020) - Authentication ⭐ CRITICAL
3. Business Service (7010)
4. Clinical Service (3004)
5. Appointment Service (7040)
6. Billing Service (7050)
7. Payment Gateway (7030)
8. Lab Service (7060)
9. Medication Service (7070)
10. Inventory Service (7080)
11. Facility Service (7090)
12. Notification Service (7100)
13. CDS Service (7110)
14. HL7/FHIR Service (7120)
15. Device Integration (7130)
16. WebSocket Service (7140)
17. API Gateway (8080)
18. **Frontend** (5173 or 3000)

**Time:** 2-3 minutes to start, full platform operational!

---

## 🎯 Manual Start (Individual Services)

### Core Services (Minimum Required)

**Terminal 1: Main-NileCare (REQUIRED)**
```powershell
cd microservices\main-nilecare
npm run dev
# Port: 7000
```

**Terminal 2: Auth Service (REQUIRED)**
```powershell
cd microservices\auth-service
npm run dev
# Port: 7020
```

**Terminal 3: Frontend (REQUIRED)**
```powershell
cd nilecare-frontend
npm run dev
# Port: 5173 or 3000
```

**With just these 3, you can:**
- Login/Register
- View dashboards (with mock data)
- Navigate the entire UI

### Additional Services (For Full Functionality)

**Terminal 4: Clinical Service**
```powershell
cd microservices\clinical
npm run dev
# Port: 3004
```

**Terminal 5: Appointment Service**
```powershell
cd microservices\appointment-service
npm run dev
# Port: 7040
```

**Terminal 6: Billing Service**
```powershell
cd microservices\billing-service
npm run dev
# Port: 7050
```

---

## ✅ VERIFICATION

### Check Services Are Running

**Method 1: Check Health Endpoints**
```powershell
# Main-NileCare
curl http://localhost:7000/health

# Auth Service
curl http://localhost:7020/api/v1/health

# Expected: {"status":"healthy",...}
```

**Method 2: Check Process**
```powershell
# See all node processes
Get-Process node
```

**Method 3: Browser**
```
Open: http://localhost:7000/api/v1/dashboard/doctor-stats
Expected: Error or 401 (means service is running!)
```

---

## 🎨 ACCESSING THE PLATFORM

### Frontend URL

```
http://localhost:5173
OR
http://localhost:3000
```

### Login & Explore

**1. Login Page**
- Use your configured credentials
- Or register a new account

**2. Select Dashboard**
- After login, you'll see role-based dashboard
- Navigate using sidebar menu

**3. Explore Features**
- View patients
- Schedule appointments
- Prescribe medications (with drug interaction warnings!)
- View real-time vital signs
- Check analytics
- And more!

---

## 🐛 TROUBLESHOOTING

### Issue: "Port already in use"

**Solution:**
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Then restart services
```

### Issue: "Cannot find module"

**Solution:**
```powershell
# Install dependencies
cd microservices\main-nilecare
npm install

# Then try again
```

### Issue: "Database connection failed"

**Solution:**
- Ensure MySQL/PostgreSQL/MongoDB are running
- Check connection strings in .env files
- Services will work with mock data if DB unavailable

### Issue: Frontend won't start

**Solution:**
```powershell
cd nilecare-frontend
npm install
npm run dev
```

---

## 🎯 RECOMMENDED STARTUP SEQUENCE

**For Best Experience:**

1. **Start Core Services** (1 min)
   ```powershell
   .\start-main-services.ps1
   ```

2. **Wait** (30 seconds)
   - Let services initialize
   - Check terminal windows for "Server listening..."

3. **Start Frontend** (1 min)
   ```powershell
   .\start-frontend.ps1
   ```

4. **Wait** (15 seconds)
   - Frontend compiles
   - Look for "Local: http://localhost:5173"

5. **Open Browser** (instant)
   ```
   http://localhost:5173
   ```

6. **Login & Explore!** 🎉

**Total Time:** ~2 minutes from start to login!

---

## 📊 SERVICE STATUS DASHBOARD

### Check All Services

**Backend Services:**
- Main-NileCare: http://localhost:7000/health
- Auth Service: http://localhost:7020/api/v1/health

**Frontend:**
- React App: http://localhost:5173

**API Documentation:**
- Swagger UI: http://localhost:7000/docs (if configured)

---

## 🎊 WHAT TO TRY

### Test the Platform:

**1. Doctor Dashboard** ⭐
- Login as doctor
- See real appointment count
- View patient statistics
- Check pending labs
- See drug interaction warnings when prescribing!

**2. Nurse Dashboard**
- Login as nurse
- View assigned patients
- See medications due
- Monitor vital signs (real-time!)

**3. Admin Dashboard**
- Login as admin
- View system health
- See all users
- Monitor services

**4. Real-Time Features** ⭐
- View patient details
- See live vital signs monitor
- Watch data auto-refresh
- Test WebSocket connection

**5. Clinical Decision Support** ⭐
- Go to Prescribe Medication
- Type a drug name
- See automatic drug interaction checking!
- Try prescribing Warfarin + Aspirin (critical warning!)

---

## 🔧 SCRIPTS AVAILABLE

1. **start-all-services.ps1** - Start all 17 microservices
2. **start-main-services.ps1** - Start core 5 services (recommended)
3. **start-frontend.ps1** - Start React frontend
4. **test-phase6-dashboards.ps1** - Test dashboard integration
5. **apply-fix-4-all-services.ps1** - Apply migrations

---

## 📁 LOG FILES

**Check logs if issues:**
- Each service window shows real-time logs
- Look for "Server listening on port..." messages
- Errors will be displayed in red

---

## 💡 TIPS

**Performance:**
- First startup takes longer (npm install if needed)
- Subsequent starts are faster
- Close windows to stop services

**Development:**
- Services auto-reload on code changes
- Frontend has hot module replacement
- No need to restart for code changes

**Testing:**
- Use different browser profiles for different roles
- Or use incognito windows
- This allows simultaneous multi-role testing

---

**Status:** ✅ Scripts Ready  
**Difficulty:** Easy  
**Time to Start:** 2-3 minutes  
**Result:** Full platform running!

**🚀 LET'S SEE YOUR PLATFORM IN ACTION! 🚀**

