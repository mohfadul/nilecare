import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

// Global test configuration
export const TEST_CONFIG = {
  apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  clinicalServiceUrl: process.env.CLINICAL_SERVICE_URL || 'http://localhost:3002',
  businessServiceUrl: process.env.BUSINESS_SERVICE_URL || 'http://localhost:3003',
  dataServiceUrl: process.env.DATA_SERVICE_URL || 'http://localhost:3004',
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  
  testUsers: {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    },
    doctor: {
      email: process.env.TEST_DOCTOR_EMAIL!,
      password: process.env.TEST_DOCTOR_PASSWORD!,
    },
    patient: {
      email: process.env.TEST_PATIENT_EMAIL!,
      password: process.env.TEST_PATIENT_PASSWORD!,
    },
  },
  
  thresholds: {
    apiResponse: parseInt(process.env.API_RESPONSE_THRESHOLD || '500'),
    dbQuery: parseInt(process.env.DB_QUERY_THRESHOLD || '100'),
    authFlow: parseInt(process.env.AUTH_FLOW_THRESHOLD || '1000'),
  },
  
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'nilecare_test',
      user: process.env.POSTGRES_USER || 'nilecare_test',
      password: process.env.POSTGRES_PASSWORD || 'test_password',
    },
    mongodb: process.env.MONGO_URI || 'mongodb://localhost:27017/nilecare_test',
    redis: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

// Global setup
beforeAll(async () => {
  console.log('🚀 Starting integration tests...');
  console.log('📍 API Gateway:', TEST_CONFIG.apiGatewayUrl);
});

// Global teardown
afterAll(async () => {
  console.log('✅ Integration tests completed');
});

// Helper function to wait for services to be ready
export async function waitForService(url: string, timeout = 30000): Promise<boolean> {
  const startTime = Date.now();
  const axios = require('axios');
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 2000 });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Service not ready yet
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

// Helper to clean up test data
export async function cleanupTestData(): Promise<void> {
  // This will be implemented based on your cleanup strategy
  console.log('🧹 Cleaning up test data...');
}

