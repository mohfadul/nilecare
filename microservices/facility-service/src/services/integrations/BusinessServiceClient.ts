import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { ExternalServiceError } from '../../middleware/errorHandler';

/**
 * Business Service Client
 * Integration with Business Service for organization management
 */

export class BusinessServiceClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BUSINESS_SERVICE_URL || 'http://localhost:7010';
    this.apiKey = process.env.BUSINESS_SERVICE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('BUSINESS_SERVICE_API_KEY not configured - Business Service integration disabled');
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
   * Get organization by ID
   */
  async getOrganizationById(organizationId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/v1/organizations/${organizationId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting organization from Business Service', {
        organizationId,
        error: error.message,
        status: error.response?.status,
      });

      if (error.response?.status === 404) {
        return null;
      }

      throw new ExternalServiceError('Failed to get organization info');
    }
  }

  /**
   * Validate organization ownership
   */
  async validateOrganizationOwnership(organizationId: string, userId: string): Promise<boolean> {
    try {
      const response = await this.client.post('/api/v1/organizations/validate-ownership', {
        organizationId,
        userId,
      });

      return response.data.data?.isOwner || false;
    } catch (error: any) {
      logger.error('Error validating organization ownership', {
        organizationId,
        userId,
        error: error.message,
      });

      // Fail closed - deny ownership on error
      return false;
    }
  }

  /**
   * Get organization facilities
   */
  async getOrganizationFacilities(organizationId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/v1/organizations/${organizationId}/facilities`);
      return response.data.data?.facilities || [];
    } catch (error: any) {
      logger.error('Error getting organization facilities from Business Service', {
        organizationId,
        error: error.message,
      });

      return [];
    }
  }

  /**
   * Notify Business Service of new facility
   */
  async notifyFacilityCreated(facilityId: string, organizationId: string, facilityData: any): Promise<void> {
    try {
      await this.client.post('/api/v1/facilities/notify-created', {
        facilityId,
        organizationId,
        facilityData,
      });

      logger.info('Notified Business Service of facility creation', {
        facilityId,
        organizationId,
      });
    } catch (error: any) {
      // Log error but don't throw - this is a non-critical notification
      logger.warn('Failed to notify Business Service of facility creation', {
        facilityId,
        error: error.message,
      });
    }
  }

  /**
   * Check if Business Service is available
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

export default BusinessServiceClient;

