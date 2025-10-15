# 🚀 How to Start NileCare Services

**Quick Reference Guide**

---

## ✅ Currently Running

- ✅ **Auth Service** (Port 7020) - Running in background
- ✅ **Business Service** (Port 7010) - Running  

---

## 🎯 Start Additional Services

### Appointment Service

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\appointment-service
npm run dev
```

### Main NileCare Service

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\main-nilecare
npm run dev
```

### Payment Gateway (Needs PostgreSQL)

```powershell
cd C:\Users\pc\OneDrive\Desktop\NileCare\microservices\payment-gateway-service
npm run dev
```

---

## 🔍 Check Service Status

```powershell
# Quick status check
Invoke-WebRequest http://localhost:7020/health  # Auth
Invoke-WebRequest http://localhost:7010/health  # Business
Invoke-WebRequest http://localhost:7000/health  # Main
Invoke-WebRequest http://localhost:7040/health  # Appointment
```

---

## 🎉 Authentication Integration is WORKING!

With Auth Service and Business Service running, you can already test the complete authentication flow!

**Status:** ✅ OPERATIONAL

