# 👥 **Test Users - Quick Setup Guide**

**Get your NileCare platform ready for testing in 3 steps!**

---

## 🚀 **Option 1: Quick Setup (SQL)**

### **Step 1: Run SQL Seed Script**
```bash
# Connect to MySQL database
mysql -u root -p nilecare < testing/test-users/seed-test-users.sql
```

### **Step 2: Verify Users Created**
```bash
# Check users
mysql -u root -p -e "SELECT email, role FROM nilecare.users WHERE email LIKE '%@nilecare.sd';"
```

### **Step 3: Start Testing!**
- Open: http://localhost:5173/login
- Login: `doctor@nilecare.sd` / `TestPass123!`

✅ **Done! 12 users + 5 patients created.**

---

## 🤖 **Option 2: Programmatic (API)**

### **Step 1: Install Dependencies**
```bash
cd testing/test-users
npm install axios bcrypt
```

### **Step 2: Run Creation Script**
```bash
node create-test-users.js
```

### **Step 3: Verify**
```bash
# Script will automatically verify all users
# Output shows: ✅ Created user: admin@nilecare.sd (admin)
```

✅ **Done! Users created via API.**

---

## 📝 **Option 3: Manual (Admin Panel)**

### **Step 1: Login as Initial Admin**
- If you have an existing admin account, login first

### **Step 2: Create Users Manually**
- Go to: Users → Add New User
- Use credentials from `TEST_USERS.md`

### **Step 3: Test Each User**
- Logout and login with each test account

---

## 🎯 **Quick Login Credentials**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@nilecare.sd | TestPass123! |
| **Doctor** | doctor@nilecare.sd | TestPass123! |
| **Nurse** | nurse@nilecare.sd | TestPass123! |
| **Receptionist** | receptionist@nilecare.sd | TestPass123! |
| **Pharmacist** | pharmacist@nilecare.sd | TestPass123! |
| **Lab Tech** | lab-tech@nilecare.sd | TestPass123! |
| **Billing** | billing@nilecare.sd | TestPass123! |
| **Manager** | manager@nilecare.sd | TestPass123! |

**Full list:** See `TEST_USERS.md`

---

## 🧪 **Test Patient Data**

5 pre-configured test patients ready to use:

1. **Ahmed Abdullah** (ID: 12345678901) - Hypertension, Diabetes
2. **Fatima Hassan** (ID: 23456789012) - Healthy
3. **Mohamed Ali** (ID: 34567890123) - Asthma (Child)
4. **Sara Ibrahim** (ID: 45678901234) - Cardiac Disease
5. **Omar Khalid** (ID: 56789012345) - Sports Physical

---

## 📊 **What Gets Created**

### **12 Test Users:**
- 1 System Administrator
- 3 Doctors (General, Cardiology, Emergency)
- 2 Nurses (General Ward, ICU)
- 1 Receptionist
- 1 Pharmacist
- 1 Lab Technician
- 1 Billing Clerk
- 1 Facility Manager
- 1 IT Support

### **5 Test Patients:**
- Various ages (child to senior)
- Different medical conditions
- Complete contact information
- Emergency contacts

---

## 🔒 **Security Notes**

- ✅ All passwords use strong format (TestPass123!)
- ✅ Passwords are bcrypt hashed in database
- ✅ Each user has unique email
- ⚠️ **IMPORTANT:** Change all passwords in production!
- ⚠️ **NEVER** commit real passwords to git

---

## 🧪 **Testing Workflows**

### **Complete Patient Journey:**

1. **Login as Receptionist:**
   ```
   Email: receptionist@nilecare.sd
   Password: TestPass123!
   ```
   - Register new patient
   - Book appointment with doctor

2. **Login as Doctor:**
   ```
   Email: doctor@nilecare.sd
   Password: TestPass123!
   ```
   - View appointment
   - Create clinical note (SOAP)
   - Order lab tests
   - Prescribe medication

3. **Login as Lab Tech:**
   ```
   Email: lab-tech@nilecare.sd
   Password: TestPass123!
   ```
   - View lab orders
   - Enter test results

4. **Login as Pharmacist:**
   ```
   Email: pharmacist@nilecare.sd
   Password: TestPass123!
   ```
   - View prescription
   - Dispense medication

5. **Login as Billing:**
   ```
   Email: billing@nilecare.sd
   Password: TestPass123!
   ```
   - Create invoice
   - Process payment

✅ **Complete workflow tested!**

---

## 🐛 **Troubleshooting**

### **Issue: SQL Script Fails**
```bash
# Check if database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'nilecare';"

# Create database if needed
mysql -u root -p -e "CREATE DATABASE nilecare;"
```

### **Issue: Users Already Exist**
```bash
# Delete test users and retry
mysql -u root -p -e "DELETE FROM nilecare.users WHERE email LIKE '%@nilecare.sd';"
```

### **Issue: Can't Login**
```bash
# Verify user exists
mysql -u root -p -e "SELECT * FROM nilecare.users WHERE email='doctor@nilecare.sd';"

# Reset password
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('TestPass123!', 10));"
# Copy hash and update database
```

### **Issue: Permission Denied**
- Verify user has correct role in database
- Check RBAC configuration
- Review audit logs

---

## 📁 **Files in This Directory**

| File | Purpose |
|------|---------|
| `TEST_USERS.md` | Complete user documentation |
| `seed-test-users.sql` | SQL seed script |
| `test-users.json` | JSON configuration |
| `create-test-users.js` | API creation script |
| `README.md` | This file |

---

## ✅ **Verification Checklist**

After creating test users:

- [ ] Can login as admin@nilecare.sd
- [ ] Can login as doctor@nilecare.sd
- [ ] Can login as nurse@nilecare.sd
- [ ] Can see 12 users in user management (admin view)
- [ ] Can see 5 test patients in patient list
- [ ] Each role has correct permissions
- [ ] Can complete full patient workflow
- [ ] Audit logs are being created

---

## 🎊 **You're Ready to Test!**

All test users and patients are configured. Start testing your platform!

**Next Steps:**
1. Login with any test user
2. Follow test scenarios in `TEST_USERS.md`
3. Run automated tests: `cd testing && ./run-all-tests.sh`

---

**Happy Testing!** 🧪✨

