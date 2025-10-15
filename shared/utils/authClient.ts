/**
 * Auth Service Client
 * 
 * Helper functions for microservices to interact with the Auth Service
 */

import axios, { AxiosInstance } from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';

class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AUTH_SERVICE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: any;
  }> {
    try {
      const response = await this.client.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        valid: response.data.success,
        user: response.data.user
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: string, token: string): Promise<boolean> {
    try {
      const response = await this.client.get('/api/v1/roles/permissions/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const permissions = response.data.permissions || [];
        
        // Check wildcard
        if (permissions.includes('*')) {
          return true;
        }

        // Check exact permission
        if (permissions.includes(permission)) {
          return true;
        }

        // Check resource wildcard
        const [resource] = permission.split(':');
        if (permissions.includes(`${resource}:*`)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user by ID (service-to-service call)
   */
  async getUserById(userId: string, serviceToken: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${serviceToken}`
        }
      });

      return response.data.success ? response.data.user : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string, userId: string, token: string): Promise<boolean> {
    try {
      const response = await this.client.get('/api/v1/sessions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const sessions = response.data.sessions || [];
        return sessions.some((s: any) => s.id === sessionId);
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
  }> {
    try {
      const response = await this.client.post(
        '/api/v1/auth/refresh-token',
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`
          }
        }
      );

      return {
        success: response.data.success,
        accessToken: response.data.accessToken
      };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(token: string): Promise<boolean> {
    try {
      const response = await this.client.post(
        '/api/v1/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const authClient = new AuthClient();

export default authClient;

