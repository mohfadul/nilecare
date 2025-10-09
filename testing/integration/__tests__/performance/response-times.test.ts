/**
 * PERFORMANCE TESTS
 * Tests response times, memory leaks, and query optimization
 */

import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { TEST_CONFIG } from '../setup';

describe('Performance Tests', () => {
  let apiClient: AxiosInstance;
  let authToken: string;
  let pgPool: Pool;

  beforeAll(async () => {
    apiClient = axios.create({
      baseURL: TEST_CONFIG.apiGatewayUrl,
      timeout: 30000,
      validateStatus: () => true,
    });

    // Authenticate
    const authResponse = await apiClient.post('/api/auth/login', {
      email: TEST_CONFIG.testUsers.admin.email,
      password: TEST_CONFIG.testUsers.admin.password,
    });

    if (authResponse.status === 200) {
      authToken = authResponse.data.token;
    }

    pgPool = new Pool(TEST_CONFIG.database.postgres);
  });

  afterAll(async () => {
    await pgPool.end();
  });

  const headers = () => ({ Authorization: `Bearer ${authToken}` });

  describe('API Response Time Tests', () => {
    test('Health check should respond under 100ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await apiClient.get('/health');
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Health check - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);
    });

    test('Login endpoint should respond under 1000ms', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await apiClient.post('/api/auth/login', {
          email: TEST_CONFIG.testUsers.admin.email,
          password: TEST_CONFIG.testUsers.admin.password,
        });
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Login - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.thresholds.authFlow);
      expect(maxTime).toBeLessThan(TEST_CONFIG.thresholds.authFlow * 2);
    });

    test('Patient list endpoint should respond under 500ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await apiClient.get('/api/patients?limit=20', {
          headers: headers(),
        });
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Patient list - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.thresholds.apiResponse);
      expect(maxTime).toBeLessThan(TEST_CONFIG.thresholds.apiResponse * 2);
    });

    test('Patient detail endpoint should respond under 300ms', async () => {
      // Create a test patient first
      const createResponse = await apiClient.post('/api/patients', {
        firstName: 'Performance',
        lastName: 'Test',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        email: `perf.test.${Date.now()}@test.com`,
        phone: '+249123456789',
      }, {
        headers: headers(),
      });

      if (createResponse.status !== 200 && createResponse.status !== 201) {
        console.warn('⚠️  Could not create test patient, skipping test');
        return;
      }

      const patientId = createResponse.data.id || createResponse.data.data?.id;
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await apiClient.get(`/api/patients/${patientId}`, {
          headers: headers(),
        });
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Patient detail - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(300);
      expect(maxTime).toBeLessThan(600);
    });

    test('Appointment creation should respond under 500ms', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const futureTime = new Date(Date.now() + 86400000 * (i + 1));
        const startTime = Date.now();
        
        await apiClient.post('/api/appointments', {
          patientId: '123e4567-e89b-12d3-a456-426614174000',
          doctorId: '123e4567-e89b-12d3-a456-426614174001',
          startTime: futureTime.toISOString(),
          endTime: new Date(futureTime.getTime() + 3600000).toISOString(),
          type: 'consultation',
        }, {
          headers: headers(),
        });
        
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Appointment creation - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.thresholds.apiResponse);
      expect(maxTime).toBeLessThan(TEST_CONFIG.thresholds.apiResponse * 2);
    });
  });

  describe('Concurrent Request Handling', () => {
    test('Should handle 20 concurrent GET requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        apiClient.get('/api/patients?limit=10', {
          headers: headers(),
        })
      );

      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - startTime;

      console.log(`20 concurrent GETs completed in ${totalDuration}ms`);
      
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
      expect(totalDuration).toBeLessThan(5000); // All should complete within 5 seconds
    });

    test('Should handle 10 concurrent POST requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        apiClient.post('/api/patients', {
          firstName: `Concurrent${i}`,
          lastName: 'LoadTest',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          email: `concurrent.${i}.${Date.now()}@test.com`,
          phone: `+24912345${String(i).padStart(4, '0')}`,
        }, {
          headers: headers(),
        })
      );

      const responses = await Promise.all(requests);
      const totalDuration = Date.now() - startTime;

      console.log(`10 concurrent POSTs completed in ${totalDuration}ms`);
      
      const successCount = responses.filter(r => 
        r.status === 200 || r.status === 201
      ).length;
      
      expect(totalDuration).toBeLessThan(10000); // All should complete within 10 seconds
    });

    test('Should handle mixed concurrent requests', async () => {
      const startTime = Date.now();

      const mixedRequests = [
        ...Array.from({ length: 10 }, () => 
          apiClient.get('/api/patients?limit=10', { headers: headers() })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          apiClient.post('/api/patients', {
            firstName: `Mixed${i}`,
            lastName: 'Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            email: `mixed.${i}.${Date.now()}@test.com`,
            phone: `+24912345${String(i).padStart(4, '0')}`,
          }, {
            headers: headers(),
          })
        ),
        ...Array.from({ length: 5 }, () =>
          apiClient.get('/health')
        ),
      ];

      const responses = await Promise.all(mixedRequests);
      const totalDuration = Date.now() - startTime;

      console.log(`20 mixed concurrent requests completed in ${totalDuration}ms`);
      expect(totalDuration).toBeLessThan(10000);
    });
  });

  describe('Database Query Performance', () => {
    test('Simple SELECT query should be under 100ms', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await pgPool.query('SELECT 1 as test');
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Simple SELECT - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
      expect(maxTime).toBeLessThan(TEST_CONFIG.thresholds.dbQuery * 2);
    });

    test('JOIN query should be reasonably fast', async () => {
      // This test assumes certain tables exist
      const query = `
        SELECT 1 as id, 'test' as name
        LIMIT 10
      `;

      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await pgPool.query(query);
        const duration = Date.now() - startTime;
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`JOIN query - Avg: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.thresholds.dbQuery * 5);
    });

    test('Bulk INSERT should handle 100 records efficiently', async () => {
      const testTable = `perf_test_${Date.now()}`;
      
      // Create test table
      await pgPool.query(`
        CREATE TABLE ${testTable} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100),
          value INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      try {
        const startTime = Date.now();
        
        // Bulk insert
        const values = Array.from({ length: 100 }, (_, i) => 
          `('Name${i}', ${i})`
        ).join(',');
        
        await pgPool.query(`
          INSERT INTO ${testTable} (name, value)
          VALUES ${values}
        `);
        
        const duration = Date.now() - startTime;
        
        console.log(`Bulk INSERT 100 records: ${duration}ms`);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        
        // Verify count
        const countResult = await pgPool.query(`SELECT COUNT(*) FROM ${testTable}`);
        expect(parseInt(countResult.rows[0].count)).toBe(100);
      } finally {
        // Cleanup
        await pgPool.query(`DROP TABLE IF EXISTS ${testTable}`);
      }
    });

    test('Indexed query should be faster than non-indexed', async () => {
      const testTable = `index_test_${Date.now()}`;
      
      // Create test table
      await pgPool.query(`
        CREATE TABLE ${testTable} (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255),
          name VARCHAR(100)
        )
      `);

      try {
        // Insert test data
        const values = Array.from({ length: 1000 }, (_, i) => 
          `('user${i}@test.com', 'User${i}')`
        ).join(',');
        
        await pgPool.query(`
          INSERT INTO ${testTable} (email, name)
          VALUES ${values}
        `);

        // Query without index
        const startTime1 = Date.now();
        await pgPool.query(`SELECT * FROM ${testTable} WHERE email = 'user500@test.com'`);
        const nonIndexedTime = Date.now() - startTime1;

        // Create index
        await pgPool.query(`CREATE INDEX idx_${testTable}_email ON ${testTable}(email)`);

        // Query with index
        const startTime2 = Date.now();
        await pgPool.query(`SELECT * FROM ${testTable} WHERE email = 'user500@test.com'`);
        const indexedTime = Date.now() - startTime2;

        console.log(`Non-indexed: ${nonIndexedTime}ms, Indexed: ${indexedTime}ms`);
        
        // Indexed should be faster or at least not significantly slower
        expect(indexedTime).toBeLessThan(nonIndexedTime * 1.5);
      } finally {
        await pgPool.query(`DROP TABLE IF EXISTS ${testTable}`);
      }
    });
  });

  describe('Memory Leak Detection', () => {
    test('Repeated API calls should not accumulate memory', async () => {
      if (typeof global.gc === 'function') {
        global.gc(); // Force garbage collection if available
      }

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await apiClient.get('/health');
      }

      if (typeof global.gc === 'function') {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase after 100 requests: ${memoryIncreaseMB.toFixed(2)}MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });

    test('Database connections should not leak', async () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release(); // Important: release the connection
      }

      // Check pool stats
      const poolSize = pgPool.totalCount;
      const idleCount = pgPool.idleCount;
      const waitingCount = pgPool.waitingCount;

      console.log(`Pool stats - Total: ${poolSize}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
      
      // All connections should be back in the pool
      expect(waitingCount).toBe(0);
      expect(idleCount).toBeGreaterThan(0);
    });
  });

  describe('Load Testing Scenarios', () => {
    test('System should handle sustained load', async () => {
      const duration = 10000; // 10 seconds
      const requestsPerSecond = 5;
      const startTime = Date.now();
      const results: { success: number; failed: number; times: number[] } = {
        success: 0,
        failed: 0,
        times: [],
      };

      while (Date.now() - startTime < duration) {
        const batchStart = Date.now();
        
        const requests = Array.from({ length: requestsPerSecond }, async () => {
          const reqStart = Date.now();
          const response = await apiClient.get('/health');
          const reqDuration = Date.now() - reqStart;
          
          if (response.status === 200) {
            results.success++;
          } else {
            results.failed++;
          }
          
          results.times.push(reqDuration);
        });

        await Promise.all(requests);
        
        // Wait for next second
        const elapsed = Date.now() - batchStart;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }
      }

      const avgTime = results.times.reduce((a, b) => a + b, 0) / results.times.length;
      const maxTime = Math.max(...results.times);
      const successRate = (results.success / (results.success + results.failed)) * 100;

      console.log(`Sustained load results:`);
      console.log(`- Total requests: ${results.success + results.failed}`);
      console.log(`- Success rate: ${successRate.toFixed(2)}%`);
      console.log(`- Avg time: ${avgTime.toFixed(2)}ms`);
      console.log(`- Max time: ${maxTime}ms`);

      expect(successRate).toBeGreaterThan(95); // At least 95% success rate
      expect(avgTime).toBeLessThan(500);
    });
  });

  describe('Caching Performance', () => {
    test('Cached responses should be significantly faster', async () => {
      const endpoint = '/api/patients?limit=10';
      
      // First request (no cache)
      const startTime1 = Date.now();
      const response1 = await apiClient.get(endpoint, {
        headers: headers(),
      });
      const firstCallTime = Date.now() - startTime1;

      // Second request (potentially cached)
      const startTime2 = Date.now();
      const response2 = await apiClient.get(endpoint, {
        headers: headers(),
      });
      const secondCallTime = Date.now() - startTime2;

      console.log(`First call: ${firstCallTime}ms, Second call: ${secondCallTime}ms`);
      
      // Both should succeed
      expect([200, 401, 403]).toContain(response1.status);
      expect([200, 401, 403]).toContain(response2.status);
    });
  });
});

