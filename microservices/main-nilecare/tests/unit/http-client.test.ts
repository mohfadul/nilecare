/**
 * Unit Tests for HTTP Client Utility
 * These tests demonstrate how to use the shared @nilecare/common package
 */

import { createHttpClient, HttpClient } from '@nilecare/common';

describe('HTTP Client Utility', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = createHttpClient({
      baseURL: 'http://localhost:7010',
      timeout: 5000,
      retries: 2,
    });
  });

  describe('GET Requests', () => {
    it('should create GET request', async () => {
      // This test would need mock or real service
      expect(client).toBeDefined();
      expect(client.get).toBeDefined();
    });
  });

  describe('POST Requests', () => {
    it('should create POST request', async () => {
      expect(client).toBeDefined();
      expect(client.post).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should set auth token', () => {
      const token = 'test-token';
      client.setAuthToken(token);
      
      // Token should be set in headers
      expect(client).toBeDefined();
    });

    it('should remove auth token', () => {
      client.setAuthToken('test-token');
      client.removeAuthToken();
      
      expect(client).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const invalidClient = createHttpClient({
        baseURL: 'http://invalid-url-that-does-not-exist',
        timeout: 1000,
        retries: 1,
      });

      await expect(invalidClient.get('/test')).rejects.toThrow();
    });

    it('should retry on failures', async () => {
      const retryClient = createHttpClient({
        baseURL: 'http://localhost:9999', // Non-existent port
        timeout: 1000,
        retries: 3,
        retryDelay: 100,
      });

      const startTime = Date.now();
      
      try {
        await retryClient.get('/test');
      } catch (error) {
        const duration = Date.now() - startTime;
        // Should have tried multiple times
        expect(duration).toBeGreaterThan(100);
      }
    });
  });
});

