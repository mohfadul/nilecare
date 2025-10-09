# ⚡ **Quick Setup - Fix Database & Redis Issues**

## 🔧 **Step 1: Setup MySQL Database**

### **Option A: If MySQL is Installed**

Open a **new PowerShell/Command Prompt** and run:

```bash
# Login to MySQL (enter your MySQL password when prompted)
mysql -u root -p

# If no password, just press Enter
```

Once in MySQL, run:
```sql
CREATE DATABASE IF NOT EXISTS nilecare;
USE nilecare;

-- You're done! Type exit to close
exit;
```

**OR use the setup script I created:**

```bash
mysql -u root -p < setup-database.sql
```

### **Option B: If MySQL is NOT Installed**

**Quick Install:**
1. Download MySQL: https://dev.mysql.com/downloads/installer/
2. Install with default settings
3. Remember the root password you set
4. Then run the commands above

---

## 🔧 **Step 2: Setup Redis (Optional)**

### **Redis is Optional for Testing!**

The app will work without Redis, but if you want to install it:

**Option A: Install Redis on Windows**
```bash
# Download Redis for Windows from:
https://github.com/tporadowski/redis/releases

# Or use Chocolatey:
choco install redis-64
```

**Option B: Skip Redis for Now**

The app will show a warning but will still work. You can test without it!

---

## 🔧 **Step 3: Update Database Password in .env**

I created a `.env` file for you. If your MySQL has a password, edit it:

**File:** `microservices/payment-gateway-service/.env`

```env
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE  # ← Change this!
```

---

## ✅ **Step 4: Restart Backend**

After database setup, restart the backend:

1. **Stop** the current backend (Ctrl+C in the terminal)
2. **Run again:**
   ```bash
   cd C:\Users\pc\OneDrive\Desktop\NileCare
   .\START-BACKEND.bat
   ```

---

## 🎯 **Expected Output After Fix**

You should see:
```
✓ Database connected successfully
✓ Payment Gateway Service listening on port 7001
```

*(Redis warning is OK - you can ignore it for testing)*

---

## 🚀 **Then Start Frontend**

In a **new** terminal:
```bash
cd C:\Users\pc\OneDrive\Desktop\NileCare
.\START-FRONTEND.bat
```

---

## 🌐 **Access Platform**

Once both are running:
1. Open: **http://localhost:5173**
2. Login: `doctor@nilecare.sd` / `TestPass123!`

---

## 🐛 **Still Having Issues?**

### **Issue: "Access denied for user 'root'"**

Update the .env file:
```env
DB_PASSWORD=your_actual_mysql_password
```

### **Issue: "Can't connect to MySQL server"**

Make sure MySQL is running:
```bash
# Check if MySQL is running
net start MySQL80

# Or start it
net start MySQL80
```

### **Issue: Database doesn't exist**

Run:
```bash
mysql -u root -p -e "CREATE DATABASE nilecare;"
```

---

## 📝 **Quick Database Setup Script**

I created `setup-database.sql` - just run:

```bash
mysql -u root -p < setup-database.sql
```

This creates everything you need!

---

## ✅ **Summary**

1. ✅ Create database: `mysql -u root -p < setup-database.sql`
2. ✅ Update password in `.env` if needed
3. ✅ Restart backend: `.\START-BACKEND.bat`
4. ✅ Start frontend: `.\START-FRONTEND.bat`
5. ✅ Open: http://localhost:5173

**You're ready to test!** 🎉

