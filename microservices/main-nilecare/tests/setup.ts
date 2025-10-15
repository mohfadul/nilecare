/**
 * Jest Test Setup
 * Run before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'nilecare_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(() => {
  // Close any open connections, cleanup resources
});

