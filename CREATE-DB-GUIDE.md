# 🔧 Create Database - Quick Guide

## ✅ **Option 1: MySQL Workbench (Easiest)**

1. **Open MySQL Workbench**
2. **Connect to your MySQL server**
3. **Click** the "Create Schema" icon (cylinder with +)
4. **Name:** `nilecare`
5. **Charset:** `utf8mb4`
6. **Collation:** `utf8mb4_unicode_ci`
7. **Click Apply**

**Done!** Now restart your backend.

---

## ✅ **Option 2: MySQL Command Line**

1. **Find MySQL:**
   - Usually at: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`
   - Or: `C:\xampp\mysql\bin\mysql.exe` (if using XAMPP)

2. **Open Command Prompt as Administrator**

3. **Run:**
```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

4. **Enter your MySQL password**

5. **Type:**
```sql
CREATE DATABASE nilecare;
exit;
```

**Done!** Now restart your backend.

---

## ✅ **Option 3: Using SQL File**

1. **Open Command Prompt**

2. **Run:**
```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < create-database.sql
```

3. **Enter your MySQL password**

**Done!** Database created.

---

## ✅ **Option 4: phpMyAdmin (if using XAMPP)**

1. **Open:** http://localhost/phpmyadmin
2. **Click** "New" in the left sidebar
3. **Database name:** `nilecare`
4. **Collation:** `utf8mb4_unicode_ci`
5. **Click** "Create"

**Done!**

---

## 🔄 **After Creating Database:**

**Stop the backend** (Ctrl+C in backend window)

**Start it again:**
```cmd
cd microservices\payment-gateway-service
npm run dev
```

**You should see:**
```
✓ Database connected successfully
✓ Payment Gateway Service listening on port 7001
```

---

## 📝 **Note about Redis Warning:**

The Redis warning is **OK to ignore** for testing:
```
[ioredis] Unhandled error event: Error: connect ECONNREFUSED 127.0.0.1:6379
```

Redis is optional. The platform will work without it!

---

**Just create the database using any method above, then restart the backend!** 🚀

