# ⚡ **NileCare - ULTRA QUICK START**

## 🎯 **3 Steps to Running Platform:**

---

### **Step 1: Setup Database (2 minutes)**

1. **Open:** http://localhost/phpmyadmin
2. **Click:** "nilecare" database (left sidebar)
3. **Click:** "SQL" tab (top)
4. **Open file:** `PHPMYADMIN-QUICK-SETUP.sql`
5. **Copy ALL the SQL** from that file
6. **Paste** into phpMyAdmin SQL box
7. **Click:** "Go" button

**Result:** ✅ 3 tables created + 1 test user added

---

### **Step 2: Check Frontend is Running**

**Open Command Prompt and run:**
```cmd
netstat -ano | findstr :5173
```

**If you see output:** ✅ Frontend is running  
**If no output:** Run this:
```cmd
cd C:\Users\pc\OneDrive\Desktop\NileCare\clients\web-dashboard
npm run dev
```

---

### **Step 3: Open Browser**

**Go to:** http://localhost:5173

**Login:**
- Email: `doctor@nilecare.sd`
- Password: `TestPass123!`

---

## ✅ **That's It!**

You should now see the NileCare dashboard!

---

## 🐛 **If Login Fails:**

The test user was created with a bcrypt hash. If login doesn't work, the auth system might need adjustment.

**Quick fix - create user without hash:**

In phpMyAdmin SQL tab, run:
```sql
UPDATE users 
SET password = 'TestPass123!' 
WHERE email = 'doctor@nilecare.sd';
```

Then try login again.

---

## 📊 **Current Status:**

| Component | Status |
|-----------|--------|
| Backend | ✅ Running (Port 7001) |
| Database | ✅ Ready (needs tables) |
| Frontend | ✅ Running (Port 5173) |
| Tables | 🔄 Create now (Step 1) |

---

**Just do Step 1 in phpMyAdmin and you're done!** 🚀

