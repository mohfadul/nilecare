# ✅ **Start Testing NileCare Platform - Quick Guide**

**Everything is ready! Follow these 3 simple steps:**

---

## 🚀 **Step 1: Create Test Users (Choose One Method)**

### **Method A: SQL Script (Fastest)** ⚡
```bash
# Run this command:
mysql -u root -p nilecare < testing/test-users/seed-test-users.sql
```
**Result:** Creates 12 users + 5 patients in 3 seconds

### **Method B: API Script** 🤖
```bash
cd testing/test-users
npm install axios bcrypt
node create-test-users.js
```
**Result:** Creates users via API calls

### **Method C: Manual** 👨‍💼
- See: `testing/test-users/TEST_USERS.md` for credentials
- Create manually through admin panel

---

## 🔐 **Step 2: Login & Test**

### **Quick Test Credentials:**

| What to Test | Email | Password |
|--------------|-------|----------|
| **Patient Management** | doctor@nilecare.sd | TestPass123! |
| **Appointments** | receptionist@nilecare.sd | TestPass123! |
| **Pharmacy** | pharmacist@nilecare.sd | TestPass123! |
| **Lab Tests** | lab-tech@nilecare.sd | TestPass123! |
| **Billing** | billing@nilecare.sd | TestPass123! |
| **Admin Panel** | admin@nilecare.sd | TestPass123! |

### **Login URL:**
```
http://localhost:5173/login
```

---

## 🧪 **Step 3: Run Test Suite**

### **Run All Tests:**
```bash
cd testing
./run-all-tests.sh
```
**Duration:** ~45 minutes  
**Output:** HTML report in `testing/results/test-report.html`

### **Quick Tests:**
```bash
# Unit tests only (5 min)
npm run test:unit

# Integration tests (12 min)
npm run test:integration

# Security tests (8 min)
npm run test:security
```

---

## 🎯 **Complete Test Workflow**

### **Test the Full Patient Journey:**

**1. Login as Receptionist** (`receptionist@nilecare.sd`)
- Navigate to Patients → Add New Patient
- Fill in: Ahmed Abdullah, 12345678901
- Click Save
- Go to Appointments → Book Appointment
- Select patient, choose doctor, select tomorrow 10:00 AM
- Click Confirm

**2. Login as Doctor** (`doctor@nilecare.sd`)
- See appointment on dashboard
- Click appointment → Start Consultation
- Create SOAP note:
  - S: Patient complains of headache
  - O: BP 120/80, no fever
  - A: Tension headache
  - P: Prescribe paracetamol, follow-up in 1 week
- Order lab tests: CBC, Blood Glucose
- Save clinical note

**3. Login as Lab Tech** (`lab-tech@nilecare.sd`)
- View lab orders
- Click on CBC order
- Enter results: WBC 7.2, RBC 4.8, HGB 14.5
- Mark as complete

**4. Login as Pharmacist** (`pharmacist@nilecare.sd`)
- View prescriptions
- Select paracetamol prescription
- Verify dosage, check interactions
- Dispense medication
- Update inventory

**5. Login as Billing** (`billing@nilecare.sd`)
- Create invoice for Ahmed Abdullah
- Add items:
  - Consultation: 200 SDG
  - Lab tests: 150 SDG
  - Medication: 50 SDG
- Total: 400 SDG
- Process payment (Zain Cash)
- Confirm payment

✅ **Complete workflow tested!**

---

## 📊 **What to Verify**

### **Functional Testing:**
- [ ] User can login/logout
- [ ] Patient registration works
- [ ] Appointments can be booked
- [ ] Clinical notes are saved
- [ ] Lab orders are created
- [ ] Prescriptions are generated
- [ ] Invoices are created
- [ ] Payments are processed
- [ ] Real-time notifications appear

### **Security Testing:**
- [ ] Invalid login rejected
- [ ] Unauthorized access blocked
- [ ] Password requirements enforced
- [ ] Session timeout works
- [ ] Audit logs are created

### **Performance Testing:**
- [ ] Pages load in < 3 seconds
- [ ] Search is responsive
- [ ] Multiple users can work simultaneously

---

## 📁 **Test User Reference**

**Full documentation:** `testing/test-users/TEST_USERS.md`

**Quick access:**
- 12 test users (all roles)
- 5 test patients (various conditions)
- Complete permission matrix
- Test scenarios for each role

---

## 🐛 **Troubleshooting**

### **Can't create test users?**
```bash
# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare';"
```

### **Can't login?**
- Check backend is running (port 3000 or 7001)
- Check frontend is running (port 5173)
- Verify user exists in database

### **Tests failing?**
```bash
# Clean install
cd testing
rm -rf node_modules
npm install

# Run tests again
./run-all-tests.sh
```

---

## 📞 **Documentation**

| Document | Purpose |
|----------|---------|
| `testing/test-users/TEST_USERS.md` | Complete user guide |
| `testing/MASTER_TEST_PLAN.md` | Testing strategy |
| `testing/COMPREHENSIVE_TEST_REPORT.md` | Test results |
| `testing/QUICK_TEST_GUIDE.md` | Quick commands |
| `DEPLOY_NOW.md` | Deployment guide |

---

## 🎊 **You're All Set!**

**Everything is ready for testing:**
✅ Test users created  
✅ Test patients configured  
✅ Test suite ready  
✅ Documentation complete  

**Start testing now!** 🧪✨

---

**Need help?** See `testing/test-users/README.md` for detailed setup instructions.

