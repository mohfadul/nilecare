# 🏗️ Billing Service Architecture Analysis

**Date:** October 14, 2025  
**Status:** ✅ Architecture Defined  
**Purpose:** Clear separation of concerns between Billing, Payment Gateway, and Business services

---

## 📊 Service Separation of Concerns

### ✅ **Billing Service (Port 5003)** - THIS SERVICE

**Responsibility:** Invoice & Claims Management (Records & Reports)

**Core Functions:**
- ✅ Invoice Generation & Management (CRUD)
- ✅ Billing Accounts (patient billing records)
- ✅ Insurance Claims Processing (submit, track, appeal)
- ✅ Charge Capture (link services to invoices)
- ✅ Billing Reports & Analytics
- ✅ Account Statements
- ✅ Payment Status Tracking (query Payment Gateway)
- ✅ Integration with Payment Gateway (link invoices to payments)

**What It DOES NOT Do:**
- ❌ Process payments (Payment Gateway's job)
- ❌ Handle provider integrations (Payment Gateway's job)
- ❌ Manage appointments (Business Service's job)
- ❌ Handle authentication (Auth Service's job)

---

### ✅ **Payment Gateway Service (Port 7030)**

**Responsibility:** Payment Transaction Processing

**Core Functions:**
- ✅ Process payments through providers (Zain Cash, Bank of Khartoum, etc.)
- ✅ Payment verification & reconciliation
- ✅ Refund processing
- ✅ Provider API integrations
- ✅ Payment webhooks
- ✅ Transaction security & fraud detection

**Integration with Billing:**
- Receives invoice_id when processing payments
- Notifies Billing Service when payment confirmed
- Provides payment status queries for invoices

---

### ✅ **Business Service (Port 7010)**

**Responsibility:** Operational Workflows

**Core Functions:**
- ✅ Appointments
- ✅ Scheduling
- ✅ Staff Management
- ✅ Workflow orchestration

**Note:** Business Service currently has basic billing (BillingController) - this will be deprecated and delegated to Billing Service

---

### ✅ **Auth Service (Port 7020)**

**Responsibility:** Authentication & Authorization

**Core Functions:**
- ✅ User authentication
- ✅ Token validation
- ✅ Permission checking
- ✅ Service-to-service auth

**Integration:** All services use Auth Service for centralized authentication

---

## 🔗 Integration Flow

### Invoice → Payment Flow

```
1. Billing Service: Create Invoice
   POST /api/v1/invoices
   → Invoice created with status 'pending'

2. Frontend: User initiates payment
   → Calls Payment Gateway with invoice_id

3. Payment Gateway: Process Payment
   POST /api/v1/payments/initiate
   Body: { invoiceId, amount, provider, ... }
   → Creates payment transaction

4. Payment Gateway: Payment confirmed
   → Calls Billing Service webhook or event
   POST /api/v1/invoices/{id}/payment-received
   Body: { paymentId, amount, status }

5. Billing Service: Update Invoice
   → Mark invoice as 'paid' or 'partially_paid'
   → Record payment allocation
```

### Query Flow (Billing checks Payment status)

```
Billing Service wants payment status for invoice:

1. Query Payment Gateway:
   GET /api/v1/payments?invoiceId={invoice_id}
   Headers: X-Service-Key: {billing_service_key}

2. Payment Gateway returns:
   {
     payments: [{
       id, invoiceId, amount, status, confirmedAt
     }],
     total: 1
   }

3. Billing Service updates local cache/status
```

---

## 📁 Database Schema

### Billing Service Tables

```sql
-- Core invoice management
- invoices (comprehensive invoice records)
- invoice_line_items (detailed charge items)
- billing_accounts (patient billing records)
- insurance_claims (claims processing)
- claim_line_items (claim details)
- billing_adjustments (adjustments & write-offs)
- billing_audit_log (complete audit trail)

-- Linking table (shared reference)
- invoice_payments (links invoices to Payment Gateway transactions)
```

### Payment Gateway Tables (Reference Only)

```sql
-- Payment Gateway owns these tables:
- payments (transaction records)
- payment_providers (provider configs)
- payment_reconciliation
- payment_refunds
```

**Separation:** Billing Service NEVER writes to `payments` table directly

---

## 🔐 Authentication Pattern

**All Billing Service endpoints use Auth Service:**

```typescript
// Every route must have authentication
import { authenticate } from '../../../shared/middleware/auth';

router.post('/api/v1/invoices',
  authenticate,  // ✅ Validates token with Auth Service
  requirePermission('billing:create'),  // ✅ Checks permission
  createInvoice
);
```

**Service-to-Service Communication:**

```typescript
// Billing → Payment Gateway
const response = await axios.get(
  `${PAYMENT_GATEWAY_URL}/api/v1/payments`,
  {
    headers: {
      'X-Service-Key': process.env.PAYMENT_GATEWAY_API_KEY
    },
    params: { invoiceId }
  }
);
```

---

## 📦 Technology Stack

**Framework:** Express.js + TypeScript  
**Database:** MySQL 8.0 (shared: nilecare database)  
**Authentication:** Centralized via Auth Service  
**Caching:** Redis (optional)  
**Validation:** Joi  
**Logging:** Winston  
**Documentation:** Swagger/OpenAPI  

---

## 🎯 Implementation Principles

1. **Single Source of Truth**: Auth Service for authentication, Payment Gateway for transactions
2. **No Duplication**: Don't replicate payment processing logic
3. **Clear Boundaries**: Billing = records, Payment Gateway = execution
4. **Event-Driven**: Use webhooks/events for payment status updates
5. **Audit Everything**: Complete audit trail for compliance
6. **Dynamic Data**: No hardcoded values, all from database/API
7. **Secure by Default**: All routes authenticated, all sensitive data encrypted

---

## ✅ Compliance Checklist

- [x] Clear service boundaries defined
- [x] No overlap with Payment Gateway
- [x] Integration pattern established
- [x] Authentication strategy defined
- [x] Database schema planned
- [x] Audit logging planned
- [ ] Implementation ready to start

**Status:** ✅ **ARCHITECTURE APPROVED - READY FOR IMPLEMENTATION**

---

*Analysis Complete: October 14, 2025*

