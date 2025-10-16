# 🧪 QUICK TEST: PHASE 6 DASHBOARDS

**Goal:** Verify all 7 dashboards work with real API data  
**Time:** 15 minutes

---

## 🚀 START SERVICES

### Terminal 1: Backend

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\main-nilecare
npm run dev
```

**Expected:** Server starts on port 7000

### Terminal 2: Frontend

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\nilecare-frontend
npm run dev
```

**Expected:** Server starts on port 5173 or 3000

---

## ✅ TEST CHECKLIST

### 1. Doctor Dashboard

**Login:** Use doctor credentials  
**URL:** `/doctor-dashboard` or `/dashboards/doctor`

**Verify:**
- [ ] Loading skeleton appears briefly
- [ ] 4 stat cards show numbers (appointments, patients, labs, prescriptions)
- [ ] Numbers are NOT hardcoded (12, 48, 7, 2)
- [ ] "Last updated" timestamp shows
- [ ] Wait 30 seconds → timestamp updates (auto-refresh working!)

**Success:** ✅ Real data displayed!

### 2. Nurse Dashboard

**Login:** Use nurse credentials  
**URL:** `/nurse-dashboard` or `/dashboards/nurse`

**Verify:**
- [ ] Assigned patients count
- [ ] Medications due/administered
- [ ] Pending vitals
- [ ] Critical alerts

**Success:** ✅ Real nursing data!

### 3. Receptionist Dashboard

**Login:** Use receptionist credentials  
**URL:** `/receptionist-dashboard` or `/dashboards/receptionist`

**Verify:**
- [ ] Today's appointments
- [ ] Checked-in count
- [ ] Waiting room count
- [ ] Cancelled appointments

**Success:** ✅ Real appointment data!

### 4. Admin Dashboard

**Login:** Use admin credentials  
**URL:** `/admin-dashboard` or `/dashboards/admin`

**Verify:**
- [ ] Total users
- [ ] Active users
- [ ] Facilities count
- [ ] System health status (healthy/degraded)
- [ ] Services up/down

**Success:** ✅ Real system data!

### 5. Billing Clerk Dashboard

**Login:** Use billing_clerk credentials  
**URL:** `/billing-dashboard` or `/dashboards/billing`

**Verify:**
- [ ] Outstanding invoices
- [ ] Payments today
- [ ] Revenue (formatted as currency)
- [ ] Pending/approved claims

**Success:** ✅ Real financial data!

### 6. Lab Tech Dashboard

**Login:** Use lab_tech credentials  
**URL:** `/lab-dashboard` or `/dashboards/lab`

**Verify:**
- [ ] Pending tests
- [ ] In progress tests
- [ ] Completed today
- [ ] Critical results
- [ ] Average turnaround time

**Success:** ✅ Real lab data!

### 7. Pharmacist Dashboard

**Login:** Use pharmacist credentials  
**URL:** `/pharmacist-dashboard` or `/dashboards/pharmacist`

**Verify:**
- [ ] Pending prescriptions
- [ ] Dispensed today
- [ ] Low stock items
- [ ] Out of stock
- [ ] Expiring medications

**Success:** ✅ Real pharmacy data!

---

## 🧪 ERROR HANDLING TEST

### Test Error Scenario:

1. Login to any dashboard
2. **Stop the backend** (Ctrl+C in Terminal 1)
3. Wait for next refresh (30 seconds) OR refresh page

**Expected:**
- [ ] Error alert appears
- [ ] Clear error message: "Failed to Load Dashboard"
- [ ] Retry button visible
- [ ] Click Retry button

4. **Restart backend** (npm run dev)
5. Click "Retry" button

**Expected:**
- [ ] Error disappears
- [ ] Data loads successfully
- [ ] Dashboard works again

**Success:** ✅ Error handling works!

---

## ⚡ AUTO-REFRESH TEST

### Test Auto-Refresh:

1. Login to Doctor Dashboard
2. Note the "Last updated" timestamp
3. **Wait exactly 30 seconds**
4. Observe:
   - [ ] Timestamp updates automatically
   - [ ] No page reload needed
   - [ ] Data might change (if backend data changed)

**Success:** ✅ Auto-refresh working!

---

## 📊 EXPECTED DATA

### If Using Mock/Placeholder Data:

Dashboard stats **might show 0** if backend services aren't fully populated with data. This is OK!

**What matters:**
- ✅ API calls are being made (check Network tab)
- ✅ Responses are successful (200 OK)
- ✅ Data structure is correct (JSON with expected fields)
- ✅ No hardcoded values (12, 48, etc.)

### Example Response:

```json
{
  "status": 200,
  "success": true,
  "message": "Dashboard stats retrieved",
  "data": {
    "today_appointments": 0,
    "total_patients": 0,
    "pending_labs": 0,
    "active_prescriptions": 0
  },
  "timestamp": "2025-10-16T...",
  "request_id": "req_..."
}
```

**Key:** Response structure is correct, even if numbers are 0!

---

## 🐛 TROUBLESHOOTING

### Issue: Dashboard shows error immediately

**Check:**
1. Is Main-NileCare running? (port 7000)
2. Check terminal for errors
3. Try: `http://localhost:7000/health` (should return {"status":"healthy"})

**Fix:** Restart main-nilecare service

### Issue: Dashboard shows hardcoded numbers (12, 48, 7, 2)

**Cause:** Old code still loaded

**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Restart frontend dev server

### Issue: CORS error

**Fix:**
1. Check CORS settings in main-nilecare
2. Ensure frontend URL is allowed
3. Restart both services

### Issue: 401 Unauthorized

**Cause:** Authentication token issue

**Fix:**
1. Logout and login again
2. Check localStorage for token
3. Verify auth middleware in backend

---

## ✅ SUCCESS CRITERIA

**Phase 6 is 100% complete when:**

- [x] All 7 dashboard endpoints created
- [x] All 7 frontend hooks created
- [x] All 7 dashboard components updated
- [ ] All 7 dashboards tested and working
- [ ] Auto-refresh verified (30 seconds)
- [ ] Error handling tested
- [ ] Loading states verified

**After testing:** Mark Phase 6 as 100% complete! 🎉

---

## 📸 SCREENSHOTS (Optional)

Take screenshots of each dashboard showing real data!

- [ ] Doctor Dashboard
- [ ] Nurse Dashboard
- [ ] Receptionist Dashboard
- [ ] Admin Dashboard
- [ ] Billing Clerk Dashboard
- [ ] Lab Tech Dashboard
- [ ] Pharmacist Dashboard

---

## 🎯 QUICK TEST (5 MIN VERSION)

**Minimal test:**
1. Start both services
2. Login as doctor
3. Verify dashboard shows loading → data
4. Wait 30 seconds for auto-refresh
5. Stop backend → verify error
6. Restart backend → retry → verify recovery

**If this works:** All dashboards likely work! ✅

---

**Time:** 15 minutes full test, 5 minutes quick test  
**Result:** Phase 6 100% complete! 🎉

**Ready? Let's test!** 🚀

