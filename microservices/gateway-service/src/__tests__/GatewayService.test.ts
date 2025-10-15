/**
 * Gateway Service Tests
 */

import { GatewayService } from '../services/GatewayService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(() => {
    service = new GatewayService();
    jest.clearAllMocks();
    // Reset axios mock implementation
    (mockedAxios as any).mockReset = jest.fn();
  });

  describe('Service Registry', () => {
    test('should initialize with default services', () => {
      const authUrl = service.getServiceUrl('auth-service');
      expect(authUrl).toBeDefined();
      expect(authUrl).toContain('localhost');
    });

    test('should return undefined for unknown service', () => {
      const url = service.getServiceUrl('unknown-service');
      expect(url).toBeUndefined();
    });
  });

  describe('makeServiceRequest', () => {
    test('should make successful request to service', async () => {
      const mockData = { success: true, data: { id: '123' } };
      (mockedAxios as any).mockResolvedValue({ data: mockData });

      const result = await service.makeServiceRequest('auth-service', '/api/v1/users');
      
      expect(result).toEqual(mockData);
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/v1/users'),
          timeout: 10000
        })
      );
    });

    test('should throw error for unknown service', async () => {
      await expect(
        service.makeServiceRequest('unknown-service', '/api/v1/test')
      ).rejects.toThrow("Service 'unknown-service' not found in registry");
    });

    test('should handle request failure', async () => {
      (mockedAxios as any).mockRejectedValue(new Error('Network error'));

      await expect(
        service.makeServiceRequest('auth-service', '/api/v1/users')
      ).rejects.toThrow('Network error');
    });
  });

  describe('composeRequests', () => {
    test('should compose multiple requests successfully', async () => {
      const mockResponses = [
        { data: { users: ['user1', 'user2'] } },
        { data: { roles: ['admin', 'user'] } }
      ];

      (mockedAxios as any)
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);

      const result = await service.composeRequests({
        endpoints: [
          { name: 'users', url: 'http://localhost:7020/api/v1/users' },
          { name: 'roles', url: 'http://localhost:7020/api/v1/roles' }
        ],
        mergeStrategy: 'merge'
      });

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('roles');
    });

    test('should handle partial failures with nested strategy', async () => {
      (mockedAxios as any)
        .mockResolvedValueOnce({ data: { users: [] } })
        .mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await service.composeRequests({
        endpoints: [
          { name: 'users', url: 'http://localhost:7020/api/v1/users' },
          { name: 'roles', url: 'http://localhost:7020/api/v1/roles' }
        ],
        mergeStrategy: 'nested'
      });

      expect(result.users).toEqual({ users: [] });
      expect(result.roles).toHaveProperty('error');
    });
  });

  describe('healthCheck', () => {
    test('should return health status of all services', async () => {
      mockedAxios.get = jest.fn()
        .mockResolvedValueOnce({ data: { status: 'healthy' } })
        .mockResolvedValueOnce({ data: { status: 'healthy' } })
        .mockResolvedValueOnce({ data: { status: 'healthy' } });

      const result = await service.healthCheck();

      expect(result).toHaveProperty('auth-service');
      expect(result['auth-service']).toHaveProperty('healthy', true);
      expect(result['auth-service']).toHaveProperty('latency');
    });

    test('should mark unhealthy services', async () => {
      mockedAxios.get = jest.fn()
        .mockRejectedValueOnce(new Error('Connection refused'));

      const result = await service.healthCheck();

      expect(result['auth-service']).toHaveProperty('healthy', false);
      expect(result['auth-service']).toHaveProperty('error');
    });
  });

  describe('transformRequest', () => {
    test('should add gateway headers to request', () => {
      const req = {
        method: 'GET',
        url: '/api/v1/users',
        headers: {}
      };

      const transformed = service.transformRequest(req);

      expect(transformed.headers).toHaveProperty('X-Gateway-Timestamp');
      expect(transformed.headers).toHaveProperty('X-Gateway-Version');
    });
  });

  describe('transformResponse', () => {
    test('should add gateway metadata to response', () => {
      const response = {
        success: true,
        data: { id: '123' }
      };

      const transformed = service.transformResponse(response);

      expect(transformed).toHaveProperty('_gateway');
      expect(transformed._gateway).toHaveProperty('version');
      expect(transformed._gateway).toHaveProperty('timestamp');
    });
  });
});

