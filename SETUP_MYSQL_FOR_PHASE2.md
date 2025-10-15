# 🔧 Setup MySQL for Phase 2 Execution

**Issue:** MySQL command not found in PATH  
**Solution:** Add MySQL to PATH or use full path

---

## Option 1: Add MySQL to PATH (Recommended)

### Step 1: Find MySQL Installation

Common locations:
```
C:\Program Files\MySQL\MySQL Server 8.0\bin\
C:\Program Files\MySQL\MySQL Server 8.4\bin\
C:\MySQL\bin\
C:\xampp\mysql\bin\
```

### Step 2: Add to PATH

**Method A: PowerShell (Temporary)**
```powershell
# Find MySQL
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Add to PATH for this session
$env:PATH += ";$mysqlPath"

# Verify
mysql --version
```

**Method B: System Environment Variables (Permanent)**
1. Press `Win + X` → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Click "New"
7. Add: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
8. Click OK on all dialogs
9. Restart PowerShell
10. Verify: `mysql --version`

---

## Option 2: Use Full Path in Scripts

Update migration script to use full MySQL path:

```powershell
# Instead of: mysql -u root ...
# Use: & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root ...
```

---

## Option 3: Install MySQL (If Not Installed)

### Download MySQL

1. Go to: https://dev.mysql.com/downloads/mysql/
2. Download MySQL Community Server
3. Install with default options
4. Set root password
5. Add to PATH during installation

---

## Quick Test Script

```powershell
# Test MySQL connectivity
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT VERSION();"

# If successful, add to PATH permanently
```

---

## Alternative: Use Docker

If you have Docker installed:

```powershell
# Run MySQL in Docker
docker run --name mysql-nilecare -e MYSQL_ROOT_PASSWORD=your_password -p 3306:3306 -d mysql:8.0

# Then use from host
mysql -h 127.0.0.1 -u root -p
```

---

## After Setup

Once MySQL is in PATH, run:

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\auth-service
.\run-migration.ps1
```

---

## Need Help?

1. Check MySQL installation: `Get-Service MySQL*`
2. Find MySQL path: `Get-ChildItem "C:\Program Files" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue`
3. Verify PATH: `$env:PATH -split ';' | Select-String mysql`

