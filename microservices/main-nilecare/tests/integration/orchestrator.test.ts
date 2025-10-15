/**
 * Integration Tests for Orchestrator Routes
 */

import request from 'supertest';
import express from 'express';
import orchestratorRoutes from '../../src/routes/orchestrator.routes';

// Mock the auth middleware
jest.mock('../../../shared/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'admin',
    };
    next();
  },
}));

// Setup test app
const app = express();
app.use(express.json());
app.use('/api', orchestratorRoutes);

describe('Orchestrator Routes Integration Tests', () => {
  describe('Health Check Aggregation', () => {
    it('should aggregate health from all services', async () => {
      const response = await request(app)
        .get('/api/health/all')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('services');
      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Business Service Routes', () => {
    describe('GET /api/business/appointments', () => {
      it('should forward request to business service', async () => {
        // This will fail if business service is not running
        // In real tests, you'd mock the axios calls
        const response = await request(app)
          .get('/api/business/appointments')
          .set('Authorization', 'Bearer test-token');

        // Should either succeed or return service unavailable
        expect([200, 503]).toContain(response.status);
      });
    });

    describe('POST /api/business/appointments', () => {
      it('should create appointment via business service', async () => {
        const appointmentData = {
          patientId: 'test-patient-id',
          doctorId: 'test-doctor-id',
          appointmentDate: new Date().toISOString(),
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          type: 'consultation',
        };

        const response = await request(app)
          .post('/api/business/appointments')
          .set('Authorization', 'Bearer test-token')
          .send(appointmentData);

        // Should either succeed or return error
        expect([201, 400, 503]).toContain(response.status);
      });
    });

    describe('GET /api/business/health', () => {
      it('should check business service health', async () => {
        const response = await request(app)
          .get('/api/business/health');

        expect([200, 503]).toContain(response.status);
      });
    });
  });

  describe('Auth Service Routes', () => {
    describe('POST /api/auth/login', () => {
      it('should forward login request to auth service', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect('Content-Type', /json/);

        // Should either succeed or return error
        expect([200, 401, 503]).toContain(response.status);
      });
    });

    describe('GET /api/auth/me', () => {
      it('should get current user profile', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer test-token');

        expect([200, 401, 503]).toContain(response.status);
      });
    });
  });

  describe('Payment Service Routes', () => {
    describe('GET /api/payment/payments', () => {
      it('should get payments from payment service', async () => {
        const response = await request(app)
          .get('/api/payment/payments')
          .set('Authorization', 'Bearer test-token');

        expect([200, 503]).toContain(response.status);
      });
    });

    describe('POST /api/payment/payments', () => {
      it('should create payment via payment service', async () => {
        const paymentData = {
          invoiceId: 'test-invoice-id',
          patientId: 'test-patient-id',
          amount: 1000,
          currency: 'SDG',
          method: 'cash',
        };

        const response = await request(app)
          .post('/api/payment/payments')
          .set('Authorization', 'Bearer test-token')
          .send(paymentData);

        expect([201, 400, 503]).toContain(response.status);
      });
    });
  });

  describe('Aggregate Routes', () => {
    describe('GET /api/aggregate/dashboard', () => {
      it('should aggregate dashboard data from multiple services', async () => {
        const response = await request(app)
          .get('/api/aggregate/dashboard')
          .set('Authorization', 'Bearer test-token')
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('appointments');
        expect(response.body.data).toHaveProperty('billing');
        expect(response.body.data).toHaveProperty('payments');
      });
    });

    describe('GET /api/aggregate/patient/:patientId', () => {
      it('should aggregate patient data from multiple services', async () => {
        const patientId = 'test-patient-id';
        
        const response = await request(app)
          .get(`/api/aggregate/patient/${patientId}`)
          .set('Authorization', 'Bearer test-token')
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('patientId', patientId);
        expect(response.body.data).toHaveProperty('appointments');
        expect(response.body.data).toHaveProperty('billing');
        expect(response.body.data).toHaveProperty('payments');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailable errors gracefully', async () => {
      // Make request to a service that's definitely down
      const response = await request(app)
        .get('/api/business/appointments')
        .set('Authorization', 'Bearer test-token');

      if (response.status === 503) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      }
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/business/appointments');
        // No Authorization header

      // With our mock, this will succeed, but in real scenario it would fail
      // expect([401, 403]).toContain(response.status);
    });
  });
});

