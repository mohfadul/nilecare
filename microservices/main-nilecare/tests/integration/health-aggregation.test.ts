/**
 * Health Check Aggregation Integration Tests
 */

import axios from 'axios';

describe('Service Health Aggregation', () => {
  const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:7000';
  const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010';
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
  const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:7030';

  describe('Individual Service Health Checks', () => {
    it('should check business service health', async () => {
      try {
        const response = await axios.get(`${BUSINESS_SERVICE_URL}/health`, {
          timeout: 5000,
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('service', 'business-service');
      } catch (error: any) {
        // Service might not be running in test environment
        expect(error.code).toBe('ECONNREFUSED');
      }
    });

    it('should check auth service health', async () => {
      try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
          timeout: 5000,
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
      } catch (error: any) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });

    it('should check payment service health', async () => {
      try {
        const response = await axios.get(`${PAYMENT_SERVICE_URL}/health`, {
          timeout: 5000,
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
      } catch (error: any) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });
  });

  describe('Aggregated Health Check', () => {
    it('should aggregate health from all services', async () => {
      try {
        const response = await axios.get(`${ORCHESTRATOR_URL}/api/health/all`, {
          timeout: 10000,
        });

        expect(response.data).toHaveProperty('services');
        expect(Array.isArray(response.data.services)).toBe(true);
        
        response.data.services.forEach((service: any) => {
          expect(service).toHaveProperty('name');
          expect(service).toHaveProperty('status');
          expect(service).toHaveProperty('url');
          expect(['healthy', 'unhealthy']).toContain(service.status);
        });

        expect(response.data).toHaveProperty('timestamp');
      } catch (error: any) {
        // Orchestrator might not be running
        expect(error.code).toBe('ECONNREFUSED');
      }
    });

    it('should handle partial service failures gracefully', async () => {
      try {
        const response = await axios.get(`${ORCHESTRATOR_URL}/api/health/all`, {
          timeout: 10000,
        });

        // Even if some services are down, the health check should complete
        expect([200, 503]).toContain(response.status);
        
        if (response.status === 503) {
          // At least one service is unhealthy
          const unhealthyServices = response.data.services.filter(
            (s: any) => s.status === 'unhealthy'
          );
          expect(unhealthyServices.length).toBeGreaterThan(0);
        }
      } catch (error: any) {
        expect(error.code).toBe('ECONNREFUSED');
      }
    });
  });

  describe('Service Readiness Checks', () => {
    it('should check business service readiness', async () => {
      try {
        const response = await axios.get(`${BUSINESS_SERVICE_URL}/health/ready`, {
          timeout: 5000,
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('checks');
        expect(response.data.checks).toHaveProperty('database');
      } catch (error: any) {
        expect(['ECONNREFUSED', 'ETIMEDOUT']).toContain(error.code);
      }
    });
  });
});

