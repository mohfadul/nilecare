# 💳 NileCare Payment Gateway Service

**Version:** 2.0.0  
**Port:** 7030  
**Database:** PostgreSQL  
**Status:** ✅ Production Ready

---

## 📋 Overview

The Payment Gateway Service handles all payment processing for the NileCare Healthcare Platform, with specific support for Sudan's payment ecosystem including mobile wallets, local banks, and international payment providers.

### Key Responsibilities

- ✅ **Payment Processing**: Multi-provider payment handling
- ✅ **Sudan Mobile Wallets**: Zain Cash, MTN Money, Sudani Cash, Bankak
- ✅ **Sudan Banks**: Bank of Khartoum, Faisal Islamic Bank, Omdurman National Bank
- ✅ **International Providers**: Stripe, PayPal, Flutterwave
- ✅ **Installment Plans**: Flexible payment plans
- ✅ **Refunds**: Full and partial refund processing
- ✅ **Payment Verification**: Manual and automatic verification
- ✅ **Reconciliation**: Bank statement reconciliation
- ✅ **Fraud Detection**: Risk scoring and fraud prevention
- ✅ **Analytics**: Comprehensive payment analytics

---

## ✨ Features

### Payment Methods

**Sudan Mobile Wallets:**
- Zain Cash
- MTN Money
- Sudani Cash
- Bankak

**Sudan Banking:**
- Bank of Khartoum
- Faisal Islamic Bank
- Omdurman National Bank

**International:**
- Stripe (Credit/Debit cards)
- PayPal
- Flutterwave (African payments)

### Payment Features
- Multiple payment providers support
- Automated payment verification
- Manual payment verification workflow
- Installment plan management
- Recurring payments
- Payment scheduling
- Multi-currency support (SDG, USD, EUR)

### Refund Management
- Full refunds
- Partial refunds
- Refund status tracking
- Automated refund notifications

### Financial Operations
- Invoice generation
- Receipt generation
- Payment reconciliation
- Bank statement import
- Financial reporting
- Export to accounting systems

### Security & Compliance
- PCI DSS compliant architecture
- End-to-end encryption
- Fraud detection and prevention
- Risk scoring
- Audit logging
- GDPR compliance

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Auth Service running on port 7020
- Payment provider accounts (optional for development)

### Installation

```bash
cd microservices/payment-gateway-service
npm install
```

### Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE nilecare;
\q

# Import schema
psql -U postgres -d nilecare < ../../database/postgresql/schema/payment_system.sql
```

### Environment Configuration

Create `.env` file:

```env
NODE_ENV=development
PORT=7030

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilecare
DB_USER=nilecare_user
DB_PASSWORD=your_secure_password

# Auth Service Integration
AUTH_SERVICE_URL=http://localhost:7020
AUTH_SERVICE_API_KEY=<generate-64-char-hex-key>

# Payment Providers - Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Payment Providers - PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live'

# Payment Providers - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key

# Sudan Mobile Wallets (Contact providers for credentials)
ZAIN_CASH_MERCHANT_ID=your_merchant_id
ZAIN_CASH_API_KEY=your_api_key

MTN_MONEY_API_KEY=your_api_key
MTN_MONEY_API_SECRET=your_api_secret

SUDANI_CASH_MERCHANT_ID=your_merchant_id
SUDANI_CASH_API_KEY=your_api_key

# Currency
DEFAULT_CURRENCY=SDG
SUPPORTED_CURRENCIES=SDG,USD,EUR

# Logging
LOG_LEVEL=info
```

### Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Verify Installation

```bash
# Health check
curl http://localhost:7030/health

# Get payment providers
curl -H "Authorization: Bearer <token>" \
  http://localhost:7030/api/payments/providers
```

---

## 📡 API Endpoints

### Payments

#### POST /api/payments
Create new payment.

**Request:**
```json
{
  "patientId": 1,
  "amount": 500.00,
  "currency": "SDG",
  "provider": "zain_cash",
  "description": "Consultation fee",
  "invoiceId": 123
}
```

**Response:**
```json
{
  "paymentId": "pay_abc123",
  "status": "pending",
  "amount": 500.00,
  "currency": "SDG",
  "paymentUrl": "https://payment.provider.com/pay/abc123",
  "expiresAt": "2025-10-15T23:59:59Z"
}
```

#### GET /api/payments/:id
Get payment details.

#### POST /api/payments/:id/verify
Verify payment completion.

#### POST /api/payments/:id/refund
Process refund.

**Request:**
```json
{
  "amount": 500.00,  // Full or partial
  "reason": "Service not provided"
}
```

### Installments

#### POST /api/payments/installments
Create installment plan.

**Request:**
```json
{
  "patientId": 1,
  "totalAmount": 3000.00,
  "downPayment": 500.00,
  "numberOfInstallments": 5,
  "frequency": "monthly",  // weekly, monthly
  "startDate": "2025-11-01"
}
```

#### GET /api/payments/installments/:id
Get installment plan details.

#### POST /api/payments/installments/:id/pay
Pay installment.

### Providers

#### GET /api/payments/providers
Get available payment providers.

**Response:**
```json
{
  "providers": [
    {
      "id": "zain_cash",
      "name": "Zain Cash",
      "type": "mobile_wallet",
      "available": true,
      "currencies": ["SDG"]
    },
    {
      "id": "stripe",
      "name": "Stripe",
      "type": "card",
      "available": true,
      "currencies": ["USD", "EUR"]
    }
  ]
}
```

### Verification

#### POST /api/payments/verify-manual
Manually verify payment.

**Request:**
```json
{
  "paymentId": "pay_abc123",
  "verificationCode": "VERIFY123",
  "verifiedBy": 2
}
```

### Analytics

#### GET /api/payments/analytics
Get payment analytics.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `provider`: Filter by provider

**Response:**
```json
{
  "totalRevenue": 150000.00,
  "totalPayments": 350,
  "successRate": 95.2,
  "averageAmount": 428.57,
  "byProvider": {
    "zain_cash": 45000.00,
    "stripe": 75000.00,
    "mtn_money": 30000.00
  }
}
```

---

## 🗄️ Database Schema

### Main Tables

- **payments**: Payment transactions
- **installment_plans**: Installment plan details
- **installment_payments**: Individual installment payments
- **refunds**: Refund records
- **payment_verifications**: Manual verification records
- **reconciliations**: Bank reconciliation records
- **fraud_checks**: Fraud detection logs

### Key Indexes

```sql
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);
CREATE INDEX idx_payments_provider ON payments(provider);
```

---

## 💰 Payment Flow

### Standard Payment Flow

```
1. Create Payment → Generate payment link/form
2. Customer pays via provider
3. Provider webhook → Update payment status
4. Verify payment (auto or manual)
5. Update invoice status
6. Send receipt to customer
```

### Installment Payment Flow

```
1. Create installment plan
2. Process down payment
3. Schedule future payments
4. Automated reminders before due date
5. Process each installment
6. Mark plan as complete when finished
```

---

## 🔌 Integration Examples

### Frontend Integration (React)

```typescript
// Create payment
async function processPayment(paymentData) {
  const response = await axios.post(
    'http://localhost:7030/api/payments',
    paymentData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  // Redirect to payment URL
  window.location.href = response.data.paymentUrl;
}

// Check payment status
async function checkPaymentStatus(paymentId) {
  const response = await axios.get(
    `http://localhost:7030/api/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data.status; // 'pending', 'completed', 'failed'
}
```

### Webhook Handling

```typescript
// Stripe webhook
router.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'payment_intent.succeeded') {
      await updatePaymentStatus(event.data.object.id, 'completed');
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

---

## 🔒 Security

### PCI Compliance
- Never store credit card numbers
- Use tokenization for card payments
- Encrypt sensitive data at rest
- Use HTTPS for all communications

### Fraud Prevention
```typescript
// Risk scoring example
function calculateRiskScore(payment) {
  let score = 0;
  
  // Check amount
  if (payment.amount > 10000) score += 20;
  
  // Check frequency
  const recentPayments = getRecentPayments(payment.patientId, '1h');
  if (recentPayments.length > 3) score += 30;
  
  // Check provider
  if (payment.provider === 'new_provider') score += 10;
  
  return score; // 0-100, higher = riskier
}
```

---

## 🧪 Testing

### Test Cards (Stripe)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

### Test Mode

```env
# Enable test mode
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_MODE=sandbox
```

---

## 📊 Monitoring

### Key Metrics

- Payment success rate
- Average payment amount
- Revenue by provider
- Failed payment reasons
- Refund rate
- Fraud detection hits

### Alerts

Set up alerts for:
- Payment success rate drops below 90%
- Fraud score above 70
- Multiple failed payments for same user
- Provider downtime

---

## 🐛 Troubleshooting

### "Payment provider unavailable"

**Solution:**
```bash
# Check provider credentials
echo $STRIPE_SECRET_KEY
echo $PAYPAL_CLIENT_ID

# Test provider connection
curl https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

### "Webhook verification failed"

**Solution:**
```typescript
// Ensure webhook secret is correct
STRIPE_WEBHOOK_SECRET=whsec_...

// Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:7030/webhooks/stripe
```

---

## 📚 Related Documentation

- [Authentication Guide](../../AUTHENTICATION.md)
- [Quick Start](../../QUICKSTART.md)
- [Deployment Guide](../../DEPLOYMENT.md)
- [Main README](../../README.md)

---

## 📞 Support

- 📧 Email: payments@nilecare.sd
- 💳 Payment Issues: billing@nilecare.sd
- 📖 Documentation: https://docs.nilecare.sd

---

**Last Updated:** October 15, 2025  
**Version:** 2.0.0  
**Port:** 7030  
**Maintained by:** NileCare Payment Team


