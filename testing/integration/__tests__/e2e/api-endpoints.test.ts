/**
 * END-TO-END API ENDPOINT TESTS
 * 
 * Validates that every API endpoint returns appropriate status codes (not 500 errors).
 * Tests all major endpoints across the platform including authentication, patient management,
 * appointments, lab orders, medications, payments, and error handling.
 * 
 * @group integration
 * @group e2e
 */

import { AxiosInstance } from 'axios';
import { TEST_CONFIG } from '../setup';
import {
  createApiClient,
  authenticateAdmin,
  createAuthHeaders,
  expectNoServerError,
  TEST_UUIDS,
  TIMEOUTS,
} from '../utils/test-helpers';

describe('E2E API Endpoint Tests', () => {
  let authToken: string;
  let apiClient: AxiosInstance;

  beforeAll(async () => {
    try {
      apiClient = createApiClient(TEST_CONFIG.apiGatewayUrl, TIMEOUTS.SHORT);
      authToken = await authenticateAdmin(apiClient);
      
      if (!authToken) {
        throw new Error('Authentication returned empty token');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to set up test environment:', message);
      console.error('   Ensure services are running and test user exists');
      throw new Error(`Test setup failed: ${message}`);
    }
  });

  describe('Authentication Service Endpoints', () => {
    test('POST /api/auth/login - should return 200 or 401, not 500', async () => {
      const response = await apiClient.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect([200, 400, 401, 404]).toContain(response.status);
      expect(response.status).not.toBe(500);
    });

    test('POST /api/auth/register - should return 201, 400, or 409, not 500', async () => {
      const response = await apiClient.post('/api/auth/register', {
        email: `test${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'patient',
        firstName: 'Test',
        lastName: 'User',
      });

      expect([201, 400, 409]).toContain(response.status);
      expect(response.status).not.toBe(500);
    });

    test('POST /api/auth/logout - should return 200 or 401, not 500', async () => {
      const response = await apiClient.post('/api/auth/logout', {}, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      expect([200, 401]).toContain(response.status);
      expect(response.status).not.toBe(500);
    });

    test('GET /api/auth/me - should return 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/auth/me', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      expect([200, 401]).toContain(response.status);
      expect(response.status).not.toBe(500);
    });

    test('POST /api/auth/refresh - should return 200 or 401, not 500', async () => {
      const response = await apiClient.post('/api/auth/refresh', {
        refreshToken: authToken,
      });

      expect([200, 400, 401]).toContain(response.status);
      expect(response.status).not.toBe(500);
    });
  });

  describe('Patient Management Endpoints', () => {
    test('GET /api/patients - returns 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/patients', {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('data');
        expect(Array.isArray(response.data.data) || Array.isArray(response.data)).toBe(true);
      }
    });

    test('POST /api/patients - returns 201, 400, or 401, not 500', async () => {
      const response = await apiClient.post('/api/patients', {
        firstName: 'Ahmed',
        lastName: 'Hassan',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+249123456789',
        email: `patient${Date.now()}@test.com`,
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([201, 400, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('GET /api/patients/:id - returns 200, 404, or 401, not 500', async () => {
      const response = await apiClient.get(`/api/patients/${TEST_UUIDS.PATIENT}`, {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('PUT /api/patients/:id - returns 200, 400, 404, or 401, not 500', async () => {
      const response = await apiClient.put(`/api/patients/${TEST_UUIDS.PATIENT}`, {
        phone: '+249987654321',
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 400, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('DELETE /api/patients/:id - returns 200, 404, or 401, not 500', async () => {
      const response = await apiClient.delete(`/api/patients/${TEST_UUIDS.PATIENT}`, {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });

  describe('Appointment Endpoints', () => {
    test('GET /api/appointments - returns 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/appointments', {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('POST /api/appointments - returns 201, 400, or 401, not 500', async () => {
      const response = await apiClient.post('/api/appointments', {
        patientId: TEST_UUIDS.PATIENT,
        doctorId: TEST_UUIDS.DOCTOR,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        type: 'consultation',
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([201, 400, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('GET /api/appointments/:id - returns 200, 404, or 401, not 500', async () => {
      const response = await apiClient.get(`/api/appointments/${TEST_UUIDS.APPOINTMENT}`, {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });

  describe('Lab Order Endpoints', () => {
    test('GET /api/lab-orders - returns 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/lab-orders', {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('POST /api/lab-orders - returns 201, 400, or 401, not 500', async () => {
      const response = await apiClient.post('/api/lab-orders', {
        patientId: TEST_UUIDS.PATIENT,
        testType: 'blood_test',
        priority: 'normal',
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([201, 400, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });

  describe('Medication Endpoints', () => {
    test('GET /api/medications - returns 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/medications', {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('POST /api/prescriptions - returns 201, 400, or 401, not 500', async () => {
      const response = await apiClient.post('/api/prescriptions', {
        patientId: TEST_UUIDS.PATIENT,
        medications: [{
          medicationId: TEST_UUIDS.MEDICATION,
          dosage: '500mg',
          frequency: 'twice daily',
          duration: '7 days',
        }],
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([201, 400, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });

  describe('Payment Endpoints', () => {
    test('GET /api/payments - returns 200 or 401, not 500', async () => {
      const response = await apiClient.get('/api/payments', {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('POST /api/payments - returns 201, 400, or 401, not 500', async () => {
      const response = await apiClient.post('/api/payments', {
        amount: 100,
        currency: 'SDG',
        paymentMethod: 'card',
        description: 'Test payment',
      }, {
        headers: createAuthHeaders(authToken),
      });

      expect([201, 400, 401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('GET /api/payments/:id - returns 200, 404, or 401, not 500', async () => {
      const response = await apiClient.get(`/api/payments/${TEST_UUIDS.PAYMENT}`, {
        headers: createAuthHeaders(authToken),
      });

      expect([200, 401, 403, 404]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });

  describe('Health Check Endpoints', () => {
    test('GET /health - should return 200', async () => {
      const response = await apiClient.get('/health');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('ok');
    });

    test('GET /api/health - should return 200', async () => {
      const response = await apiClient.get('/api/health');
      
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toHaveProperty('status');
      }
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent-endpoint - returns 404, not 500', async () => {
      const response = await apiClient.get('/api/this-endpoint-does-not-exist');
      
      expect([404]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('POST with invalid JSON - returns 400, not 500', async () => {
      const response = await apiClient.post(
        '/api/patients',
        'this is not valid json',
        {
          headers: {
            'Content-Type': 'application/json',
            ...createAuthHeaders(authToken),
          },
        }
      );

      expect([400]).toContain(response.status);
      expectNoServerError(response.status);
    });

    test('requests with invalid auth token - returns 401, not 500', async () => {
      const response = await apiClient.get('/api/patients', {
        headers: createAuthHeaders('invalid-token-12345'),
      });

      expect([401, 403]).toContain(response.status);
      expectNoServerError(response.status);
    });
  });
});

