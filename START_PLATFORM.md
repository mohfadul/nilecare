# 🚀 **Quick Start - Deploy NileCare Platform**

**Choose your deployment method:**

---

## **Option 1: Local Development (Windows) - FASTEST** ⚡

### **Start Backend:**
```powershell
# Start Payment Gateway (Most Important)
cd microservices\payment-gateway-service
npm install --no-workspaces
npm run dev
# Runs on http://localhost:7001
```

**In a new terminal:**
```powershell
# Start Auth Service
cd microservices\auth-service
npm install
npm run dev
# Runs on http://localhost:3001
```

### **Start Frontend:**
```powershell
# In a new terminal
cd clients\web-dashboard
npm install
npm run dev
# Runs on http://localhost:5173
```

### **Access Platform:**
- **Frontend:** http://localhost:5173
- **Login:** doctor@nilecare.sd / Password123!

---

## **Option 2: Docker Compose - RECOMMENDED** 🐳

```powershell
# Start all services
docker-compose up -d

# Verify
docker-compose ps

# View logs
docker-compose logs -f payment-gateway-service

# Access:
# Frontend: http://localhost (port 80)
# Backend API: http://localhost:3000
```

---

## **Option 3: PowerShell Script - AUTOMATED** 🤖

```powershell
# Run deployment script
.\deploy-local.ps1

# This will:
# ✅ Check prerequisites
# ✅ Install dependencies
# ✅ Create .env files
# ✅ Start services
# ✅ Open browser
```

---

## **Option 4: Kubernetes - PRODUCTION** ☸️

```bash
# Prerequisites:
# - kubectl configured
# - Cluster running
# - AWS CLI configured (for frontend)

# Deploy everything
./deploy-production.sh

# OR manually:
kubectl apply -f infrastructure/kubernetes/

# Verify
kubectl get pods -n nilecare
```

---

## **Quick Test After Deployment:**

```powershell
# Test backend
curl http://localhost:7001/health
# Should return: {"status":"ok","service":"payment-gateway-service"}

# Test frontend
# Open browser: http://localhost:5173
# Login with: doctor@nilecare.sd / Password123!
```

---

## **🎯 Recommended for First Time:**

**Use Option 1** (Manual service start) to verify everything works, then move to Docker or Kubernetes.

---

## **📞 Troubleshooting:**

### **Issue: Port already in use**
```powershell
# Find process using port 7001
netstat -ano | findstr :7001
# Kill process or change port in .env
```

### **Issue: npm install fails**
```powershell
# Use --no-workspaces flag
npm install --no-workspaces
```

### **Issue: Database connection failed**
```powershell
# Make sure MySQL/PostgreSQL/Redis are running
# Or use Docker Compose which includes databases
```

---

**Choose your method and start deploying!** 🚀

