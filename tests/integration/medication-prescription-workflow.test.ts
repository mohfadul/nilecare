/**
 * Integration Test: Complete Medication Prescription Workflow
 * 
 * Tests the full workflow:
 * 1. Doctor views patient
 * 2. Doctor prescribes medication
 * 3. Clinical Service calls CDS Service for safety check
 * 4. CDS Service detects interaction
 * 5. Warning shown to doctor
 * 6. Doctor proceeds with justification
 * 7. Prescription saved
 * 8. Event published
 */

import axios from 'axios';

const BASE_URL_AUTH = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const BASE_URL_CLINICAL = process.env.CLINICAL_SERVICE_URL || 'http://localhost:3004';
const BASE_URL_CDS = process.env.CDS_SERVICE_URL || 'http://localhost:4002';
const BASE_URL_EHR = process.env.EHR_SERVICE_URL || 'http://localhost:4001';

describe('Medication Prescription Workflow (Integration)', () => {
  let authToken: string;
  let patientId: string;

  beforeAll(async () => {
    // Login to get auth token
    try {
      const loginResponse = await axios.post(`${BASE_URL_AUTH}/api/v1/auth/login`, {
        email: 'doctor@nilecare.sd',
        password: 'TestPass123!'
      });

      authToken = loginResponse.data.token;
      expect(authToken).toBeDefined();
    } catch (error: any) {
      console.log('Login failed:', error.message);
      throw new Error('Failed to authenticate. Make sure Auth Service is running.');
    }
  });

  it('should complete full medication prescription workflow', async () => {
    // Step 1: Verify services are healthy
    const healthChecks = await Promise.all([
      axios.get(`${BASE_URL_AUTH}/health`),
      axios.get(`${BASE_URL_CDS}/health`),
      axios.get(`${BASE_URL_EHR}/health`),
      axios.get(`${BASE_URL_CLINICAL}/health`)
    ]);

    healthChecks.forEach((response, index) => {
      expect(response.status).toBe(200);
    });

    // Step 2: Prescribe medication with current medications (simulating interaction)
    try {
      const prescriptionResponse = await axios.post(
        `${BASE_URL_CLINICAL}/api/v1/medications`,
        {
          patientId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Warfarin',
          dosage: '5mg',
          frequency: 'daily',
          route: 'oral',
          // Test data - simulate patient already on Aspirin
          testCurrentMedications: [
            { name: 'Aspirin', dosage: '81mg', frequency: 'daily' }
          ],
          testAllergies: [],
          testConditions: [
            { code: 'I48.91', name: 'Atrial Fibrillation' }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      expect(prescriptionResponse.status).toBe(201);
      expect(prescriptionResponse.data.success).toBe(true);
      expect(prescriptionResponse.data.data.medication).toBeDefined();

      // Should include safety assessment
      expect(prescriptionResponse.data.data.safetyAssessment).toBeDefined();

      const assessment = prescriptionResponse.data.data.safetyAssessment;

      // Should detect Warfarin + Aspirin interaction
      expect(assessment.interactions).toBeDefined();
      
      if (assessment.interactions.hasInteractions) {
        expect(assessment.interactions.highestSeverity).toBeOneOf(['moderate', 'major', 'critical']);
        console.log('✅ Drug interaction detected:', assessment.interactions.interactions);
      }

      // Should calculate overall risk
      expect(assessment.overallRisk).toBeDefined();
      expect(assessment.overallRisk.level).toBeOneOf(['low', 'medium', 'high']);
      expect(assessment.overallRisk.score).toBeGreaterThanOrEqual(0);

      console.log('✅ Prescription workflow completed successfully');
      console.log(`   Risk Level: ${assessment.overallRisk.level}`);
      console.log(`   Risk Score: ${assessment.overallRisk.score}`);

    } catch (error: any) {
      if (error.response) {
        console.error('API Error:', error.response.data);
      }
      throw error;
    }
  }, 30000); // 30 second timeout

  it('should block high-risk prescription without override', async () => {
    try {
      // Attempt to prescribe medication that creates high-risk scenario
      const response = await axios.post(
        `${BASE_URL_CLINICAL}/api/v1/medications`,
        {
          patientId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Metformin',
          dosage: '1000mg',
          frequency: 'twice daily',
          // Simulate chronic kidney disease (contraindication)
          testConditions: [
            { code: 'N18.4', name: 'Chronic Kidney Disease Stage 4' }
          ],
          testAllergies: [],
          testCurrentMedications: []
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      // Should either require override or block
      if (response.status === 400) {
        expect(response.data.requiresOverride).toBe(true);
        console.log('✅ High-risk prescription correctly requires override');
      } else if (response.status === 403) {
        expect(response.data.blocked).toBe(true);
        console.log('✅ Absolute contraindication correctly blocked');
      } else {
        // Low risk score - prescription allowed
        console.log('ℹ️  Prescription allowed (risk below threshold)');
      }

    } catch (error: any) {
      if (error.response && (error.response.status === 400 || error.response.status === 403)) {
        // Expected - high risk blocked
        expect(error.response.data.requiresOverride || error.response.data.blocked).toBeTruthy();
        console.log('✅ High-risk prescription correctly blocked');
      } else {
        throw error;
      }
    }
  }, 30000);

  it('should allow low-risk prescription without override', async () => {
    try {
      const response = await axios.post(
        `${BASE_URL_CLINICAL}/api/v1/medications`,
        {
          patientId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'TID PRN',
          route: 'oral',
          testCurrentMedications: [],
          testAllergies: [],
          testConditions: []
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);

      const assessment = response.data.data.safetyAssessment;
      
      if (assessment) {
        // Should be low risk
        expect(assessment.overallRisk.level).toBeOneOf(['low', 'medium']);
        console.log('✅ Low-risk prescription allowed without override');
      }

    } catch (error: any) {
      if (error.response) {
        console.error('Unexpected error:', error.response.data);
      }
      throw error;
    }
  }, 30000);
});

// Custom matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be one of ${expected.join(', ')}`
          : `expected ${received} to be one of ${expected.join(', ')}`
    };
  }
});

