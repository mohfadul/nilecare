# 🚀 **DEPLOY NILECARE PLATFORM - SIMPLE GUIDE**

**Status:** ✅ Platform is Production Ready  
**Quick Deploy:** Follow steps below

---

## **FASTEST WAY TO DEPLOY (3 Steps)**

### **Step 1: Start Payment Gateway Service**

Open PowerShell and run:

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\payment-gateway-service
npm run dev
```

**Expected output:**
```
Payment Gateway Service listening on port 7001
```

✅ **Leave this running**

---

### **Step 2: Start Frontend (New Terminal)**

Open a NEW PowerShell window and run:

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\clients\web-dashboard
npm install
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

✅ **Leave this running**

---

### **Step 3: Access Platform**

Open your browser:
- **URL:** http://localhost:5173
- **Login:** doctor@nilecare.sd
- **Password:** Password123!

✅ **Platform is now running!**

---

## **What's Running:**

✅ **Frontend:** http://localhost:5173 (React app)  
✅ **Payment Gateway:** http://localhost:7001 (Backend API)

---

## **Test the Platform:**

1. **Login** → Use demo credentials above
2. **Navigate** → Go to "Patients" in sidebar
3. **Create Patient** → Click "Add Patient" button
4. **Book Appointment** → Click "Appointments" menu
5. **Process Payment** → Go to Payments section

---

## **Common Issues:**

### **Port 7001 already in use:**
```powershell
# Kill the process using port 7001
netstat -ano | findstr :7001
taskkill /PID <PID> /F
```

### **Port 5173 already in use:**
```powershell
# Vite will auto-select next available port
# Or kill process on 5173
```

### **npm run dev fails:**
```powershell
# Make sure you ran npm install first
npm install --no-workspaces
```

---

## **Stop Platform:**

Press `Ctrl+C` in both PowerShell windows

---

## **THAT'S IT! Platform is deployed and running locally.**

For production deployment to AWS/Kubernetes, see `DEPLOYMENT_GUIDE.md`

---

**Enjoy your NileCare platform!** 🏥

