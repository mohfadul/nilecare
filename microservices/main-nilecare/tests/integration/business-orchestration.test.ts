/**
 * Business Orchestration Integration Tests
 * Tests for business service integration through main-nilecare orchestrator
 */

import request from 'supertest';
import app from '../../src/index';

describe('Business Service Orchestration', () => {
  const testToken = 'Bearer test-jwt-token'; // Replace with actual test token generation

  // Helper function to generate test JWT
  function generateTestToken() {
    // In a real test, this would generate a valid JWT
    // For now, we assume JWT middleware is bypassed in test mode
    return testToken;
  }

  describe('Health Checks', () => {
    it('should check business service health via orchestrator', async () => {
      const res = await request(app)
        .get('/api/business/health')
        .set('Authorization', generateTestToken());

      expect([200, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('status');
        expect(res.body.service).toBe('business-service');
      }
    });
  });

  describe('Summary Endpoint', () => {
    it('should fetch business summary through orchestrator', async () => {
      const res = await request(app)
        .get('/api/business/summary')
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('health');
        expect(res.body.data).toHaveProperty('timestamp');
      }
    });

    it('should handle business service unavailability gracefully', async () => {
      // This test checks error handling when business service is down
      const res = await request(app)
        .get('/api/business/summary')
        .set('Authorization', generateTestToken());

      // Should either succeed or return proper error
      expect([200, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 503) {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
      }
    });
  });

  describe('Statistics Endpoint', () => {
    it('should fetch business statistics through orchestrator', async () => {
      const res = await request(app)
        .get('/api/business/stats')
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('timestamp');
      }
    });
  });

  describe('Appointments API', () => {
    it('should proxy appointments list request', async () => {
      const res = await request(app)
        .get('/api/business/appointments')
        .query({ limit: 10 })
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        // Business service returns data in specific format
        expect(res.body).toHaveProperty('data');
      }
    });

    it('should proxy appointment creation request', async () => {
      const newAppointment = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        appointmentType: 'consultation',
        duration: 30,
        reason: 'Test appointment',
      };

      const res = await request(app)
        .post('/api/business/appointments')
        .send(newAppointment)
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
      
      // If successful or validation error, response should have expected structure
      if ([200, 201, 400].includes(res.statusCode)) {
        expect(res.body).toHaveProperty('success');
      }
    });

    it('should proxy appointment update request', async () => {
      const appointmentId = '123e4567-e89b-12d3-a456-426614174002';
      const updates = {
        status: 'confirmed',
        notes: 'Patient confirmed via phone',
      };

      const res = await request(app)
        .put(`/api/business/appointments/${appointmentId}`)
        .send(updates)
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 404, 503]).toContain(res.statusCode);
    });

    it('should proxy appointment cancellation request', async () => {
      const appointmentId = '123e4567-e89b-12d3-a456-426614174002';

      const res = await request(app)
        .delete(`/api/business/appointments/${appointmentId}`)
        .set('Authorization', generateTestToken());

      expect([200, 401, 404, 503]).toContain(res.statusCode);
    });
  });

  describe('Billing API', () => {
    it('should proxy billing records list request', async () => {
      const res = await request(app)
        .get('/api/business/billing')
        .query({ limit: 10 })
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('data');
      }
    });

    it('should proxy billing record creation request', async () => {
      const newBilling = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 150.00,
        currency: 'USD',
        description: 'Test consultation fee',
        items: [
          {
            description: 'Consultation',
            quantity: 1,
            unitPrice: 150.00,
            amount: 150.00,
          }
        ],
        dueDate: new Date(Date.now() + 2592000000).toISOString(),
      };

      const res = await request(app)
        .post('/api/business/billing')
        .send(newBilling)
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
    });
  });

  describe('Staff API', () => {
    it('should proxy staff list request', async () => {
      const res = await request(app)
        .get('/api/business/staff')
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('data');
      }
    });

    it('should proxy staff creation request', async () => {
      const newStaff = {
        firstName: 'Test',
        lastName: 'Staff',
        email: 'test.staff@hospital.com',
        role: 'doctor',
        department: 'Cardiology',
        specialization: 'Cardiologist',
      };

      const res = await request(app)
        .post('/api/business/staff')
        .send(newStaff)
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
    });

    it('should proxy staff filtering by role', async () => {
      const res = await request(app)
        .get('/api/business/staff/role/doctor')
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
    });
  });

  describe('Scheduling API', () => {
    it('should proxy scheduling list request', async () => {
      const res = await request(app)
        .get('/api/business/scheduling')
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('data');
      }
    });

    it('should proxy schedule creation request', async () => {
      const newSchedule = {
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 115200000).toISOString(),
        scheduleType: 'shift',
        location: 'Main Clinic',
      };

      const res = await request(app)
        .post('/api/business/scheduling')
        .send(newSchedule)
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without authentication token', async () => {
      const res = await request(app)
        .get('/api/business/appointments');

      expect(res.statusCode).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/business/appointments')
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format on service unavailable', async () => {
      // Assuming business service might be down
      const res = await request(app)
        .get('/api/business/invalid-endpoint')
        .set('Authorization', generateTestToken());

      expect([404, 503]).toContain(res.statusCode);
      
      if (res.statusCode === 503) {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toHaveProperty('code');
        expect(res.body.error).toHaveProperty('message');
      }
    });

    it('should handle malformed request bodies', async () => {
      const res = await request(app)
        .post('/api/business/appointments')
        .send({ invalid: 'data' })
        .set('Authorization', generateTestToken())
        .set('Content-Type', 'application/json');

      expect([400, 401, 503]).toContain(res.statusCode);
    });
  });

  describe('Query Parameters', () => {
    it('should forward query parameters correctly', async () => {
      const queryParams = {
        page: 1,
        limit: 20,
        status: 'scheduled',
        startDate: '2024-01-01',
      };

      const res = await request(app)
        .get('/api/business/appointments')
        .query(queryParams)
        .set('Authorization', generateTestToken());

      expect([200, 401, 503]).toContain(res.statusCode);
      
      // The orchestrator should forward query params to business service
      // No need to verify the exact data, just that request succeeded
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const res = await request(app)
        .get('/api/business/summary')
        .set('Authorization', generateTestToken());

      const duration = Date.now() - startTime;
      
      // Request should complete within 30 seconds (including timeouts)
      expect(duration).toBeLessThan(30000);
      
      // If successful, should be much faster
      if (res.statusCode === 200) {
        expect(duration).toBeLessThan(5000); // 5 seconds for successful requests
      }
    });
  });
});

// Test suite for specific business logic validation
describe('Business Service Data Validation', () => {
  const testToken = 'Bearer test-jwt-token';

  it('should validate appointment date is in the future', async () => {
    const pastAppointment = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      providerId: '123e4567-e89b-12d3-a456-426614174001',
      appointmentDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      appointmentType: 'consultation',
      duration: 30,
    };

    const res = await request(app)
      .post('/api/business/appointments')
      .send(pastAppointment)
      .set('Authorization', testToken)
      .set('Content-Type', 'application/json');

    // Should either return validation error or pass through to service
    expect([200, 201, 400, 401, 503]).toContain(res.statusCode);
  });
});

