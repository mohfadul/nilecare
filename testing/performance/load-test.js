/**
 * Performance Tests - Load Testing with k6
 * Tests system performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 100 },  // Ramp to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp to 200 users over 2 minutes
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '2m', target: 500 },  // Spike to 500 users
    { duration: '3m', target: 500 },  // Sustain spike
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    // 95% of requests should complete within 200ms
    http_req_duration: ['p(95)<200'],
    // Error rate should be below 1%
    errors: ['rate<0.01'],
    // API response time should be fast
    api_duration: ['p(95)<200'],
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const credentials = {
  email: 'doctor@nilecare.sd',
  password: 'Password123!',
};

/**
 * Setup function - runs once before all tests
 */
export function setup() {
  console.log('Starting load test...');
  return { baseURL: BASE_URL };
}

/**
 * Main test function - runs repeatedly for each virtual user
 */
export default function (data) {
  // Test 1: Health Check
  let response = http.get(`${data.baseURL}/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  sleep(1);

  // Test 2: Login
  const loginStart = Date.now();
  response = http.post(`${data.baseURL}/api/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  loginDuration.add(Date.now() - loginStart);

  if (!loginSuccess) {
    console.error('Login failed, skipping remaining tests');
    return;
  }

  const token = JSON.parse(response.body).token;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  
  sleep(1);

  // Test 3: Get Patients List
  const apiStart = Date.now();
  response = http.get(`${data.baseURL}/api/patients`, { headers });
  check(response, {
    'get patients status is 200': (r) => r.status === 200,
    'get patients returns array': (r) => Array.isArray(JSON.parse(r.body).data),
  });
  errorRate.add(response.status !== 200);
  apiDuration.add(Date.now() - apiStart);
  sleep(1);

  // Test 4: Create Patient
  const patientData = {
    firstName: `Patient${__VU}${__ITER}`,
    lastName: 'LoadTest',
    nationalId: `TEST${Date.now()}`,
    dateOfBirth: '1990-01-01',
    gender: 'male',
    phone: '+249912345678',
  };

  response = http.post(`${data.baseURL}/api/patients`, JSON.stringify(patientData), {
    headers,
  });
  
  const createSuccess = check(response, {
    'create patient status is 201': (r) => r.status === 201,
    'create patient returns id': (r) => JSON.parse(r.body).id !== undefined,
  });
  
  errorRate.add(!createSuccess);
  sleep(1);

  // Test 5: Search Patients
  response = http.get(`${data.baseURL}/api/patients?search=LoadTest`, { headers });
  check(response, {
    'search patients status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  sleep(1);

  // Test 6: Get Appointments
  response = http.get(`${data.baseURL}/api/appointments`, { headers });
  check(response, {
    'get appointments status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  sleep(1);

  // Test 7: Create Appointment
  if (createSuccess) {
    const patientId = JSON.parse(response.body).id;
    const appointmentData = {
      patientId,
      providerId: 1,
      facilityId: 1,
      appointmentDate: '2025-10-15',
      appointmentTime: '10:00',
      reason: 'Load test appointment',
    };

    response = http.post(`${data.baseURL}/api/appointments`, JSON.stringify(appointmentData), {
      headers,
    });
    
    check(response, {
      'create appointment status is 201': (r) => r.status === 201,
    });
    errorRate.add(response.status !== 201);
  }
  sleep(1);

  // Test 8: Get Payment Methods
  response = http.get(`${data.baseURL}/api/payments/methods`, { headers });
  check(response, {
    'get payment methods status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  sleep(1);

  // Test 9: WebSocket Simulation (HTTP polling fallback)
  response = http.get(`${data.baseURL}/api/notifications`, { headers });
  check(response, {
    'get notifications status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  sleep(1);

  // Test 10: Logout
  response = http.post(`${data.baseURL}/api/auth/logout`, null, { headers });
  check(response, {
    'logout status is 200': (r) => r.status === 200,
  });
  errorRate.add(response.status !== 200);
  
  sleep(2);
}

/**
 * Teardown function - runs once after all tests
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Base URL: ${data.baseURL}`);
}

/**
 * Test Scenarios:
 * ===============
 * 
 * 1. Baseline Load (100 users):
 *    - Simulates normal operation
 *    - All APIs should respond < 200ms
 *    - Error rate < 1%
 * 
 * 2. Increased Load (200 users):
 *    - Simulates busy periods
 *    - System should maintain performance
 *    - No degradation expected
 * 
 * 3. Spike Test (500 users):
 *    - Simulates sudden traffic spike
 *    - System should handle gracefully
 *    - Auto-scaling should trigger
 * 
 * Performance Targets:
 * ===================
 * - API Response Time: < 200ms (95th percentile)
 * - Login Duration: < 300ms
 * - Error Rate: < 1%
 * - Throughput: > 1000 requests/second
 * - Concurrent Users: 1000+
 * 
 * To run this test:
 * =================
 * k6 run testing/performance/load-test.js
 * 
 * To run with custom VUs:
 * k6 run --vus 500 --duration 30s testing/performance/load-test.js
 * 
 * To run with cloud:
 * k6 cloud testing/performance/load-test.js
 */

