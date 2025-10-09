/**
 * Test Utility Functions
 * 
 * Shared helpers to reduce code duplication across test suites
 */

import axios, { AxiosInstance } from 'axios';
import { TEST_CONFIG } from '../setup';

// ===== Authentication Helpers =====

/**
 * Creates authorization headers with Bearer token
 */
export const createAuthHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Authenticates a user and returns their token
 * @throws Error if authentication fails
 */
export const authenticateUser = async (
  apiClient: AxiosInstance,
  email: string,
  password: string
): Promise<string> => {
  try {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });

    if (response.status === 200 && response.data.token) {
      return response.data.token;
    }

    throw new Error(`Authentication failed with status ${response.status}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Authentication error: ${message}`);
  }
};

/**
 * Authenticates the admin test user
 */
export const authenticateAdmin = async (apiClient: AxiosInstance): Promise<string> => {
  return authenticateUser(
    apiClient,
    TEST_CONFIG.testUsers.admin.email,
    TEST_CONFIG.testUsers.admin.password
  );
};

// ===== API Client Helpers =====

/**
 * Creates a configured axios instance for testing
 */
export const createApiClient = (
  baseURL: string,
  timeout: number = 10000
): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout,
    validateStatus: () => true, // Don't throw on any status code
  });
};

// ===== Data Generation Helpers =====

/**
 * Generates a unique test email address
 */
export const generateTestEmail = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}.${timestamp}.${random}@test.com`;
};

/**
 * Generates a test phone number for Sudan
 */
export const generateTestPhone = (index: number): string => {
  return `+24912345${String(index).padStart(4, '0')}`;
};

/**
 * Creates base patient data for testing
 */
export const createTestPatientData = (overrides: Record<string, any> = {}) => ({
  firstName: 'Test',
  lastName: 'Patient',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  email: generateTestEmail('patient'),
  phone: '+249123456789',
  ...overrides,
});

// ===== Request Helpers =====

/**
 * Creates a test patient via API
 */
export const createTestPatient = async (
  apiClient: AxiosInstance,
  token: string,
  overrides: Record<string, any> = {}
) => {
  return await apiClient.post(
    '/api/patients',
    createTestPatientData(overrides),
    { headers: createAuthHeaders(token) }
  );
};

/**
 * Creates a test appointment via API
 */
export const createTestAppointment = async (
  apiClient: AxiosInstance,
  token: string,
  patientId: string,
  doctorId: string,
  daysFromNow: number = 1
) => {
  const { startTime, endTime } = createAppointmentTimes(daysFromNow, 1);
  
  return await apiClient.post(
    '/api/appointments',
    {
      patientId,
      doctorId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: 'consultation',
    },
    { headers: createAuthHeaders(token) }
  );
};

// ===== Date/Time Helpers =====

/**
 * Creates a future date for testing
 */
export const createFutureDate = (daysFromNow: number, hours: number = 0): Date => {
  return new Date(Date.now() + (daysFromNow * TIME_INTERVALS.ONE_DAY) + (hours * TIME_INTERVALS.ONE_HOUR));
};

/**
 * Creates appointment start and end times
 */
export const createAppointmentTimes = (daysFromNow: number, durationHours: number = 1) => ({
  startTime: createFutureDate(daysFromNow),
  endTime: createFutureDate(daysFromNow, durationHours),
});

// ===== Assertion Helpers =====

/**
 * Asserts that response is not a server error
 */
export const expectNoServerError = (status: number): void => {
  expect(status).not.toBe(500);
  expect(status).not.toBe(502);
  expect(status).not.toBe(503);
  expect(status).not.toBe(504);
};

/**
 * Asserts that response is a successful creation
 */
export const expectSuccessfulCreation = (response: any): void => {
  expect([200, 201]).toContain(response.status);
  expectNoServerError(response.status);
};

/**
 * Asserts that response is unauthorized
 */
export const expectUnauthorized = (response: any): void => {
  expect([401, 403]).toContain(response.status);
  expectNoServerError(response.status);
};

/**
 * Asserts that response is a validation error
 */
export const expectValidationError = (response: any): void => {
  expect([400]).toContain(response.status);
  expectNoServerError(response.status);
};

// ===== Data Extraction Helpers =====

/**
 * Extracts ID from various response formats
 */
export const extractId = (response: any): string | undefined => {
  return response.data?.id || response.data?.data?.id;
};

/**
 * Extracts ID from response or throws error
 */
export const extractIdOrThrow = (response: any, entityName: string = 'entity'): string => {
  const id = extractId(response);
  if (!id) {
    throw new Error(`Failed to extract ${entityName} ID from response`);
  }
  return id;
};

// ===== Performance Helpers =====

/**
 * Measures duration of async operation
 */
export const measureDuration = async <T>(
  fn: () => Promise<T>,
  maxDuration: number,
  label?: string
): Promise<T> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  if (label) {
    console.log(`⏱️  ${label}: ${duration}ms`);
  }
  
  expect(duration).toBeLessThan(maxDuration);
  return result;
};

/**
 * Executes requests in parallel
 */
export const executeInParallel = async <T>(
  items: T[],
  fn: (item: T) => Promise<any>
): Promise<any[]> => {
  return await Promise.all(items.map(fn));
};

// ===== Cleanup Helpers =====

/**
 * Safely deletes a resource, ignoring errors
 */
export const safeDelete = async (
  apiClient: AxiosInstance,
  url: string,
  token: string
): Promise<void> => {
  try {
    await apiClient.delete(url, {
      headers: createAuthHeaders(token),
    });
  } catch (error) {
    // Ignore cleanup errors
    console.warn(`Failed to clean up ${url}:`, error);
  }
};

// ===== Constants =====

export const TIME_INTERVALS = {
  ONE_HOUR: 3600000,
  ONE_DAY: 86400000,
  TWO_DAYS: 172800000,
  ONE_WEEK: 604800000,
};

export const TEST_UUIDS = {
  PATIENT: '123e4567-e89b-12d3-a456-426614174000',
  DOCTOR: '123e4567-e89b-12d3-a456-426614174001',
  APPOINTMENT: '123e4567-e89b-12d3-a456-426614174002',
  LAB_ORDER: '123e4567-e89b-12d3-a456-426614174003',
  MEDICATION: '123e4567-e89b-12d3-a456-426614174004',
  PAYMENT: '123e4567-e89b-12d3-a456-426614174005',
};

export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
};

