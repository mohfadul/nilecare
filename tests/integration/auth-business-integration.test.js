// Auth-Business Service Integration Test
// Tests: User registration → Business profile creation

const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010';

describe('Auth-Business Integration Tests', () => {
  let authToken;
  let userId;
  let businessId;

  // Test data
  const testUser = {
    email: `test_${Date.now()}@nilecare.sd`,
    password: 'Test123!@#',
    firstName: 'Integration',
    lastName: 'Test'
  };

  const testBusiness = {
    businessName: 'NileCare Test Clinic',
    type: 'clinic',
    address: '123 Test St, Khartoum, Sudan',
    phone: '+249123456789'
  };

  describe('1. User Registration Flow', () => {
    test('Should register a new user via Auth Service', async () => {
      const response = await request(AUTH_SERVICE_URL)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);

      authToken = response.body.token;
      userId = response.body.user.id;
    }, 10000);

    test('Should not allow duplicate email registration', async () => {
      const response = await request(AUTH_SERVICE_URL)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(409); // Conflict
      expect(response.body).toHaveProperty('error');
    }, 10000);
  });

  describe('2. User Login Flow', () => {
    test('Should login with correct credentials', async () => {
      const response = await request(AUTH_SERVICE_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeTruthy();
    }, 10000);

    test('Should reject login with wrong password', async () => {
      const response = await request(AUTH_SERVICE_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401); // Unauthorized
    }, 10000);
  });

  describe('3. Token Validation Across Services', () => {
    test('Should validate token in Business Service', async () => {
      const response = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      // Should either return profile or 404 (profile not created yet)
      expect([200, 404]).toContain(response.status);
    }, 10000);

    test('Should reject invalid token', async () => {
      const response = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile')
        .set('Authorization', 'Bearer invalid_token_12345');

      expect(response.status).toBe(401); // Unauthorized
    }, 10000);

    test('Should reject missing token', async () => {
      const response = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile');

      expect(response.status).toBe(401); // Unauthorized
    }, 10000);
  });

  describe('4. Business Profile Creation', () => {
    test('Should create business profile with valid token', async () => {
      const response = await request(BUSINESS_SERVICE_URL)
        .post('/api/business/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBusiness)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.businessName).toBe(testBusiness.businessName);
      expect(response.body.userId).toBe(userId);

      businessId = response.body.id;
    }, 10000);

    test('Should retrieve business profile', async () => {
      const response = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(businessId);
      expect(response.body.businessName).toBe(testBusiness.businessName);
    }, 10000);
  });

  describe('5. User-Business Relationship', () => {
    test('Should link user ID to business profile', async () => {
      const businessResponse = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(businessResponse.body.userId).toBe(userId);
    }, 10000);

    test('Should access business via user authentication', async () => {
      // Login again to get fresh token
      const loginResponse = await request(AUTH_SERVICE_URL)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      const newToken = loginResponse.body.token;

      // Access business with new token
      const businessResponse = await request(BUSINESS_SERVICE_URL)
        .get('/api/business/profile')
        .set('Authorization', `Bearer ${newToken}`);

      expect(businessResponse.status).toBe(200);
      expect(businessResponse.body.id).toBe(businessId);
    }, 10000);
  });

  describe('6. Error Handling', () => {
    test('Should handle Auth Service unavailable gracefully', async () => {
      const response = await request('http://localhost:9999') // Non-existent service
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .timeout(3000);

      // Should timeout or connection refused
      expect(response.status).toBe(0); // No response
    }, 10000);
  });

  // Cleanup
  afterAll(async () => {
    // Clean up test data
    // Note: Add cleanup endpoints in services for testing
    console.log('Test completed. Manual cleanup may be required.');
    console.log(`Test User ID: ${userId}`);
    console.log(`Test Business ID: ${businessId}`);
  });
});

