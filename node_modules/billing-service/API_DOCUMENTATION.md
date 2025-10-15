# 📡 Billing Service API Documentation

**Service:** NileCare Billing Service  
**Version:** 1.0.0  
**Base URL:** `http://localhost:5003`  
**Authentication:** All endpoints require JWT token from Auth Service

---

## 🔑 Authentication

All API requests (except health checks and webhooks) require authentication:

```http
Authorization: Bearer <jwt-token>
```

**Get token:**
```bash
POST http://localhost:7020/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@nilecare.sd",
  "password": "password"
}
```

---

## 📋 Invoices API

### Create Invoice

**Endpoint:** `POST /api/v1/invoices`  
**Permission:** `billing:create`

**Request Body:**
```json
{
  "patientId": "uuid",
  "facilityId": "uuid",
  "invoiceType": "consultation",
  "invoiceDate": "2025-10-14",
  "dueDate": "2025-11-14",
  "paymentTerms": "Net 30",
  "gracePeriodDays": 7,
  "lateFeePercentage": 2.0,
  "currency": "SDG",
  "description": "Medical consultation and lab tests",
  "lineItems": [
    {
      "itemType": "consultation",
      "itemName": "General Consultation",
      "itemCode": "CONS-GEN",
      "procedureCode": "99213",
      "quantity": 1,
      "unitPrice": 150.00,
      "unitOfMeasure": "each",
      "discountPercent": 0,
      "taxPercent": 0,
      "serviceDate": "2025-10-14",
      "serviceProviderId": "doctor-uuid",
      "diagnosisCodes": ["Z00.00"]
    },
    {
      "itemType": "lab_test",
      "itemName": "Complete Blood Count",
      "itemCode": "LAB-CBC",
      "procedureCode": "85025",
      "quantity": 1,
      "unitPrice": 80.00,
      "serviceDate": "2025-10-14"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "INV-20251014-000001",
    "patientId": "patient-uuid",
    "facilityId": "facility-uuid",
    "invoiceType": "consultation",
    "subtotal": 230.00,
    "taxAmount": 0.00,
    "discountAmount": 0.00,
    "totalAmount": 230.00,
    "paidAmount": 0.00,
    "balanceDue": 230.00,
    "currency": "SDG",
    "status": "pending",
    "invoiceDate": "2025-10-14",
    "dueDate": "2025-11-14",
    "lineItems": [...],
    "payments": [],
    "createdAt": "2025-10-14T10:00:00Z"
  }
}
```

---

### Get Invoice

**Endpoint:** `GET /api/v1/invoices/:id`  
**Permission:** `billing:read`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "INV-20251014-000001",
    "patientId": "patient-uuid",
    "totalAmount": 230.00,
    "paidAmount": 0.00,
    "balanceDue": 230.00,
    "status": "pending",
    "lineItems": [
      {
        "id": "line-uuid",
        "lineNumber": 1,
        "itemName": "General Consultation",
        "quantity": 1,
        "unitPrice": 150.00,
        "lineTotal": 150.00
      }
    ],
    "payments": []  // From Payment Gateway
  }
}
```

---

### List Invoices

**Endpoint:** `GET /api/v1/invoices`  
**Permission:** `billing:read`

**Query Parameters:**
- `patientId` (optional) - Filter by patient
- `facilityId` (optional) - Filter by facility
- `status` (optional) - Filter by status
- `invoiceType` (optional) - Filter by type
- `startDate` (optional) - Date range start
- `endDate` (optional) - Date range end
- `minAmount` (optional) - Minimum amount
- `maxAmount` (optional) - Maximum amount
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Example:**
```bash
GET /api/v1/invoices?patientId=xyz&status=pending&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Update Invoice

**Endpoint:** `PUT /api/v1/invoices/:id`  
**Permission:** `billing:update`

**Request Body:**
```json
{
  "taxAmount": 10.00,
  "discountAmount": 20.00,
  "dueDate": "2025-11-20",
  "internalNotes": "Payment plan requested"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### Cancel Invoice

**Endpoint:** `DELETE /api/v1/invoices/:id`  
**Permission:** `billing:delete`

**Request Body:**
```json
{
  "reason": "Appointment cancelled by patient"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "invoice-uuid",
    "status": "cancelled",
    "internalNotes": "...[CANCELLED] Appointment cancelled by patient"
  }
}
```

---

### Get Invoice Statistics

**Endpoint:** `GET /api/v1/invoices/statistics`  
**Permission:** `billing:read`

**Query Parameters:**
- `facilityId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_invoices": 1250,
    "total_amount": 458000.00,
    "total_paid": 380000.00,
    "total_outstanding": 78000.00,
    "average_invoice_amount": 366.40,
    "paid_count": 1050,
    "pending_count": 150,
    "overdue_count": 50,
    "partially_paid_count": 25
  }
}
```

---

### Sync Payment Status

**Endpoint:** `POST /api/v1/invoices/:id/sync-payment`  
**Permission:** `billing:update`

**Description:** Queries Payment Gateway for latest payment status and updates invoice

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invoiceId": "invoice-uuid",
    "payments": [
      {
        "id": "payment-uuid",
        "amount": 230.00,
        "status": "confirmed",
        "confirmedAt": "2025-10-14T11:00:00Z"
      }
    ],
    "totalConfirmed": 230.00,
    "synced": true
  }
}
```

---

## 🏥 Insurance Claims API

### Create Claim

**Endpoint:** `POST /api/v1/claims`  
**Permission:** `claims:create`

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "facilityId": "facility-uuid",
  "insurancePolicyId": "policy-uuid",
  "billingAccountId": "account-uuid",
  "claimType": "professional",
  "claimFormat": "CMS1500",
  "serviceDateFrom": "2025-10-14",
  "serviceDateTo": "2025-10-14",
  "renderingProviderId": "doctor-uuid",
  "lineItems": [
    {
      "lineNumber": 1,
      "serviceDate": "2025-10-14",
      "procedureCode": "99213",
      "procedureDescription": "Office visit, established patient",
      "diagnosisCodes": ["Z00.00", "M79.3"],
      "modifiers": "25",
      "units": 1,
      "chargeAmount": 150.00,
      "placeOfServiceCode": "11",
      "renderingProviderId": "doctor-uuid"
    }
  ],
  "claimNotes": "Patient presents with chronic pain management"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "claimNumber": "CLM-20251014-000001",
    "status": "draft",
    "totalCharges": 150.00,
    "createdAt": "2025-10-14T10:00:00Z"
  }
}
```

---

### Submit Claim

**Endpoint:** `POST /api/v1/claims/:id/submit`  
**Permission:** `claims:submit`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "claimNumber": "CLM-20251014-000001",
    "status": "submitted",
    "submissionDate": "2025-10-14T10:30:00Z",
    "submittedBy": "user-uuid"
  },
  "message": "Claim submitted successfully"
}
```

---

### Process Claim Payment

**Endpoint:** `POST /api/v1/claims/:id/payment`  
**Permission:** `claims:process`

**Request Body:**
```json
{
  "paidAmount": 120.00,
  "allowedAmount": 135.00,
  "remittanceInfo": {
    "adviceNumber": "ERA-123456",
    "checkNumber": "CHK-789",
    "checkDate": "2025-10-20"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "claim-uuid",
    "status": "paid",
    "paidAmount": 120.00,
    "allowedAmount": 135.00,
    "patientResponsibility": 15.00
  },
  "message": "Claim payment processed successfully"
}
```

---

### Deny Claim

**Endpoint:** `POST /api/v1/claims/:id/deny`  
**Permission:** `claims:process`

**Request Body:**
```json
{
  "denialReasonCode": "CO-16",
  "denialReason": "Claim/service lacks information or has submission/billing error(s)"
}
```

---

### File Appeal

**Endpoint:** `POST /api/v1/claims/:id/appeal`  
**Permission:** `claims:appeal`

**Request Body:**
```json
{
  "appealNotes": "Additional documentation provided. Service was medically necessary based on patient's chronic condition."
}
```

---

### List Claims by Status

**Endpoint:** `GET /api/v1/claims/by-status/:status`  
**Permission:** `claims:read`

**Status values:** `draft`, `submitted`, `pending`, `approved`, `paid`, `denied`, `appealed`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "count": 15
}
```

---

## 🔔 Webhooks API

### Payment Confirmed

**Endpoint:** `POST /api/v1/webhooks/payment-confirmed`  
**Caller:** Payment Gateway Service

**Request Body:**
```json
{
  "invoiceId": "invoice-uuid",
  "paymentId": "payment-uuid",
  "amount": 230.00,
  "paymentGatewayReference": "PAY-20251014-ABC123",
  "paymentMethod": "zain_cash"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment confirmation received and processed"
}
```

---

### Payment Failed

**Endpoint:** `POST /api/v1/webhooks/payment-failed`  
**Caller:** Payment Gateway Service

**Request Body:**
```json
{
  "invoiceId": "invoice-uuid",
  "paymentId": "payment-uuid",
  "reason": "Insufficient funds"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment failure notification received"
}
```

---

## 🏥 Health & Monitoring API

### Health Check (Liveness)

**Endpoint:** `GET /health`  
**Auth:** Not required

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "billing-service",
  "port": 5003,
  "version": "1.0.0",
  "timestamp": "2025-10-14T10:00:00Z"
}
```

---

### Readiness Check

**Endpoint:** `GET /health/ready`  
**Auth:** Not required

**Response (200 OK):**
```json
{
  "status": "ready",
  "service": "billing-service",
  "checks": {
    "database": "connected",
    "paymentGateway": "accessible",
    "overall": true
  },
  "timestamp": "2025-10-14T10:00:00Z"
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "not_ready",
  "service": "billing-service",
  "checks": {
    "database": "disconnected",
    "paymentGateway": "unreachable",
    "overall": false
  },
  "timestamp": "2025-10-14T10:00:00Z"
}
```

---

### Metrics (Prometheus)

**Endpoint:** `GET /metrics`  
**Auth:** Not required  
**Format:** Prometheus text format

**Response (200 OK):**
```
# HELP billing_service_uptime_seconds Service uptime in seconds
# TYPE billing_service_uptime_seconds counter
billing_service_uptime_seconds 3600

# HELP billing_service_info Service information
# TYPE billing_service_info gauge
billing_service_info{version="1.0.0",service="billing-service"} 1
```

---

## 📊 Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }  // Optional
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AUTH_SERVICE_UNAVAILABLE` | 503 | Auth Service not accessible |

---

## 🔐 Permissions Required

### Invoice Operations

- `billing:create` - Create invoices
- `billing:read` - View invoices
- `billing:update` - Update invoices
- `billing:delete` - Cancel invoices

### Claims Operations

- `claims:create` - Create claims
- `claims:read` - View claims
- `claims:submit` - Submit claims to insurance
- `claims:process` - Process claim payments/denials
- `claims:appeal` - File claim appeals

### Role-Based Defaults

| Role | Default Permissions |
|------|---------------------|
| **admin** | All permissions |
| **medical_director** | All permissions |
| **billing_staff** | billing:*, claims:* |
| **accountant** | billing:read, claims:read |
| **doctor** | billing:read, claims:read |
| **receptionist** | billing:create, billing:read |

---

## 🧪 Testing Examples

### Complete Invoice Workflow

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:7020/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nilecare.sd","password":"TestPass123!"}' \
  | jq -r '.data.accessToken')

# 2. Create invoice
INVOICE_ID=$(curl -X POST http://localhost:5003/api/v1/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "facilityId": "facility-uuid",
    "invoiceType": "consultation",
    "invoiceDate": "2025-10-14",
    "dueDate": "2025-11-14",
    "lineItems": [{
      "itemType": "consultation",
      "itemName": "General Consultation",
      "quantity": 1,
      "unitPrice": 150.00
    }]
  }' | jq -r '.data.id')

# 3. Get invoice
curl -X GET http://localhost:5003/api/v1/invoices/$INVOICE_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Sync payment status (check if patient paid)
curl -X POST http://localhost:5003/api/v1/invoices/$INVOICE_ID/sync-payment \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📞 Support

- **Service Issues**: Check `logs/combined.log`
- **Authentication Issues**: Verify Auth Service (port 7020) is running
- **Payment Integration Issues**: Verify Payment Gateway (port 7030) is running
- **Database Issues**: Check `logs/error.log` and database connectivity

---

## 📝 API Change Log

**Version 1.0.0** (October 14, 2025)
- Initial API release
- Invoice CRUD operations
- Insurance claims management
- Payment Gateway integration
- Webhook endpoints

---

**Documentation Last Updated:** October 14, 2025  
**API Version:** 1.0.0  
**Service:** Billing Service

