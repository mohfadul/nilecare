/**
 * Jest Test Setup for EHR Service
 * 
 * Global setup for all EHR service tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_ehr_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_ehr_db';
process.env.PORT = '4001';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.AUTH_SERVICE_URL = 'http://localhost:7020';

// Increase test timeout
jest.setTimeout(10000);

// Mock console to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test utilities
export const createMockRequest = (overrides: any = {}): any => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  user: {
    userId: 'test-user-id',
    role: 'doctor',
    organizationId: 'test-org-id',
    facilityId: 'test-facility-id'
  },
  facilityContext: {
    facilityId: 'test-facility-id',
    organizationId: 'test-org-id',
    userId: 'test-user-id',
    userRole: 'doctor',
    canAccessMultipleFacilities: false
  },
  ...overrides
});

export const createMockResponse = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = (): any => jest.fn();

// Common test UUIDs
export const TEST_IDS = {
  patient: '550e8400-e29b-41d4-a716-446655440000',
  encounter: '660e8400-e29b-41d4-a716-446655440001',
  facility: '770e8400-e29b-41d4-a716-446655440002',
  organization: '880e8400-e29b-41d4-a716-446655440003',
  user: '990e8400-e29b-41d4-a716-446655440004',
  soapNote: 'aa0e8400-e29b-41d4-a716-446655440005',
  problemList: 'bb0e8400-e29b-41d4-a716-446655440006',
  progressNote: 'cc0e8400-e29b-41d4-a716-446655440007'
};

// Common test data
export const testSOAPNote = {
  id: TEST_IDS.soapNote,
  patientId: TEST_IDS.patient,
  encounterId: TEST_IDS.encounter,
  facilityId: TEST_IDS.facility,
  organizationId: TEST_IDS.organization,
  subjective: 'Patient reports persistent headache for 3 days',
  objective: 'BP 130/85, HR 78, HEENT normal',
  assessment: 'Tension headache',
  plan: 'Ibuprofen 400mg TID PRN, follow-up in 1 week',
  status: 'draft' as const,
  version: 1,
  createdBy: TEST_IDS.user,
  createdAt: new Date('2025-10-14T10:00:00Z'),
  updatedAt: new Date('2025-10-14T10:00:00Z')
};

export const testProblemListItem = {
  id: TEST_IDS.problemList,
  patientId: TEST_IDS.patient,
  facilityId: TEST_IDS.facility,
  organizationId: TEST_IDS.organization,
  problemName: 'Essential Hypertension',
  icdCode: 'I10',
  severity: 'moderate' as const,
  status: 'chronic' as const,
  category: 'diagnosis' as const,
  priority: 'medium' as const,
  isChronicCondition: true,
  requiresMonitoring: true,
  monitoringInterval: '3 months',
  version: 1,
  createdBy: TEST_IDS.user,
  createdAt: new Date('2025-10-14T10:00:00Z'),
  updatedAt: new Date('2025-10-14T10:00:00Z')
};

export const testProgressNote = {
  id: TEST_IDS.progressNote,
  patientId: TEST_IDS.patient,
  facilityId: TEST_IDS.facility,
  organizationId: TEST_IDS.organization,
  noteType: 'daily' as const,
  noteDate: new Date('2025-10-14'),
  content: 'Patient stable overnight. Vitals within normal limits.',
  condition: 'stable' as const,
  status: 'draft' as const,
  followUpNeeded: false,
  isAmendment: false,
  version: 1,
  createdBy: TEST_IDS.user,
  createdAt: new Date('2025-10-14T10:00:00Z'),
  updatedAt: new Date('2025-10-14T10:00:00Z')
};

