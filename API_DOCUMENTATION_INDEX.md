# 📚 **NileCare API Documentation Index**

## **Complete API Reference for All Microservices**

**Last Updated**: October 16, 2025  
**API Standard**: OpenAPI 3.0 / Swagger  
**Interactive Docs**: Swagger UI available for all services

---

## 🌐 **API Documentation Endpoints**

### **Production-Ready Interactive Documentation**

All services expose interactive Swagger UI for testing APIs:

| Service | Port | Swagger UI URL | OpenAPI JSON |
|---------|------|----------------|--------------|
| **Main NileCare** | 7000 | http://localhost:7000/api-docs | /api-docs/swagger.json |
| **Auth Service** | 7020 | http://localhost:7020/api-docs | /api-docs/swagger.json |
| **Clinical Service** | 7001 | http://localhost:7001/api/docs | /api/docs/swagger.json |
| **Appointment Service** | 7040 | http://localhost:7040/api/docs | /api/docs/swagger.json |
| **Billing Service** | 7050 | http://localhost:7050/api-docs | /api-docs/swagger.json |
| **Payment Gateway** | 7030 | http://localhost:7030/api-docs | /api-docs/swagger.json |
| **Lab Service** | 7080 | http://localhost:7080/api-docs | /api-docs/swagger.json |
| **Medication Service** | 7090 | http://localhost:7090/api-docs | /api-docs/swagger.json |
| **Inventory Service** | 7100 | http://localhost:7100/api-docs | /api-docs/swagger.json |
| **Facility Service** | 7060 | http://localhost:7060/api-docs | /api-docs/swagger.json |
| **Business Service** | 7010 | http://localhost:7010/api-docs | /api-docs/swagger.json |
| **Notification Service** | 7007 | http://localhost:7007/api-docs | /api-docs/swagger.json |
| **Device Integration** | 7070 | http://localhost:7070/api-docs | /api-docs/swagger.json |

---

## 📋 **API Categories**

### **1. Authentication & Authorization**

**Service**: Auth Service (Port 7020)  
**Base URL**: `http://localhost:7020/api/v1`  
**Docs**: http://localhost:7020/api-docs

**Endpoints**:
- `POST /auth/login` - User login (JWT generation)
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/validate` - Validate JWT token
- `POST /auth/register` - User registration
- `GET /users` - List all users
- `POST /users` - Create user
- `GET /users/{id}` - Get user details
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user (soft delete)
- `GET /roles` - List roles
- `POST /roles` - Create role
- `GET /stats` - Auth statistics
- `POST /email-verification/send` - Send verification email
- `GET /email-verification/verify` - Verify email
- `GET /email-verification/status` - Check verification status

**Authentication**: JWT Bearer token (for protected endpoints)

---

### **2. Patient & Clinical Data**

**Service**: Clinical Service (Port 7001)  
**Base URL**: `http://localhost:7001/api/v1`  
**Docs**: http://localhost:7001/api/docs

**Endpoints**:
- `GET /patients` - List patients (paginated)
- `POST /patients` - Create patient
- `GET /patients/{id}` - Get patient details
- `PUT /patients/{id}` - Update patient
- `DELETE /patients/{id}` - Soft delete patient
- `GET /patients/{id}/encounters` - Get patient encounters
- `GET /encounters` - List encounters
- `POST /encounters` - Create encounter
- `GET /medications` - List medications
- `GET /diagnostics` - Diagnostic data
- `GET /stats` - Clinical statistics
- `GET /stats/patients/count` - Total patients
- `GET /stats/patients/recent` - Recent patients
- `GET /stats/encounters/count` - Total encounters
- `GET /stats/encounters/today` - Today's encounters

**Authentication**: Required (JWT)  
**Authorization**: Role-based (doctor, nurse, admin)

---

### **3. Appointments**

**Service**: Appointment Service (Port 7040)  
**Base URL**: `http://localhost:7040/api/v1`  
**Docs**: http://localhost:7040/api/docs

**Endpoints**:
- `GET /appointments` - List appointments
- `POST /appointments` - Create appointment
- `GET /appointments/{id}` - Get appointment details
- `PUT /appointments/{id}` - Update appointment
- `DELETE /appointments/{id}` - Cancel appointment
- `GET /schedules` - Provider schedules
- `GET /resources` - Available resources
- `GET /waitlist` - Waitlist entries
- `GET /reminders` - Appointment reminders
- `GET /stats` - Appointment statistics
- `GET /stats/appointments/today` - Today's appointments
- `GET /stats/appointments/pending` - Pending appointments

**Authentication**: Required (JWT)

---

### **4. Laboratory**

**Service**: Lab Service (Port 7080)  
**Base URL**: `http://localhost:7080/api/v1`  
**Docs**: http://localhost:7080/api-docs

**Endpoints**:
- `GET /lab-orders` - List lab orders
- `POST /lab-orders` - Create lab order
- `GET /lab-orders/{id}` - Get lab order
- `PUT /lab-orders/{id}` - Update lab order
- `GET /result-processing` - Result processing
- `GET /critical-values` - Critical value alerts
- `GET /quality-control` - QC results
- `GET /specimens` - Specimen tracking
- `GET /instruments` - Instrument management
- `GET /stats` - Lab statistics
- `GET /stats/orders/pending` - Pending orders count
- `GET /stats/results/critical` - Critical results count

**Authentication**: Required (JWT)

---

### **5. Medications**

**Service**: Medication Service (Port 7090)  
**Base URL**: `http://localhost:7090/api/v1`  
**Docs**: http://localhost:7090/api-docs

**Endpoints**:
- `GET /medications` - List medications
- `POST /medications` - Add medication
- `GET /mar` - Medication Administration Record
- `GET /barcode-verification` - Barcode verification
- `GET /reconciliation` - Medication reconciliation
- `GET /high-alert-monitoring` - High-alert monitoring
- `GET /administration` - Administration history
- `GET /stats` - Medication statistics
- `GET /stats/prescriptions/active` - Active prescriptions
- `GET /stats/alerts/count` - Medication alerts

**Authentication**: Required (JWT)

---

### **6. Inventory**

**Service**: Inventory Service (Port 7100)  
**Base URL**: `http://localhost:7100/api/v1`  
**Docs**: http://localhost:7100/api-docs

**Endpoints**:
- `GET /inventory` - List inventory items
- `POST /inventory` - Add inventory item
- `GET /items` - Item catalog
- `GET /suppliers` - Supplier management
- `GET /orders` - Purchase orders
- `GET /locations` - Stock locations
- `GET /stats` - Inventory statistics
- `GET /stats/items/low-stock` - Low stock items
- `GET /stats/items/out-of-stock` - Out of stock count
- `GET /stats/items/expiring` - Expiring items

**Authentication**: Required (JWT)

---

### **7. Billing & Payments**

**Service**: Billing Service (Port 7050)  
**Base URL**: `http://localhost:7050/api/v1`  
**Docs**: http://localhost:7050/api-docs

**Service**: Payment Gateway (Port 7030)  
**Base URL**: `http://localhost:7030/api/v1`  
**Docs**: http://localhost:7030/api-docs

**Endpoints**:
- `POST /payments/initiate` - Initiate payment
- `GET /payments/{id}` - Get payment status
- `POST /payments/verify` - Verify payment
- `POST /payments/webhook/:provider` - Payment webhook (Stripe, PayPal, etc.)
- `GET /invoices` - List invoices
- `POST /invoices` - Create invoice
- `GET /reconciliation` - Payment reconciliation
- `GET /refunds` - Refund management

**Authentication**: Required (JWT) except webhooks (signature validation)

---

### **8. Dashboard & Aggregation**

**Service**: Main NileCare Orchestrator (Port 7000)  
**Base URL**: `http://localhost:7000/api/v1`  
**Docs**: http://localhost:7000/api-docs

**Endpoints**:
- `GET /dashboard/stats` - Aggregated stats from all services
- `GET /dashboard/clinical-summary` - Clinical overview
- `GET /dashboard/alerts` - Critical alerts across services
- `GET /dashboard/today-summary` - Today's activity summary
- `GET /service-discovery/services` - Service registry and health

**Authentication**: Required (JWT)

---

## 🔑 **Authentication**

All API endpoints (except health checks and webhooks) require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Get Access Token**
```bash
curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@nilecare.sd",
    "password": "your_password"
  }'

# Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": { ... }
  }
}
```

### **Use Token**
```bash
curl http://localhost:7001/api/v1/patients \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 📊 **API Response Format**

All APIs follow standardized response format (Fix #1):

### **Success Response**
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "requestId": "f773b07b-578f-4ac3-9c15-56a21b1b32b8",
    "timestamp": "2025-10-16T10:30:00.000Z",
    "service": "clinical-service"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "metadata": {
    "requestId": "f773b07b-578f-4ac3-9c15-56a21b1b32b8",
    "timestamp": "2025-10-16T10:30:00.000Z",
    "service": "clinical-service"
  }
}
```

---

## 🧪 **Testing APIs**

### **Using Swagger UI** (Recommended)
1. Start the service
2. Open browser to service's `/api-docs` endpoint
3. Click "Authorize" button
4. Enter JWT token: `Bearer <your-token>`
5. Try any endpoint interactively

### **Using cURL**
```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"password"}' \
  | jq -r '.data.accessToken')

# Use token for API calls
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:7001/api/v1/patients
```

### **Using Postman**
1. Import OpenAPI spec from `/api-docs/swagger.json`
2. Set up authorization (Bearer token)
3. Test all endpoints

---

## 📖 **Additional Documentation**

- **Architecture**: `ARCHITECTURE_OVERVIEW.md`
- **Service Communication**: `SERVICE_COMMUNICATION_PATTERNS.md`
- **Sequence Diagrams**: `SEQUENCE_DIAGRAMS_CRITICAL_FLOWS.md`
- **Database Schemas**: `DATABASE_SCHEMAS_COMPLETE.md`
- **Environment Setup**: `ENV_TEMPLATE_ALL_SERVICES.md`

---

## ✅ **SUCCESS CRITERIA - ALL MET!**

- ✅ All services have OpenAPI/Swagger documentation
- ✅ Interactive Swagger UI available
- ✅ Standardized response format documented
- ✅ Authentication flow documented
- ✅ All endpoints catalogued
- ✅ Testing guides provided
- ✅ API index created

---

**THIS IS IT - FIX #9 COMPLETE = 100% ACHIEVEMENT!** 🏆🎉

