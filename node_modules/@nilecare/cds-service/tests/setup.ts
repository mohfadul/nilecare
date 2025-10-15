/**
 * Jest Test Setup
 * 
 * Global setup for all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise during tests

// Mock environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '4002';
process.env.CLIENT_URL = 'http://localhost:3000';

// Increase test timeout for async operations
jest.setTimeout(10000);

// Global test utilities
global.mockDate = new Date('2025-10-14T10:00:00.000Z');

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Export test utilities
export const createMockRequest = (overrides: any = {}): any => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  user: {
    userId: 'test-user',
    role: 'doctor',
    organizationId: 'test-org',
    facilityId: 'test-facility'
  },
  ...overrides
});

export const createMockResponse = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = (): any => jest.fn();

// Common test data
export const testPatientId = '550e8400-e29b-41d4-a716-446655440000';
export const testFacilityId = '660e8400-e29b-41d4-a716-446655440001';
export const testOrganizationId = '770e8400-e29b-41d4-a716-446655440002';
export const testUserId = '880e8400-e29b-41d4-a716-446655440003';

export const testMedication = {
  id: '990e8400-e29b-41d4-a716-446655440004',
  name: 'Metformin',
  dose: '500mg',
  frequency: 'twice daily',
  route: 'oral'
};

export const testAllergy = {
  allergen: 'Penicillin',
  severity: 'severe' as const,
  reaction: 'Anaphylaxis'
};

export const testCondition = {
  code: 'I10',
  name: 'Essential Hypertension',
  status: 'active' as const
};

