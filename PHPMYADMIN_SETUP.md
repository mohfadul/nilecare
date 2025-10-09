# 🔧 **Setup NileCare Database in phpMyAdmin**

## ✅ **Quick Setup (3 Steps)**

---

### **Step 1: Open phpMyAdmin**

Go to: **http://localhost/phpmyadmin**

---

### **Step 2: Select Database**

1. Click on **"nilecare"** in the left sidebar
2. Click the **"SQL"** tab at the top

---

### **Step 3: Copy and Run SQL**

**Copy ALL this SQL code:**

```sql
-- Create tables for NileCare
USE nilecare;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'billing_clerk', 'facility_manager', 'it_support') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    phone VARCHAR(20),
    national_id VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    specialty VARCHAR(100),
    license_number VARCHAR(50),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) PRIMARY KEY,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SDG',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Paste it in the SQL textarea**

**Click "Go"** button at bottom right

---

### **Step 4: Verify**

You should see:
```
✅ 3 queries executed successfully
```

Refresh phpMyAdmin and you'll see:
- ✅ users (table)
- ✅ patients (table)
- ✅ payments (table)

---

## ✅ **Done!**

Now restart your backend:
1. Stop backend (Ctrl+C in backend window)
2. Run: `npm run dev` again

It should connect successfully!

---

## 🎯 **Then Test:**

1. Open: http://localhost:5173
2. Login: doctor@nilecare.sd / TestPass123!

---

**Or use the SQL file I created:**

Open `create-tables.sql` in phpMyAdmin SQL tab and run it!

