// k6 Load Test for Billing and Payment Services
// Tests: Invoice creation and payment processing under load

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const invoiceCreationTime = new Trend('invoice_creation_time');
const paymentProcessingTime = new Trend('payment_processing_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 30 },   // Ramp up to 30 users
    { duration: '5m', target: 30 },   // Stay at 30 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'], // Billing operations can be slower
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
    invoice_creation_time: ['p(95)<1500'],
    payment_processing_time: ['p(95)<2500'],
  },
};

const AUTH_URL = __ENV.AUTH_SERVICE_URL || 'http://localhost:7020';
const BILLING_URL = __ENV.BILLING_SERVICE_URL || 'http://localhost:7050';
const PAYMENT_URL = __ENV.PAYMENT_SERVICE_URL || 'http://localhost:7030';

// Test credentials
const testUser = {
  email: 'test@nilecare.sd',
  password: 'Test123!@#',
};

export default function () {
  // Step 1: Authenticate
  const loginPayload = JSON.stringify({
    email: testUser.email,
    password: testUser.password,
  });

  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  };

  const loginResponse = http.post(`${AUTH_URL}/api/auth/login`, loginPayload, loginParams);

  if (!check(loginResponse, { 'login successful': (r) => r.status === 200 })) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const token = loginResponse.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Step 2: Create Invoice
  const invoicePayload = JSON.stringify({
    patientId: Math.floor(Math.random() * 1000) + 1,
    facilityId: Math.floor(Math.random() * 10) + 1,
    items: [
      {
        description: 'Consultation',
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
      {
        description: 'Lab Test - Complete Blood Count',
        quantity: 1,
        unitPrice: 300,
        amount: 300,
      },
    ],
    subtotal: 800,
    tax: 80,
    totalAmount: 880,
  });

  const invoiceParams = {
    headers: authHeaders,
    tags: { name: 'CreateInvoice' },
  };

  const invoiceStartTime = Date.now();
  const invoiceResponse = http.post(
    `${BILLING_URL}/api/invoices`,
    invoicePayload,
    invoiceParams
  );
  const invoiceEndTime = Date.now();

  invoiceCreationTime.add(invoiceEndTime - invoiceStartTime);

  const invoiceSuccess = check(invoiceResponse, {
    'invoice created': (r) => r.status === 201,
    'invoice has ID': (r) => r.json('id') !== undefined,
    'invoice creation < 1500ms': (r) => (invoiceEndTime - invoiceStartTime) < 1500,
  });

  errorRate.add(!invoiceSuccess);

  if (!invoiceSuccess) {
    sleep(1);
    return;
  }

  const invoiceId = invoiceResponse.json('id');

  // Step 3: Process Payment
  const paymentPayload = JSON.stringify({
    invoiceId: invoiceId,
    amount: 880,
    paymentMethod: 'credit_card',
    paymentProvider: 'stripe',
    paymentDetails: {
      cardNumber: '4242424242424242',
      cardholderName: 'Test User',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
    },
  });

  const paymentParams = {
    headers: authHeaders,
    tags: { name: 'ProcessPayment' },
  };

  const paymentStartTime = Date.now();
  const paymentResponse = http.post(
    `${PAYMENT_URL}/api/payments`,
    paymentPayload,
    paymentParams
  );
  const paymentEndTime = Date.now();

  paymentProcessingTime.add(paymentEndTime - paymentStartTime);

  const paymentSuccess = check(paymentResponse, {
    'payment processed': (r) => r.status === 200 || r.status === 201,
    'payment has ID': (r) => r.json('id') !== undefined,
    'payment processing < 2500ms': (r) => (paymentEndTime - paymentStartTime) < 2500,
  });

  errorRate.add(!paymentSuccess);

  if (paymentSuccess) {
    // Step 4: Verify Invoice Status Updated
    const verifyParams = {
      headers: authHeaders,
      tags: { name: 'VerifyInvoice' },
    };

    const verifyResponse = http.get(
      `${BILLING_URL}/api/invoices/${invoiceId}`,
      verifyParams
    );

    check(verifyResponse, {
      'invoice retrieved': (r) => r.status === 200,
      'invoice status updated': (r) => r.json('status') === 'paid' || r.json('status') === 'processing',
    });
  }

  // Think time
  sleep(Math.random() * 2 + 1);
}

export function setup() {
  console.log('Starting Billing-Payment load test...');
  
  // Health checks
  const billingHealth = http.get(`${BILLING_URL}/health`);
  const paymentHealth = http.get(`${PAYMENT_URL}/health`);
  
  if (billingHealth.status !== 200 || paymentHealth.status !== 200) {
    throw new Error('Services are not healthy. Aborting test.');
  }
  
  return { startTime: new Date() };
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`\nTest completed in ${duration} seconds`);
  console.log('\nKey Metrics:');
  console.log('  - Invoice creation time (p95): See summary');
  console.log('  - Payment processing time (p95): See summary');
}

