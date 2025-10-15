// k6 Load Test for Auth Service
// Tests: Login endpoint under various load conditions

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users for 3 minutes
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users for 3 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% of requests should fail
    errors: ['rate<0.05'],                           // Less than 5% error rate
  },
};

const BASE_URL = __ENV.AUTH_SERVICE_URL || 'http://localhost:7020';

// Test data
const testUsers = [
  { email: 'admin@nilecare.sd', password: 'Admin123!@#' },
  { email: 'doctor@nilecare.sd', password: 'Doctor123!@#' },
  { email: 'receptionist@nilecare.sd', password: 'Reception123!@#' },
  { email: 'nurse@nilecare.sd', password: 'Nurse123!@#' },
];

export default function () {
  // Select random user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  // Test 1: Login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'Login' },
  };

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login has token': (r) => r.json('token') !== undefined,
    'login has user data': (r) => r.json('user') !== undefined,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    const token = loginResponse.json('token');

    // Test 2: Get User Profile
    const profileParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      tags: { name: 'GetProfile' },
    };

    const profileResponse = http.get(`${BASE_URL}/api/auth/profile`, profileParams);

    const profileSuccess = check(profileResponse, {
      'profile status is 200': (r) => r.status === 200,
      'profile response time < 300ms': (r) => r.timings.duration < 300,
      'profile has user data': (r) => r.json('email') !== undefined,
    });

    errorRate.add(!profileSuccess);

    // Test 3: Validate Token
    const validateParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      tags: { name: 'ValidateToken' },
    };

    const validateResponse = http.get(`${BASE_URL}/api/auth/validate`, validateParams);

    const validateSuccess = check(validateResponse, {
      'validate status is 200': (r) => r.status === 200,
      'validate response time < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!validateSuccess);
  }

  // Think time (simulate user reading/thinking)
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting Auth Service load test...');
  console.log(`Target: ${BASE_URL}`);
  console.log('Test configuration:', JSON.stringify(options.stages, null, 2));
  
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('Auth Service is not healthy. Aborting test.');
  }
  
  return { startTime: new Date() };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`\nTest completed in ${duration} seconds`);
}

// Handle summary (custom summary output)
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, opts) {
  const indent = opts.indent || '';
  const enableColors = opts.enableColors !== false;
  
  let summary = `\n${indent}Test Summary:\n`;
  summary += `${indent}  Scenarios: ${data.metrics.scenarios.values.count}\n`;
  summary += `${indent}  Iterations: ${data.metrics.iterations.values.count}\n`;
  summary += `${indent}  Virtual Users: ${data.metrics.vus.values.value}\n`;
  summary += `${indent}  Request Duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  Request Duration (p99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Request Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  
  return summary;
}

