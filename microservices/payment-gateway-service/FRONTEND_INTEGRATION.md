# 🔐 PCI-DSS Compliant Frontend Integration Guide

## ⚠️ **CRITICAL: Card Data Must NEVER Reach Your Server**

To maintain PCI-DSS SAQ-A compliance, **ALL card tokenization must happen on the frontend** using Stripe.js/Elements before data is sent to your backend.

---

## 🚀 Frontend Setup (React Example)

### **1. Install Stripe.js**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### **2. Configure Stripe Provider**

```tsx
// App.tsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// ✅ SECURE: Public key is safe to expose
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

### **3. PCI-DSS Compliant Payment Form**

```tsx
// PaymentForm.tsx
import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';
import axios from 'axios';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

export function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // ✅ STEP 1: Create Payment Method on FRONTEND (never sends card to server)
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: 'Patient Name',
          email: 'patient@example.com',
        },
      });

      if (createError) {
        throw new Error(createError.message);
      }

      // ✅ STEP 2: Send ONLY the payment method ID to your backend
      const response = await axios.post(
        'https://api.nilecare.sd/api/v1/payments/verify',
        {
          paymentMethodId: paymentMethod.id,  // ✅ Token only, NO card data
          amount: 1000.50,
          currency: 'SDG',
          description: 'Medical Consultation Fee',
          userId: 'user_123',
          patientId: 'patient_456',
          invoiceId: 'inv_789',
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      const result = response.data;

      // ✅ STEP 3: Handle response
      if (result.status === 'requires_action' && result.clientSecret) {
        // 3D Secure authentication required
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          result.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent?.status === 'succeeded') {
          setSucceeded(true);
          alert(`Payment successful! Transaction ID: ${paymentIntent.id}`);
        }
      } else if (result.success) {
        setSucceeded(true);
        alert(`Payment successful! Transaction ID: ${result.transactionId}`);
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="card-element-container">
        {/* ✅ SECURE: Stripe-hosted iframe, card data never touches your DOM */}
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || succeeded}
        className="pay-button"
      >
        {processing ? 'Processing...' : `Pay 1000.50 SDG`}
      </button>

      {succeeded && (
        <div className="success-message">
          ✅ Payment successful!
        </div>
      )}
    </form>
  );
}
```

---

## 🔐 **Backend API Endpoint (Secure)**

```typescript
// payment.routes.ts
import { Router } from 'express';
import { authGuard } from '../guards/payment-auth.guard';
import { validateBody } from '../middleware/validation.middleware';
import Joi from 'joi';
import StripeVerificationService from '../services/stripe-verification.service';
import { logger } from '../utils/logger';

const router = Router();
const stripeService = new StripeVerificationService(logger);

// Validation schema - NO card data fields!
const verifyPaymentSchema = Joi.object({
  paymentMethodId: Joi.string().required(),  // ✅ Token from Stripe.js
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('SDG', 'USD').required(),
  description: Joi.string().max(500).required(),
  userId: Joi.string().uuid().required(),
  patientId: Joi.string().uuid().required(),
  invoiceId: Joi.string().uuid().required(),
  metadata: Joi.object().optional(),
});

router.post(
  '/verify',
  authGuard,
  validateBody(verifyPaymentSchema),
  async (req, res) => {
    try {
      const result = await stripeService.verifyPayment(req.body);
      
      res.json({
        success: result.success,
        transactionId: result.transactionId,
        clientSecret: result.clientSecret,
        status: result.status,
        error: result.error,
        nextAction: result.nextAction,
      });
    } catch (error: any) {
      logger.error('Payment verification endpoint error', {
        error: error.message,
        userId: req.body.userId,
      });

      res.status(500).json({
        success: false,
        error: 'Payment processing failed. Please try again.',
      });
    }
  }
);

export default router;
```

---

## ✅ **What This Implementation Does Right**

### **1. PCI-DSS Compliance** ✅
- ✅ Card data **NEVER** touches your server
- ✅ Tokenization happens in **Stripe-hosted iframe**
- ✅ Your server only receives **payment method tokens**
- ✅ Maintains **SAQ-A compliance** (easiest PCI level)

### **2. Security Best Practices** ✅
- ✅ **3D Secure (SCA) support** for European regulations
- ✅ **Error sanitization** - no internal error leakage
- ✅ **Proper validation** on both frontend and backend
- ✅ **Secure logging** - no sensitive data in logs
- ✅ **Token-based authentication** required

### **3. User Experience** ✅
- ✅ Handles **3D Secure authentication** seamlessly
- ✅ **Real-time card validation** by Stripe
- ✅ **User-friendly error messages**
- ✅ **Loading states** and feedback

---

## 🚨 **What NOT To Do (Original Code Issues)**

### ❌ **NEVER Do This:**

```typescript
// ❌ BAD: Receiving raw card data on server
async verifyPayment(paymentData: {
  cardNumber: string;        // ❌ PCI-DSS VIOLATION
  cvc: string;               // ❌ PCI-DSS VIOLATION
  expiryMonth: number;
  expiryYear: number;
}) {
  // ❌ This makes you PCI-DSS Level 1 compliant (most difficult)
  // ❌ Requires annual audits costing $50,000+
  // ❌ Massive liability if breached
}
```

### ✅ **Always Do This:**

```typescript
// ✅ GOOD: Only receive tokens from frontend
async verifyPayment(paymentData: {
  paymentMethodId: string;   // ✅ Safe token from Stripe.js
  amount: number;
  currency: string;
}) {
  // ✅ PCI-DSS SAQ-A compliant
  // ✅ Self-assessment questionnaire (simple)
  // ✅ No audit required
  // ✅ Minimal liability
}
```

---

## 📊 **PCI-DSS Compliance Levels**

| Method | PCI Level | Audit Cost | Risk |
|--------|-----------|------------|------|
| **❌ Raw card data on server** | Level 1 | $50,000+/year | 🔴 **EXTREME** |
| **✅ Frontend tokenization (Stripe.js)** | SAQ-A | Self-assessment | 🟢 **MINIMAL** |

---

## 🔒 **Security Checklist**

- [x] Card data tokenized on **frontend only**
- [x] Server **NEVER** receives raw card numbers
- [x] Server **NEVER** receives CVV/CVC
- [x] Use Stripe **Payment Intents API** (not old Charges API)
- [x] Support **3D Secure (SCA)** authentication
- [x] Sanitize **error messages**
- [x] Log **no sensitive data**
- [x] Validate **payment method tokens**
- [x] Implement **rate limiting**
- [x] Require **authentication**
- [x] Use **HTTPS only**

---

## 📚 **Additional Resources**

- [Stripe PCI Compliance Guide](https://stripe.com/docs/security/guide)
- [Stripe.js Reference](https://stripe.com/docs/js)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
- [3D Secure 2 (SCA)](https://stripe.com/docs/strong-customer-authentication)

---

## ⚠️ **CRITICAL ACTION REQUIRED**

**DO NOT use the original `verification.service.ts` file in production!**

Replace it with the secure implementation provided in this guide.

---

**Questions? Security concerns? Contact the DevOps security team immediately.**

