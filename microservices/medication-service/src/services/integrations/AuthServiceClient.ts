import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

/**
 * Authentication Service Client
 * Handles communication with the centralized Auth Service
 */

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  facilityId?: string;
  organizationId: string;
  permissions: string[];
}

export class AuthServiceClient {
  private client: AxiosInstance;
  private authServiceUrl: string;
  private apiKey: string;

  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';
    this.apiKey = process.env.AUTH_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('AUTH_SERVICE_API_KEY not configured. Service-to-service calls may fail.');
    }

    this.client = axios.create({
      baseURL: this.authServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'medication-service',
        'X-API-Key': this.apiKey,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Auth Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Auth Service Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Auth Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Auth Service Response Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<UserInfo | null> {
    try {
      const response = await this.client.post('/api/auth/validate-token', { token });

      if (response.data.success && response.data.data) {
        return {
          userId: response.data.data.userId,
          email: response.data.data.email,
          role: response.data.data.role,
          facilityId: response.data.data.facilityId,
          organizationId: response.data.data.organizationId,
          permissions: response.data.data.permissions || [],
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Token validation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/auth/check-permission', {
        userId,
        permission,
      });

      return response.data.success && response.data.data?.hasPermission === true;
    } catch (error: any) {
      logger.error('Permission check failed', { error: error.message, userId, permission });
      return false;
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    try {
      const response = await this.client.get(`/api/users/${userId}`);

      if (response.data.success && response.data.data) {
        return {
          userId: response.data.data.id,
          email: response.data.data.email,
          role: response.data.data.role,
          facilityId: response.data.data.facilityId,
          organizationId: response.data.data.organizationId,
          permissions: response.data.data.permissions || [],
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Get user by ID failed', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Verify user is active and not suspended
   */
  async verifyUserStatus(userId: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/api/users/${userId}/status`);
      return response.data.success && response.data.data?.status === 'active';
    } catch (error: any) {
      logger.error('User status verification failed', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error: any) {
      logger.error('Auth Service health check failed', { error: error.message });
      return false;
    }
  }
}

export default AuthServiceClient;

