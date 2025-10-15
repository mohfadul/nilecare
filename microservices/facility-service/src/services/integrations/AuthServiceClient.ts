import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { ExternalServiceError } from '../../middleware/errorHandler';

/**
 * Auth Service Client
 * Integration with Authentication Service
 */

export class AuthServiceClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
    this.apiKey = process.env.AUTH_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('AUTH_SERVICE_API_KEY not configured - Auth Service integration disabled');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/auth/validate-token', {
        token,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error validating token with Auth Service', {
        error: error.message,
        status: error.response?.status,
      });

      throw new ExternalServiceError('Token validation failed', 401);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting user from Auth Service', {
        userId,
        error: error.message,
      });

      if (error.response?.status === 404) {
        return null;
      }

      throw new ExternalServiceError('Failed to get user info');
    }
  }

  /**
   * Get user facilities
   */
  async getUserFacilities(userId: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}/facilities`);
      return response.data.data?.facilities || [];
    } catch (error: any) {
      logger.error('Error getting user facilities from Auth Service', {
        userId,
        error: error.message,
      });

      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/auth/check-permission', {
        userId,
        permission,
      });

      return response.data.data?.hasPermission || false;
    } catch (error: any) {
      logger.error('Error checking permission with Auth Service', {
        userId,
        permission,
        error: error.message,
      });

      // Fail closed - deny permission on error
      return false;
    }
  }

  /**
   * Get users by facility
   */
  async getUsersByFacility(facilityId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/facilities/${facilityId}/users`);
      return response.data.data?.users || [];
    } catch (error: any) {
      logger.error('Error getting facility users from Auth Service', {
        facilityId,
        error: error.message,
      });

      return [];
    }
  }

  /**
   * Check if Auth Service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default AuthServiceClient;

