/**
 * Integration Test: Clinical Documentation Workflow
 * 
 * Tests the full documentation workflow:
 * 1. Create SOAP note (draft)
 * 2. Update SOAP note
 * 3. Finalize SOAP note
 * 4. Add problem to problem list
 * 5. Create progress note
 * 6. Export documentation
 */

import axios from 'axios';

const BASE_URL_AUTH = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
const BASE_URL_EHR = process.env.EHR_SERVICE_URL || 'http://localhost:4001';

describe('Clinical Documentation Workflow (Integration)', () => {
  let authToken: string;
  let soapNoteId: string;
  let problemListId: string;
  let progressNoteId: string;

  const testPatientId = '550e8400-e29b-41d4-a716-446655440000';
  const testEncounterId = '660e8400-e29b-41d4-a716-446655440001';

  beforeAll(async () => {
    // Login
    try {
      const loginResponse = await axios.post(`${BASE_URL_AUTH}/api/v1/auth/login`, {
        email: 'doctor@nilecare.sd',
        password: 'TestPass123!'
      });
      authToken = loginResponse.data.token;
    } catch (error: any) {
      throw new Error('Failed to authenticate');
    }
  });

  it('should verify EHR Service is healthy', async () => {
    const response = await axios.get(`${BASE_URL_EHR}/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
  });

  it('should create SOAP note in draft status', async () => {
    const response = await axios.post(
      `${BASE_URL_EHR}/api/v1/soap-notes`,
      {
        patientId: testPatientId,
        encounterId: testEncounterId,
        subjective: 'Patient reports persistent cough for 2 weeks. No fever, no chest pain.',
        objective: 'Vital Signs: BP 120/80, HR 72, Temp 98.6°F, RR 16, SpO2 98%. Lungs: Clear to auscultation bilaterally. No wheezing or crackles.',
        assessment: 'Likely post-viral cough. Rule out bronchitis. No signs of pneumonia.',
        plan: 'Dextromethorphan 10-20mg PO Q4H PRN for cough. Increase fluids. Follow-up in 1 week if not improving. Return immediately if fever develops or breathing difficulty.',
        chiefComplaint: 'Persistent cough',
        vitalSigns: {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          temperature: 98.6,
          respiratoryRate: 16,
          oxygenSaturation: 98
        },
        diagnoses: [
          { code: 'R05', description: 'Cough', type: 'primary' }
        ],
        tags: ['respiratory', 'outpatient']
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toBeDefined();
    expect(response.data.data.status).toBe('draft');

    soapNoteId = response.data.data.id;

    console.log('✅ SOAP note created:', soapNoteId);
  }, 15000);

  it('should update draft SOAP note', async () => {
    if (!soapNoteId) {
      throw new Error('SOAP note not created in previous test');
    }

    const response = await axios.put(
      `${BASE_URL_EHR}/api/v1/soap-notes/${soapNoteId}`,
      {
        assessment: 'Post-viral cough. Chest X-ray normal. No treatment needed beyond symptomatic relief.'
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.assessment).toContain('Chest X-ray normal');

    console.log('✅ SOAP note updated');
  }, 15000);

  it('should finalize SOAP note', async () => {
    if (!soapNoteId) {
      throw new Error('SOAP note not created');
    }

    const response = await axios.post(
      `${BASE_URL_EHR}/api/v1/soap-notes/${soapNoteId}/finalize`,
      {
        attestation: 'I attest that this note accurately reflects the patient encounter and my clinical judgment.',
        signature: 'Dr. Test Doctor, MD'
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.status).toBe('finalized');
    expect(response.data.data.finalizedAt).toBeDefined();

    console.log('✅ SOAP note finalized');
  }, 15000);

  it('should add problem to problem list', async () => {
    const response = await axios.post(
      `${BASE_URL_EHR}/api/v1/problem-list`,
      {
        patientId: testPatientId,
        problemName: 'Essential Hypertension',
        icdCode: 'I10',
        severity: 'moderate',
        status: 'chronic',
        category: 'diagnosis',
        priority: 'high',
        isChronicCondition: true,
        requiresMonitoring: true,
        monitoringInterval: '3 months',
        notes: 'Diagnosed today. Patient has family history of hypertension.',
        tags: ['cardiovascular', 'chronic']
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.problemName).toBe('Essential Hypertension');
    expect(response.data.data.icdCode).toBe('I10');
    expect(response.data.data.status).toBe('chronic');

    problemListId = response.data.data.id;

    console.log('✅ Problem added to problem list:', problemListId);
  }, 15000);

  it('should create progress note', async () => {
    const response = await axios.post(
      `${BASE_URL_EHR}/api/v1/progress-notes`,
      {
        patientId: testPatientId,
        encounterId: testEncounterId,
        noteType: 'daily',
        content: 'Patient tolerated first day of treatment well. No adverse reactions noted. BP improved to 130/85. Continue current regimen.',
        condition: 'improving',
        vitalSigns: {
          bloodPressure: { systolic: 130, diastolic: 85 },
          heartRate: 75,
          temperature: 98.4
        },
        observations: [
          'Patient appears comfortable',
          'No respiratory distress',
          'Tolerating oral medications'
        ],
        followUpNeeded: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        followUpInstructions: 'Recheck BP and adjust medications if needed',
        tags: ['daily-round', 'stable']
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.noteType).toBe('daily');
    expect(response.data.data.condition).toBe('improving');

    progressNoteId = response.data.data.id;

    console.log('✅ Progress note created:', progressNoteId);
  }, 15000);

  it('should export SOAP note to HTML', async () => {
    if (!soapNoteId) {
      throw new Error('SOAP note not created');
    }

    const response = await axios.post(
      `${BASE_URL_EHR}/api/v1/export/soap-note/${soapNoteId}`,
      {
        format: 'html',
        includeSignatures: true
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.html).toBeDefined();
    expect(response.data.data.html).toContain('SOAP Note');
    expect(response.data.data.html).toContain('Subjective');

    console.log('✅ SOAP note exported to HTML');
  }, 15000);

  it('should retrieve patient problem list', async () => {
    const response = await axios.get(
      `${BASE_URL_EHR}/api/v1/problem-list/patient/${testPatientId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        params: {
          activeOnly: true
        }
      }
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.problems).toBeDefined();
    
    if (problemListId) {
      const addedProblem = response.data.data.problems.find((p: any) => p.id === problemListId);
      expect(addedProblem).toBeDefined();
      console.log('✅ Problem list retrieved and verified');
    }
  }, 15000);

  it('should complete full clinical documentation workflow', async () => {
    // Verify all documents were created
    expect(soapNoteId).toBeDefined();
    expect(problemListId).toBeDefined();
    expect(progressNoteId).toBeDefined();

    console.log('✅ Complete clinical documentation workflow successful!');
    console.log(`   SOAP Note: ${soapNoteId}`);
    console.log(`   Problem List: ${problemListId}`);
    console.log(`   Progress Note: ${progressNoteId}`);
  });
});

